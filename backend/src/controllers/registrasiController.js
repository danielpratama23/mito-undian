/**
 * registrasiController.js
 *
 * Alur:
 * - NIK belum ada → registrasi baru (tabel peserta, status PENDING)
 * - NIK sudah ada → tambah pembelian baru (tabel token_pending, status PENDING)
 *
 * Multi-IMEI: field "imeiList" terima array JSON string, validasi masing-masing >8 digit angka
 */

const { PrismaClient } = require('@prisma/client')
const { z } = require('zod')
const { validasiIMEI } = require('../services/odooService')
const { uploadFile } = require('../services/storageService')

const prisma = new PrismaClient()

// ── Validasi satu IMEI ────────────────────────────────────────────────────────
const imeiSchema = z
  .string()
  .min(9, 'Setiap IMEI / Unique Code minimal 9 digit')

// ── Schema registrasi baru ────────────────────────────────────────────────────
const registrasiSchema = z.object({
  namaLengkap: z.string().min(3, 'Nama minimal 3 karakter').max(255),
  nik:         z.string().length(16, 'NIK harus 16 digit').regex(/^\d+$/, 'NIK hanya angka'),
  noHp:        z.string().min(10).max(15).regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor HP tidak valid'),
  // imeiList dikirim sebagai JSON string dari FormData
  imeiList:    z.string().transform(v => {
    try { return JSON.parse(v) } catch { return [v] }
  }).pipe(
    z.array(imeiSchema).min(1, 'Minimal 1 IMEI wajib diisi').max(10, 'Maksimal 10 IMEI')
  ),
  nominalBeli: z.string().transform(v => parseFloat(v.replace(/[^0-9.]/g, ''))),
})

// ── Schema pembelian ulang (NIK sudah ada) ────────────────────────────────────
const pembelianUlangSchema = z.object({
  nik:        z.string().length(16).regex(/^\d+$/),
  imeiList:   z.string().transform(v => {
    try { return JSON.parse(v) } catch { return [v] }
  }).pipe(
    z.array(imeiSchema).min(1, 'Minimal 1 IMEI wajib diisi').max(10)
  ),
  nominalBeli: z.string().transform(v => parseFloat(v.replace(/[^0-9.]/g, ''))),
})

// ── Generate ID Registrasi ────────────────────────────────────────────────────
function generateIdRegistrasi() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `MITO-${date}-${rand}`
}

// ── Validasi semua IMEI ke Odoo, kumpulkan hasilnya ──────────────────────────
async function validasiSemuaIMEI(imeiList) {
  const results = []
  for (const imei of imeiList) {
    try {
      const res = await validasiIMEI(imei)
      results.push({ imei, ...res })
    } catch {
      results.push({ imei, valid: false, odooDown: true, message: 'Odoo tidak dapat dihubungi' })
    }
  }
  return results
}

// ── Cek IMEI duplikat di peserta.imei_list + token_pending.imei_list ─────────
async function cekIMEIDuplikat(imeiList) {
  // Cek di semua peserta (imei_list adalah JSONB array dengan struktur: [{ imei, productId, productName }, ...])
  const pesertaDuplikat = await prisma.$queryRaw`
    SELECT id_registrasi
    FROM peserta
    WHERE imei_list @> ${JSON.stringify(imeiList.map(i => ({ imei: i, productId: null, productName: null })))}::jsonb
    LIMIT 1
  `

  // Cek di token_pending juga
  const pendingDuplikat = await prisma.$queryRaw`
    SELECT id
    FROM token_pending
    WHERE imei_list @> ${JSON.stringify(imeiList.map(i => ({ imei: i, productId: null, productName: null })))}::jsonb
    LIMIT 1
  `

  const duplikat = []
  if (pesertaDuplikat.length > 0 || pendingDuplikat.length > 0) {
    // Cek per-IMEI untuk pesan error yang informatif
    for (const imei of imeiList) {
      const cekPeserta = await prisma.$queryRaw`
        SELECT 1 FROM peserta WHERE imei_list @> ${JSON.stringify([{ imei, productId: null, productName: null }])}::jsonb LIMIT 1
      `
      const cekPending = await prisma.$queryRaw`
        SELECT 1 FROM token_pending WHERE imei_list @> ${JSON.stringify([{ imei, productId: null, productName: null }])}::jsonb LIMIT 1
      `
      if (cekPeserta.length > 0 || cekPending.length > 0) duplikat.push(imei)
    }
  }
  return duplikat
}

