/**
 * adminController.js
 * Verifikasi peserta baru + token_pending (pembelian ulang)
 */

const { PrismaClient } = require('@prisma/client')
const { hitungToken }  = require('../services/geminiService')

const prisma = new PrismaClient()

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
        tglRegistrasi: true, odooProductName: true,
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
      tokenPendings: { orderBy: { tglSubmit: 'desc' } },
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
      productName: peserta.odooProductName,
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
          noHp: true, jumlahToken: true, odooProductName: true,
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
      productName: item.peserta.odooProductName,
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

module.exports = { listPeserta, detailPeserta, verifikasiPeserta, listTokenPending, detailTokenPending, verifikasiTokenPending, dashboard }
