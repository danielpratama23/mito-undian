/**
 * adminController.js
 * Verifikasi peserta baru + token_pending (pembelian ulang)
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { hitungToken }  = require('../services/geminiService')
const { uploadFile }   = require('../services/storageService')

const prisma = new PrismaClient()

async function getProfile(req, res) {
  const admin = await prisma.adminUser.findUnique({
    where: { id: req.admin.id },
    select: { id: true, username: true, role: true, avatarUrl: true, createdAt: true },
  })
  if (!admin) return res.status(404).json({ success: false, message: 'Admin tidak ditemukan' })
  return res.json({ success: true, data: admin })
}

async function changeProfilePassword(req, res) {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi' })
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: req.admin.id } })
  if (!admin || !(await bcrypt.compare(currentPassword, admin.password))) {
    return res.status(401).json({ success: false, message: 'Password lama tidak cocok' })
  }

  await prisma.adminUser.update({
    where: { id: req.admin.id },
    data: { password: await bcrypt.hash(newPassword, 12) },
  })

  return res.json({ success: true, message: 'Password berhasil diperbarui' })
}

async function updateProfile(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Avatar wajib diunggah untuk memperbarui profil' })
  }

  const avatarUrl = await uploadFile(req.file, 'avatars')
  const updated = await prisma.adminUser.update({
    where: { id: req.admin.id },
    data: { avatarUrl },
    select: { id: true, username: true, role: true, avatarUrl: true, createdAt: true },
  })

  return res.json({ success: true, data: updated })
}

async function listAdminUsers(req, res) {
  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, role: true, avatarUrl: true, createdAt: true },
  })
  return res.json({ success: true, data: admins })
}

async function createAdminUser(req, res) {
  const { username, password, role } = req.body
  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'Username, password, dan role wajib diisi' })
  }
  if (!['superadmin', 'verifikator'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role tidak valid' })
  }

  const existing = await prisma.adminUser.findUnique({ where: { username } })
  if (existing) return res.status(409).json({ success: false, message: 'Username sudah digunakan' })

  const data = {
    username,
    password: await bcrypt.hash(password, 12),
    role,
  }

  if (req.file) {
    data.avatarUrl = await uploadFile(req.file, 'avatars')
  }

  const admin = await prisma.adminUser.create({ data })
  return res.status(201).json({ success: true, data: {
    id: admin.id,
    username: admin.username,
    role: admin.role,
    avatarUrl: admin.avatarUrl,
    createdAt: admin.createdAt,
  }})
}

async function updateAdminUser(req, res) {
  const { id } = req.params
  const { username, role } = req.body

  const admin = await prisma.adminUser.findUnique({ where: { id } })
  if (!admin) return res.status(404).json({ success: false, message: 'Admin tidak ditemukan' })

  if (username) {
    const duplicate = await prisma.adminUser.findUnique({ where: { username } })
    if (duplicate && duplicate.id !== id) {
      return res.status(409).json({ success: false, message: 'Username sudah digunakan' })
    }
  }

  const data = {}
  if (username) data.username = username
  if (role) {
    if (!['superadmin', 'verifikator'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role tidak valid' })
    }
    data.role = role
  }
  if (req.file) {
    data.avatarUrl = await uploadFile(req.file, 'avatars')
  }

  const updated = await prisma.adminUser.update({ where: { id }, data })
  return res.json({ success: true, data: {
    id: updated.id,
    username: updated.username,
    role: updated.role,
    avatarUrl: updated.avatarUrl,
    createdAt: updated.createdAt,
  }})
}

async function changeAdminUserPassword(req, res) {
  const { id } = req.params
  const { newPassword } = req.body
  if (!newPassword) {
    return res.status(400).json({ success: false, message: 'Password baru wajib diisi' })
  }

  const admin = await prisma.adminUser.findUnique({ where: { id } })
  if (!admin) return res.status(404).json({ success: false, message: 'Admin tidak ditemukan' })

  await prisma.adminUser.update({
    where: { id },
    data: { password: await bcrypt.hash(newPassword, 12) },
  })

  return res.json({ success: true, message: 'Password user berhasil diubah' })
}

// ── GET /api/admin/peserta ────────────────────────────────────────────────────
async function listPeserta(req, res) {
  const { status, page = 1, limit = 20, q } = req.query
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const where = {}
  if (status) where.statusVerif = status
  if (q) {
    where.OR = [
      { namaLengkap: { contains: q, mode: 'insensitive' } },
      { idRegistrasi: { contains: q } },
      { nik: { contains: q } },
    ]
  }

  const [peserta, total] = await Promise.all([
    prisma.peserta.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { tglRegistrasi: 'desc' },
      select: {
        id: true, idRegistrasi: true, namaLengkap: true, nik: true, noHp: true,
        imeiList: true, nominalBeli: true, statusVerif: true, jumlahToken: true,
        tglRegistrasi: true,
        _count: { select: { tokenPendings: true } },
      },
    }),
    prisma.peserta.count({ where }),
  ])

  return res.json({
    success: true,
    data: peserta,
    meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  })
}

// ── GET /api/admin/peserta/:id ────────────────────────────────────────────────
async function detailPeserta(req, res) {
  const peserta = await prisma.peserta.findUnique({
    where: { id: req.params.id },
    include: {
      tokenLogs: { orderBy: { createdAt: 'desc' } },
      tokenPendings: {
        orderBy: { tglSubmit: 'desc' },
      },
    },
  })
  if (!peserta) return res.status(404).json({ success: false, message: 'Peserta tidak ditemukan' })
  return res.json({ success: true, data: peserta })
}

// ── PUT /api/admin/peserta/:id/verifikasi ─────────────────────────────────────
async function verifikasiPeserta(req, res) {
  const { action, alasanReject } = req.body
  const { id } = req.params

  if (!['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action harus APPROVE atau REJECT' })
  }

  const peserta = await prisma.peserta.findUnique({ where: { id } })
  if (!peserta) return res.status(404).json({ success: false, message: 'Peserta tidak ditemukan' })
  if (peserta.statusVerif !== 'PENDING') {
    return res.status(400).json({ success: false, message: `Peserta sudah berstatus ${peserta.statusVerif}` })
  }

  if (action === 'REJECT') {
    if (!alasanReject) return res.status(400).json({ success: false, message: 'Alasan reject wajib diisi' })
    await prisma.peserta.update({ where: { id }, data: { statusVerif: 'REJECTED', alasanReject } })
    return res.json({ success: true, message: 'Peserta berhasil di-reject' })
  }

  // APPROVE → hitung token via Gemini
  try {
    const imeiList = Array.isArray(peserta.imeiList) ? peserta.imeiList : []
    const geminiResult = await hitungToken({
      nama:        peserta.namaLengkap,
      nik:         peserta.nik,
      imei:        imeiList.join(', '),
      nominalBeli: peserta.nominalBeli,
      odooHarga:   null,
    })

    const [updatedPeserta] = await prisma.$transaction([
      prisma.peserta.update({
        where: { id },
        data: {
          statusVerif: 'APPROVED',
          jumlahToken: geminiResult.tokenCount,
          ikutUndian:  geminiResult.tokenCount > 0,
        },
      }),
      prisma.tokenLog.create({
        data: {
          pesertaId:  id,
          jumlah:     geminiResult.tokenCount,
          sumber:     'registrasi',
          geminiRaw:  geminiResult.geminiRaw || {},
        },
      }),
    ])

    return res.json({
      success: true,
      message: `Peserta disetujui. Token: ${geminiResult.tokenCount}`,
      data: {
        idRegistrasi:  updatedPeserta.idRegistrasi,
        jumlahToken:   updatedPeserta.jumlahToken,
        catatan:       geminiResult.catatan,
        isSuspicious:  geminiResult.isSuspicious,
      },
    })
  } catch (err) {
    console.error('[Admin] Gemini error:', err)
    return res.status(500).json({ success: false, message: 'Kalkulasi token gagal. Silakan coba lagi.' })
  }
}

// ── GET /api/admin/token-pending ──────────────────────────────────────────────
// List semua pembelian ulang yang perlu diverifikasi
async function listTokenPending(req, res) {
  const { status, page = 1, limit = 20, q } = req.query
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const where = {}
  if (status) where.status = status
  if (q) {
    where.peserta = {
      OR: [
        { namaLengkap: { contains: q, mode: 'insensitive' } },
        { idRegistrasi: { contains: q } },
        { nik: { contains: q } },
      ],
    }
  }

  const [items, total] = await Promise.all([
    prisma.tokenPending.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { tglSubmit: 'desc' },
      include: {
        peserta: {
          select: {
            id: true, idRegistrasi: true, namaLengkap: true,
            nik: true, noHp: true, jumlahToken: true, statusVerif: true,
          },
        },
      },
    }),
    prisma.tokenPending.count({ where }),
  ])

  return res.json({
    success: true,
    data: items,
    meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  })
}

// ── GET /api/admin/token-pending/:id ─────────────────────────────────────────
async function detailTokenPending(req, res) {
  const item = await prisma.tokenPending.findUnique({
    where: { id: req.params.id },
    include: {
      peserta: {
        select: {
          id: true, idRegistrasi: true, namaLengkap: true, nik: true,
          noHp: true, jumlahToken: true,
        },
      },
    },
  })
  if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' })
  return res.json({ success: true, data: item })
}

// ── PUT /api/admin/token-pending/:id/verifikasi ───────────────────────────────
async function verifikasiTokenPending(req, res) {
  const { action, alasanReject } = req.body
  const { id } = req.params

  if (!['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action harus APPROVE atau REJECT' })
  }

  const item = await prisma.tokenPending.findUnique({
    where: { id },
    include: { peserta: true },
  })
  if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' })
  if (item.status !== 'PENDING') {
    return res.status(400).json({ success: false, message: `Sudah berstatus ${item.status}` })
  }

  if (action === 'REJECT') {
    if (!alasanReject) return res.status(400).json({ success: false, message: 'Alasan reject wajib diisi' })
    await prisma.tokenPending.update({
      where: { id },
      data: { status: 'REJECTED', alasanReject, tglVerif: new Date() },
    })
    return res.json({ success: true, message: 'Pembelian ulang ditolak' })
  }

  // APPROVE → hitung token via Gemini
  try {
    const imeiList = Array.isArray(item.imeiList) ? item.imeiList : []
    const geminiResult = await hitungToken({
      nama:        item.peserta.namaLengkap,
      nik:         item.peserta.nik,
      imei:        imeiList.join(', '),
      nominalBeli: item.nominalBeli,
      odooHarga:   null,
    })

    const tokenBaru = geminiResult.tokenCount
    const tokenSebelumnya = item.peserta.jumlahToken

    await prisma.$transaction([
      // Update token_pending jadi APPROVED
      prisma.tokenPending.update({
        where: { id },
        data: {
          status:         'APPROVED',
          tokenDiberikan: tokenBaru,
          geminiRaw:      geminiResult.geminiRaw || {},
          tglVerif:       new Date(),
        },
      }),
      // Tambahkan token ke peserta (akumulasi)
      prisma.peserta.update({
        where: { id: item.pesertaId },
        data: {
          jumlahToken: { increment: tokenBaru },
          ikutUndian:  true,
        },
      }),
      // Catat di token_log
      prisma.tokenLog.create({
        data: {
          pesertaId:     item.pesertaId,
          jumlah:        tokenBaru,
          sumber:        'pembelian_ulang',
          tokenPendingId: id,
          geminiRaw:     geminiResult.geminiRaw || {},
        },
      }),
    ])

    return res.json({
      success: true,
      message: `Disetujui! +${tokenBaru} token (total: ${tokenSebelumnya + tokenBaru})`,
      data: {
        tokenBaru,
        totalToken:   tokenSebelumnya + tokenBaru,
        catatan:      geminiResult.catatan,
        isSuspicious: geminiResult.isSuspicious,
      },
    })
  } catch (err) {
    console.error('[Admin] Token pending Gemini error:', err)
    return res.status(500).json({ success: false, message: 'Kalkulasi token gagal. Silakan coba lagi.' })
  }
}

// ── GET /api/admin/dashboard ──────────────────────────────────────────────────
async function dashboard(req, res) {
  const [total, pending, approved, rejected, totalToken, pendingUlang] = await Promise.all([
    prisma.peserta.count(),
    prisma.peserta.count({ where: { statusVerif: 'PENDING' } }),
    prisma.peserta.count({ where: { statusVerif: 'APPROVED' } }),
    prisma.peserta.count({ where: { statusVerif: 'REJECTED' } }),
    prisma.peserta.aggregate({ _sum: { jumlahToken: true } }),
    prisma.tokenPending.count({ where: { status: 'PENDING' } }),
  ])

  return res.json({
    success: true,
    data: { totalPeserta: total, pending, approved, rejected, totalToken: totalToken._sum.jumlahToken || 0, pendingUlang },
  })
}

module.exports = {
  listPeserta, detailPeserta, verifikasiPeserta,
  listTokenPending, detailTokenPending, verifikasiTokenPending,
  dashboard,
  getProfile, updateProfile, changeProfilePassword,
  listAdminUsers, createAdminUser, updateAdminUser, changeAdminUserPassword,
}