// ── POST /api/registrasi ──────────────────────────────────────────────────────
async function submitRegistrasi(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Foto struk pembelian wajib diunggah' })
    }

    // Cek apakah NIK sudah terdaftar
    const nikExist = await prisma.peserta.findUnique({
      where: { nik: req.body.nik },
      select: { id: true, idRegistrasi: true, namaLengkap: true, jumlahToken: true }
    })

    if (nikExist) {
      // ── ALUR PEMBELIAN ULANG ──────────────────────────────────────────────
      return await handlePembelianUlang(req, res, nikExist)
    }

    // ── ALUR REGISTRASI BARU ──────────────────────────────────────────────────
    const parse = registrasiSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.flatten().fieldErrors })
    }

    const data = parse.data

    // Cek IMEI duplikat
    const duplikat = await cekIMEIDuplikat(data.imeiList)
    if (duplikat.length > 0) {
      return res.status(400).json({
        success: false,
        message: `IMEI berikut sudah pernah digunakan: ${duplikat.join(', ')}`,
      })
    }

    if (data.nominalBeli < 500000) {
      return res.status(400).json({
        success: false,
        message: 'Nominal pembelian minimum Rp500.000 untuk mendapatkan token',
      })
    }

    // Validasi IMEI ke Odoo
    const odooResults = await validasiSemuaIMEI(data.imeiList)
    const imeiTidakValid = odooResults.filter(r => !r.valid && !r.odooDown)
    if (imeiTidakValid.length > 0) {
      return res.status(400).json({
        success: false,
        message: `IMEI tidak terdaftar sebagai produk MITO: ${imeiTidakValid.map(r => r.imei).join(', ')}`,
      })
    }

    // Struktur imeiList dengan product info: [{ imei, productId, productName }, ...]
    const imeiListWithProducts = odooResults.map(r => ({
      imei: r.imei,
      productId: r.productId || null,
      productName: r.productName || null,
    }))

    const strukUrl  = await uploadFile(req.file, `struk/${data.nik}`)
    const idRegistrasi = generateIdRegistrasi()

    const peserta = await prisma.peserta.create({
      data: {
        idRegistrasi,
        namaLengkap:     data.namaLengkap,
        nik:             data.nik,
        noHp:            data.noHp,
        imeiList:        imeiListWithProducts,
        nominalBeli:     data.nominalBeli,
        strukUrl,
        statusVerif:     'PENDING',
      },
    })

    return res.status(201).json({
      success: true,
      isNewRegistration: true,
      message: 'Registrasi berhasil! Data kamu sedang diverifikasi oleh tim MITO.',
      data: {
        idRegistrasi:  peserta.idRegistrasi,
        namaLengkap:   peserta.namaLengkap,
        tglRegistrasi: peserta.tglRegistrasi,
        status:        'PENDING',
        imeiCount:     data.imeiList.length,
      },
    })

  } catch (err) {
    console.error('[Registrasi] Error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem. Silakan coba lagi.' })
  }
}

