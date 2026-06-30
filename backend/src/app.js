require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const multer   = require('multer')
const jwt      = require('jsonwebtoken')
const bcrypt   = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const { submitRegistrasi, cekStatus, validasiNIK }    = require('./controllers/registrasiController')
const { analyzeReceiptHandler }                        = require('./controllers/geminiController')
const {
  listPeserta, detailPeserta, verifikasiPeserta, dashboard,
  listTokenPending, detailTokenPending, verifikasiTokenPending,
  getProfile, updateProfile, changeProfilePassword,
  listAdminUsers, createAdminUser, updateAdminUser, changeAdminUserPassword,
} = require('./controllers/adminController')
const { jalankanUndian, listPemenang, toggleUmumkan } = require('./controllers/undianController')
const { requireAuth, requireSuperAdmin } = require('./middleware/auth')
const errorHandler = require('./middleware/errorHandler')

const prisma = new PrismaClient()
const app    = express()
const PORT   = process.env.PORT || 3001

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)) {
      return cb(Object.assign(new Error('Format file tidak didukung'), { status: 400 }))
    }
    cb(null, true)
  },
})

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }))
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date() }))

// ── Public ────────────────────────────────────────────────────────────────────
app.get('/api/program', (req, res) => res.json({
  success: true,
  data: { nama: 'Program Undian MITO Jawa Timur', periode: { mulai: '2026-08-01', selesai: '2026-10-31' }, area: 'Jawa Timur', tokenPer: 500000, status: 'AKTIF' },
}))

app.post('/api/registrasi', upload.single('struk'), submitRegistrasi)
app.get('/api/registrasi/validasi/nik', validasiNIK)
app.get('/api/registrasi/:idRegistrasi', cekStatus)
app.post('/api/analyze-receipt', upload.single('struk'), analyzeReceiptHandler)

app.get('/api/pemenang', async (req, res, next) => {
  try {
    const pemenang = await prisma.pemenang.findMany({
      where: { diumumkan: true },
      include: { peserta: { select: { namaLengkap: true, noHp: true, idRegistrasi: true } } },
      orderBy: { tglUndian: 'desc' },
    })
    res.json({ success: true, data: pemenang })
  } catch (err) { next(err) }
})

// Leaderboard publik — peserta approved diurutkan token terbanyak
app.get('/api/peserta-publik', async (req, res, next) => {
  try {
    const { q } = req.query
    const where = { statusVerif: 'APPROVED', jumlahToken: { gt: 0 } }
    if (q) where.namaLengkap = { contains: q, mode: 'insensitive' }
 
    const peserta = await prisma.peserta.findMany({
      where,
      orderBy: { jumlahToken: 'desc' },
      select: {
        id: true,
        idRegistrasi: true,
        namaLengkap: true,
        jumlahToken: true,
      },
    })
    res.json({ success: true, data: peserta })
  } catch (err) { next(err) }
})

// ── Admin auth ─────────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' })
    const admin = await prisma.adminUser.findUnique({ where: { username } })
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' })
    }
    const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' })
    res.json({ success: true, token, role: admin.role, username: admin.username, avatarUrl: admin.avatarUrl || null })
  } catch (err) { next(err) }
})

// ── Admin — peserta ────────────────────────────────────────────────────────────
app.get('/api/admin/dashboard',                       requireAuth, dashboard)
app.get('/api/admin/peserta',                         requireAuth, listPeserta)
app.get('/api/admin/peserta/:id',                     requireAuth, detailPeserta)
app.put('/api/admin/peserta/:id/verifikasi',          requireAuth, verifikasiPeserta)

// ── Admin — profile + user management ───────────────────────────────────────────
app.get('/api/admin/profile',                         requireAuth, getProfile)
app.put('/api/admin/profile',                          requireAuth, upload.single('avatar'), updateProfile)
app.put('/api/admin/profile/password',                requireAuth, changeProfilePassword)
app.get('/api/admin/users',                           requireSuperAdmin, listAdminUsers)
app.post('/api/admin/users',                          requireSuperAdmin, upload.single('avatar'), createAdminUser)
app.put('/api/admin/users/:id',                       requireSuperAdmin, upload.single('avatar'), updateAdminUser)
app.put('/api/admin/users/:id/password',              requireSuperAdmin, changeAdminUserPassword)

// ── Admin — token pending (pembelian ulang) ────────────────────────────────────
app.get('/api/admin/token-pending',                   requireAuth, listTokenPending)
app.get('/api/admin/token-pending/:id',               requireAuth, detailTokenPending)
app.put('/api/admin/token-pending/:id/verifikasi',    requireAuth, verifikasiTokenPending)

// ── Admin — undian & pemenang ──────────────────────────────────────────────────
app.post('/api/admin/undian',                         requireSuperAdmin, jalankanUndian)
app.get('/api/admin/pemenang',                        requireAuth, listPemenang)
app.put('/api/admin/pemenang/:id/umumkan',            requireSuperAdmin, toggleUmumkan)

app.use((req, res) => res.status(404).json({ success: false, message: `Route tidak ditemukan: ${req.method} ${req.path}` }))
app.use(errorHandler)

// Only listen when running directly (not on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0' , () => {
    console.log(`\n✅ MITO Undian API → http://localhost:${PORT}  [${process.env.NODE_ENV || 'dev'}]\n`)
  })
}

module.exports = app
