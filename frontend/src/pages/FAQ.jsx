import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const faqs = [
  {
    kategori: 'Umum',
    items: [
      { q: 'Apa itu Program Undian MITO Jawa Timur?', a: 'Program undian berhadiah eksklusif dari MITO untuk pelanggan di wilayah Jawa Timur. Beli produk MITO, daftarkan diri, dan dapatkan token undian untuk berkesempatan memenangkan hadiah senilai puluhan juta rupiah.' },
      { q: 'Siapa yang bisa ikut program ini?', a: 'Seluruh warga Jawa Timur yang membeli produk MITO di toko offline resmi di Surabaya/Jawa Timur atau marketplace online resmi yang ditentukan MITO selama periode program 1 Agustus – 31 Oktober 2026.' },
      { q: 'Kapan program ini berlangsung?', a: 'Program berlangsung mulai 1 Agustus 2026 hingga 31 Oktober 2026. Tanggal pengundian akan diumumkan oleh Tim Marketing MITO.' },
    ],
  },
  {
    kategori: 'Registrasi & IMEI',
    items: [
      { q: 'Apa itu IMEI dan bagaimana cara menemukannya?', a: 'IMEI (International Mobile Equipment Identity) adalah nomor identitas unik perangkat. Cara menemukan: ketik *#06# di keypad HP, atau cek di dus/kotak produk, atau di menu Pengaturan > Tentang Ponsel.' },
      { q: 'Berapa kali saya bisa mendaftar?', a: 'Satu NIK hanya dapat digunakan untuk satu kali registrasi. Satu IMEI juga hanya bisa didaftarkan satu kali selama periode program.' },
      { q: 'Apakah saya bisa daftar tanpa struk?', a: 'Tidak. Upload foto struk pembelian adalah syarat wajib. Struk digunakan untuk memverifikasi keabsahan pembelian dan nominal transaksi.' },
      { q: 'Produk apa saja yang berlaku?', a: 'Seluruh produk MITO yang dibeli di toko offline yang berpartisipasi di Jawa Timur atau marketplace online resmi yang ditentukan MITO.' },
    ],
  },
  {
    kategori: 'Token & Undian',
    items: [
      { q: 'Bagaimana cara menghitung jumlah token?', a: 'Setiap Rp500.000 pembelian valid = 1 token. Berlaku kelipatan. Contoh: beli Rp1.500.000 dapat 3 token; beli Rp2.750.000 dapat 5 token (sisa Rp250.000 tidak dihitung).' },
      { q: 'Kapan token saya masuk?', a: 'Token masuk otomatis setelah admin MITO menyetujui data registrasi dan struk pembelian kamu. Proses verifikasi 1–3 hari kerja.' },
      { q: 'Bagaimana mekanisme undiannya?', a: 'Undian dilakukan secara acak berbobot berdasarkan jumlah token. Peserta dengan lebih banyak token memiliki peluang menang lebih besar. Pengundian dilakukan secara terbuka dan transparan.' },
      { q: 'Apakah satu orang bisa menang lebih dari satu hadiah?', a: 'Ketentuan ini akan diatur oleh Tim Marketing dan akan tercantum di Syarat & Ketentuan resmi program.' },
    ],
  },
  {
    kategori: 'Verifikasi & Pemenang',
    items: [
      { q: 'Berapa lama proses verifikasi?', a: 'Proses verifikasi data dan struk pembelian dilakukan oleh tim MITO dalam 1–3 hari kerja setelah registrasi.' },
      { q: 'Apa yang terjadi jika data saya ditolak?', a: 'Kamu akan mendapat pemberitahuan beserta alasan penolakan. Pastikan data yang diisi sesuai KTP dan foto struk jelas terbaca.' },
      { q: 'Bagaimana cara mengetahui status registrasi?', a: 'Masukkan ID Registrasi yang diberikan saat mendaftar di halaman Cek Status untuk melihat perkembangan verifikasi.' },
      { q: 'Bagaimana pengumuman pemenang?', a: 'Daftar pemenang akan diumumkan di halaman Pemenang pada MITO Undian Website ini setelah tanggal pengundian. Pemenang juga akan dihubungi langsung oleh tim MITO.' },
    ],
  },
]

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-800 text-sm leading-relaxed">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform mt-0.5 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50/50">
          {a}
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <div className="min-h-screen">
      <div className="bg-hero-gradient pt-24 pb-16 px-4 text-center relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">FAQ</h1>
          <p className="text-red-100 text-lg">Pertanyaan yang sering ditanyakan</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        {faqs.map(({ kategori, items }) => (
          <div key={kategori} className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-5 bg-mito-red rounded-full" />
              {kategori}
            </h2>
            <div className="space-y-2">
              {items.map(item => (
                <AccordionItem key={item.q} {...item} />
              ))}
            </div>
          </div>
        ))}

        <div className="text-center mt-8 p-6 bg-gray-50 rounded-2xl">
          <p className="text-gray-500 mb-4 text-sm">Masih ada pertanyaan lain?</p>
          <Link to="/syarat-ketentuan" className="btn-outline text-sm">
            Baca Syarat & Ketentuan Lengkap
          </Link>
        </div>
      </div>
    </div>
  )
}
