/**
 * undianController.js
 * Mekanisme pengundian: weighted random berdasarkan jumlah token
 * Semakin banyak token → peluang lebih besar
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Weighted random sampling tanpa pengembalian
 * @param {Array} pool - [{id, nama, jumlahToken, ...}]
 * @param {number} n   - jumlah pemenang
 * @returns {Array}    - pemenang terpilih
 */
function weightedRandomSample(pool, n) {
  const pemenang = []
  let sisa = [...pool]

  while (pemenang.length < n && sisa.length > 0) {
    const totalBobot = sisa.reduce((sum, p) => sum + p.jumlahToken, 0)
    if (totalBobot === 0) break

    const rand = Math.random() * totalBobot
    let akumulasi = 0
    let terpilih = null

    for (const p of sisa) {
      akumulasi += p.jumlahToken
      if (rand <= akumulasi) {
        terpilih = p
        break
      }
    }

    if (!terpilih) terpilih = sisa[sisa.length - 1] // fallback edge case

    pemenang.push(terpilih)
    sisa = sisa.filter(p => p.id !== terpilih.id) // hilangkan dari pool
  }

  return pemenang
}

// POST /api/admin/undian
async function jalankanUndian(req, res) {
  const { hadiah, jumlahPemenang = 1 } = req.body

  if (!hadiah?.trim()) {
    return res.status(400).json({ success: false, message: 'Nama hadiah wajib diisi' })
  }

  const maxPemenang = Math.min(Math.max(parseInt(jumlahPemenang) || 1, 1), 100)

  // Ambil seluruh peserta approved yang punya token & belum pernah menang
  const pesertaAktif = await prisma.peserta.findMany({
    where: {
      statusVerif: 'APPROVED',
      jumlahToken: { gt: 0 },
      pemenang: null, // belum menang
    },
    select: {
      id: true,
      idRegistrasi: true,
      namaLengkap: true,
      noHp: true,
      jumlahToken: true,
      nominalBeli: true,
    },
  })

  if (pesertaAktif.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada peserta aktif yang memenuhi syarat untuk diundi',
    })
  }

  if (maxPemenang > pesertaAktif.length) {
    return res.status(400).json({
      success: false,
      message: `Jumlah pemenang (${maxPemenang}) melebihi jumlah peserta aktif (${pesertaAktif.length})`,
    })
  }

  // Jalankan weighted random
  const pemenangTerpilih = weightedRandomSample(pesertaAktif, maxPemenang)
  const tglUndian = new Date()
  const noUndian = `UNDIAN-${tglUndian.toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()}`

  // Simpan ke DB dalam transaksi
  const savedPemenang = await prisma.$transaction(
    pemenangTerpilih.map((p, i) =>
      prisma.pemenang.create({
        data: {
          pesertaId: p.id,
          hadiah: `${hadiah}${pemenangTerpilih.length > 1 ? ` #${i + 1}` : ''}`,
          tglUndian,
          noUndian: `${noUndian}-${i + 1}`,
          diumumkan: false,
        },
        include: {
          peserta: {
            select: { namaLengkap: true, idRegistrasi: true, jumlahToken: true, nominalBeli: true },
          },
        },
      })
    )
  )

  return res.json({
    success: true,
    message: `Undian berhasil! ${pemenangTerpilih.length} pemenang dipilih dari ${pesertaAktif.length} peserta aktif`,
    data: pemenangTerpilih.map((p, i) => ({
      ...p,
      hadiah: savedPemenang[i]?.hadiah,
      noUndian: savedPemenang[i]?.noUndian,
    })),
    meta: {
      totalPeserta: pesertaAktif.length,
      totalToken: pesertaAktif.reduce((s, p) => s + p.jumlahToken, 0),
      tglUndian: tglUndian.toISOString(),
    },
  })
}

// GET /api/admin/pemenang
async function listPemenang(req, res) {
  const pemenang = await prisma.pemenang.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      peserta: {
        select: {
          namaLengkap: true, noHp: true, idRegistrasi: true,
          jumlahToken: true, nominalBeli: true,
        },
      },
    },
  })
  return res.json({ success: true, data: pemenang })
}

// PUT /api/admin/pemenang/:id/umumkan - toggle diumumkan
async function toggleUmumkan(req, res) {
  const { id } = req.params
  const existing = await prisma.pemenang.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ success: false, message: 'Pemenang tidak ditemukan' })

  const updated = await prisma.pemenang.update({
    where: { id },
    data: { diumumkan: !existing.diumumkan },
  })

  return res.json({
    success: true,
    message: updated.diumumkan ? 'Pemenang diumumkan ke publik' : 'Pemenang disembunyikan dari publik',
    data: updated,
  })
}

module.exports = { jalankanUndian, listPemenang, toggleUmumkan }
