/**
 * seed.js — Inisialisasi data awal
 * Jalankan: node src/seed.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database MITO Undian...\n')

  // ── Admin users ──────────────────────────────────────────────────────────
  const admins = [
    { username: 'superadmin', password: 'Admin@2026!', role: 'superadmin' },
    { username: 'verifikator1', password: 'Verif@2026!', role: 'verifikator' },
  ]

  for (const admin of admins) {
    const existing = await prisma.adminUser.findUnique({ where: { username: admin.username } })
    if (!existing) {
      await prisma.adminUser.create({
        data: {
          username: admin.username,
          password: await bcrypt.hash(admin.password, 12),
          role: admin.role,
        },
      })
      console.log(`✅ Admin created: ${admin.username} (role: ${admin.role})`)
    } else {
      console.log(`⏭️  Admin already exists: ${admin.username}`)
    }
  }

  // ── Sample peserta (development only) ────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const samplePeserta = [
      {
        idRegistrasi: 'MITO-20260801-1001',
        namaLengkap: 'Budi Santoso',
        nik: '3578123456780001',
        noHp: '081234567890',
        imeiList: ['358240051111110'],
        nominalBeli: 1500000,
        strukUrl: 'https://via.placeholder.com/400x600?text=Struk+Budi',
        statusVerif: 'APPROVED',
        jumlahToken: 3,
        ikutUndian: true,
        odooProductName: 'MITO A39',
      },
      {
        idRegistrasi: 'MITO-20260801-1002',
        namaLengkap: 'Siti Rahayu',
        nik: '3578987654320002',
        noHp: '082345678901',
        imeiList: ['358240052222220', '358240052222221'],
        nominalBeli: 2000000,
        strukUrl: 'https://via.placeholder.com/400x600?text=Struk+Siti',
        statusVerif: 'APPROVED',
        jumlahToken: 4,
        ikutUndian: true,
        odooProductName: 'MITO A50',
      },
      {
        idRegistrasi: 'MITO-20260802-1003',
        namaLengkap: 'Ahmad Fauzi',
        nik: '3578111222330003',
        noHp: '083456789012',
        imeiList: ['358240053333330'],
        nominalBeli: 500000,
        strukUrl: 'https://via.placeholder.com/400x600?text=Struk+Ahmad',
        statusVerif: 'PENDING',
        jumlahToken: 0,
        ikutUndian: false,
        odooProductName: null,
      },
      {
        idRegistrasi: 'MITO-20260802-1004',
        namaLengkap: 'Dewi Lestari',
        nik: '3578444555660004',
        noHp: '084567890123',
        imeiList: ['358240054444440', '358240054444441', '358240054444442'],
        nominalBeli: 3000000,
        strukUrl: 'https://via.placeholder.com/400x600?text=Struk+Dewi',
        statusVerif: 'APPROVED',
        jumlahToken: 6,
        ikutUndian: true,
        odooProductName: 'MITO A80 Pro',
      },
      {
        idRegistrasi: 'MITO-20260803-1005',
        namaLengkap: 'Roni Wijaya',
        nik: '3578777888990005',
        noHp: '085678901234',
        imeiList: ['358240055555550'],
        nominalBeli: 1000000,
        strukUrl: 'https://via.placeholder.com/400x600?text=Struk+Roni',
        statusVerif: 'REJECTED',
        alasanReject: 'Foto struk tidak jelas, nominal tidak terbaca',
        jumlahToken: 0,
        ikutUndian: false,
      },
    ]

    for (const p of samplePeserta) {
      const existing = await prisma.peserta.findUnique({ where: { nik: p.nik } })
      if (!existing) {
        await prisma.peserta.create({ data: p })
        console.log(`✅ Sample peserta: ${p.namaLengkap} (${p.statusVerif})`)
      } else {
        console.log(`⏭️  Peserta already exists: ${p.namaLengkap}`)
      }
    }
  }

  console.log('\n✨ Seeding selesai!')
  console.log('\n📋 Login admin:')
  console.log('   superadmin  / Admin@2026!')
  console.log('   verifikator1 / Verif@2026!')
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())