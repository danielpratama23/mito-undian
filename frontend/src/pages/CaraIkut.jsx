import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Monitor, Upload, Coins, CheckCircle2, Trophy, ChevronRight, Info } from 'lucide-react'

const steps = [
  {
    Icon: ShoppingBag,
    no: '01',
    title: 'Beli Produk MITO',
    desc: 'Beli produk MITO apapun (smartphone, tablet, atau aksesoris) di toko offline yang berpartisipasi di wilayah Jawa Timur, atau melalui online shop / marketplace resmi yang ditentukan MITO.',
    tips: ['Simpan struk pembelian baik-baik', 'Catat nomor IMEI produk', 'Berlaku untuk semua produk MITO'],
    color: 'bg-blue-500',
  },
  {
    Icon: Monitor,
    no: '02',
    title: 'Akses MITO Undian Website & Isi Form',
    desc: 'Buka MITO Undian Website program undian ini, klik tombol "Daftar Sekarang", dan isi form registrasi dengan data diri yang benar sesuai KTP.',
    tips: ['Nama harus sesuai KTP', 'NIK 16 digit', 'Nomor HP aktif yang bisa dihubungi'],
    color: 'bg-purple-500',
  },
  {
    Icon: Upload,
    no: '03',
    title: 'Upload Struk Pembelian',
    desc: 'Foto struk atau nota pembelian produk MITO. Pastikan foto jelas, nominal terbaca, dan tidak buram. Struk akan diverifikasi oleh tim MITO.',
    tips: ['Foto harus jelas dan terbaca', 'Format JPG, PNG, atau WebP', 'Ukuran maksimal 5MB'],
    color: 'bg-green-500',
  },
  {
    Icon: CheckCircle2,
    no: '04',
    title: 'Tunggu Verifikasi Admin',
    desc: 'Tim MITO akan memverifikasi data dan struk pembelian kamu dalam 1–3 hari kerja. Kamu akan mendapat notifikasi setelah verifikasi selesai.',
    tips: ['Proses 1–3 hari kerja', 'Pastikan data sesuai struk', 'Cek status via ID Registrasi'],
    color: 'bg-amber-500',
  },
  {
    Icon: Coins,
    no: '05',
    title: 'Terima Token Undian',
    desc: 'Setelah data disetujui, token undian otomatis masuk ke akun kamu. Setiap Rp500.000 pembelian valid = 1 token. Semakin banyak token, semakin besar peluang menang!',
    tips: ['Rp500.000 = 1 token', 'Berlaku kelipatan', 'Token masuk otomatis'],
    color: 'bg-orange-500',
  },
  {
    Icon: Trophy,
    no: '06',
    title: 'Ikut Undian & Menang!',
    desc: 'Pada tanggal pengundian yang ditentukan, nama pemenang akan diundi secara acak berbobot berdasarkan jumlah token. Pemenang diumumkan di MITO Undian Website ini.',
    tips: ['Pengundian terbuka & transparan', 'Pemenang diumumkan di MITO Undian Website', 'Tanggal undian ditentukan Tim Marketing'],
    color: 'bg-mito-red',
  },
]

export default function CaraIkut() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-hero-gradient pt-24 pb-16 px-4 text-center relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-3">Cara Ikut Program</h1>
          <p className="text-red-100 text-lg">6 langkah mudah untuk berkesempatan memenangkan hadiah jutaan rupiah</p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block" />

          <div className="space-y-8">
            {steps.map(({ Icon, no, title, desc, tips, color }) => (
              <div key={no} className="relative flex gap-6 sm:ml-0 animate-fade-in">
                {/* Step circle */}
                <div className={`relative z-10 flex-shrink-0 w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Langkah {no}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{desc}</p>
                  <div className="space-y-1.5">
                    {tips.map(tip => (
                      <div key={tip} className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-mito-red rounded-full flex-shrink-0" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-10 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-bold">Catatan Penting:</p>
            <ul className="space-y-1 text-blue-700 list-disc list-inside">
              <li>Satu NIK hanya bisa digunakan untuk satu kali registrasi</li>
              <li>Satu IMEI hanya bisa didaftarkan satu kali selama periode program</li>
              <li>Pembelian harus dilakukan di toko atau marketplace resmi MITO</li>
              <li>Minimal pembelian Rp500.000 untuk mendapatkan token</li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link to="/registrasi" className="btn-primary px-10 py-4 text-base shadow-lg shadow-red-200">
            Daftar Sekarang <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