// ── Pembelian ulang: NIK sudah ada ───────────────────────────────────────────
async function handlePembelianUlang(req, res, pesertaExist) {
  const parse = pembelianUlangSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ success: false, errors: parse.error.flatten().fieldErrors })
  }

  const data = parse.data

  // Cek IMEI duplikat
  const duplikat = await cekIMEIDuplikat(data.imeiList)
  if (duplikat.length > 0) {
    return res.status(400).json({
      success: false,
      message: `IMEI berikut sudah pernah digunakan: ${duplikat.join(', ')}`,
    })
  }

  if (data.nominalBeli < 500000) {
    return res.status(400).json({
      success: false,
      message: 'Nominal pembelian minimum Rp500.000',
    })
  }

  // Validasi IMEI ke Odoo
  const odooResults = await validasiSemuaIMEI(data.imeiList)
  const imeiTidakValid = odooResults.filter(r => !r.valid && !r.odooDown)
  if (imeiTidakValid.length > 0) {
    return res.status(400).json({
      success: false,
      message: `IMEI tidak terdaftar sebagai produk MITO: ${imeiTidakValid.map(r => r.imei).join(', ')}`,
    })
  }

  // Struktur imeiList dengan product info: [{ imei, productId, productName }, ...]
  const imeiListWithProducts = odooResults.map(r => ({
    imei: r.imei,
    productId: r.productId || null,
    productName: r.productName || null,
  }))

  const strukUrl = await uploadFile(req.file, `struk-ulang/${pesertaExist.id}`)

  const tokenPending = await prisma.tokenPending.create({
    data: {
      pesertaId:   pesertaExist.id,
      imeiList:    imeiListWithProducts,
      nominalBeli: data.nominalBeli,
      strukUrl,
      status:      'PENDING',
    },
  })

  return res.status(201).json({
    success: true,
    isNewRegistration: false,
    message: `Pembelian tambahan berhasil dikirim! Menggunakan ID Registrasi yang sama: ${pesertaExist.idRegistrasi}`,
    data: {
      idRegistrasi:  pesertaExist.idRegistrasi,
      namaLengkap:   pesertaExist.namaLengkap,
      tokenPendingId: tokenPending.id,
      status:        'PENDING',
      imeiCount:     data.imeiList.length,
      pesertaToken:  pesertaExist.jumlahToken,
    },
  })
}

// ── GET /api/registrasi/:idRegistrasi ────────────────────────────────────────
async function cekStatus(req, res) {
  const { idRegistrasi } = req.params

  const peserta = await prisma.peserta.findUnique({
    where: { idRegistrasi },
    select: {
      idRegistrasi:  true,
      namaLengkap:   true,
      statusVerif:   true,
      jumlahToken:   true,
      ikutUndian:    true,
      tglRegistrasi: true,
      alasanReject:  true,
      tokenPendings: {
        select: {
          id:             true,
          nominalBeli:    true,
          status:         true,
          tokenDiberikan: true,
          alasanReject:   true,
          tglSubmit:      true,
          tglVerif:       true,
        },
        orderBy: { tglSubmit: 'desc' },
      },
    },
  })

  if (!peserta) {
    return res.status(404).json({ success: false, message: 'ID registrasi tidak ditemukan' })
  }

  return res.json({ success: true, data: peserta })
}

// ── GET /api/registrasi/validasi/nik ──────────────────────────────────────────
// Validasi NIK: cek apakah sudah terdaftar dan return data jika ada
async function validasiNIK(req, res) {
  try {
    const { nik } = req.query
    
    if (!nik || nik.length !== 16) {
      return res.status(400).json({ success: false, message: 'NIK harus 16 digit' })
    }

    const peserta = await prisma.peserta.findUnique({
      where: { nik },
      select: {
        id: true,
        idRegistrasi: true,
        namaLengkap: true,
        noHp: true,
        imeiList: true,
        statusVerif: true,
        jumlahToken: true,
      },
    })

    if (!peserta) {
      return res.json({ success: true, found: false })
    }

    return res.json({
      success: true,
      found: true,
      data: {
        idRegistrasi: peserta.idRegistrasi,
        namaLengkap: peserta.namaLengkap,
        noHp: peserta.noHp,
        imeiList: peserta.imeiList,
        statusVerif: peserta.statusVerif,
        jumlahToken: peserta.jumlahToken,
      },
    })
  } catch (err) {
    console.error('[Validasi NIK] Error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem' })
  }
}

module.exports = { submitRegistrasi, cekStatus, validasiNIK }
