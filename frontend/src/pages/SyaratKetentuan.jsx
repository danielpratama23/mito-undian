import React from 'react'
import { FileText, AlertCircle } from 'lucide-react'

const sections = [
  {
    title: '1. Ketentuan Umum',
    content: [
      'Program Undian MITO Jawa Timur adalah program promosi yang diselenggarakan oleh MITO.',
      'Program berlaku untuk pembelian produk MITO di wilayah Jawa Timur mulai 1 Agustus 2026 hingga 31 Oktober 2026.',
      'Dengan mendaftar, peserta dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan ini.',
      'MITO berhak mengubah syarat dan ketentuan sewaktu-waktu dengan pemberitahuan sebelumnya.',
    ],
  },
  {
    title: '2. Syarat Peserta',
    content: [
      'Warga Negara Indonesia yang berdomisili di wilayah Jawa Timur.',
      'Memiliki Kartu Tanda Penduduk (KTP) yang masih berlaku.',
      'Membeli produk MITO di toko offline resmi yang berpartisipasi atau marketplace online resmi MITO.',
      'Satu orang (NIK) hanya dapat mendaftar satu kali selama periode program.',
      'Satu IMEI hanya dapat didaftarkan satu kali selama periode program.',
      'Karyawan MITO dan keluarga inti tidak berhak mengikuti program ini.',
    ],
  },
  {
    title: '3. Produk yang Berlaku',
    content: [
      'Seluruh produk MITO yang dibeli selama periode program.',
      'Pembelian harus dilakukan di toko offline resmi MITO di Surabaya dan Jawa Timur, atau marketplace online resmi yang ditentukan MITO.',
      'Pembelian di luar toko/marketplace resmi tidak berlaku.',
    ],
  },
  {
    title: '4. Mekanisme Token',
    content: [
      'Setiap pembelian valid sebesar Rp500.000 mendapatkan 1 (satu) token undian.',
      'Token berlaku kelipatan. Contoh: pembelian Rp1.500.000 = 3 token.',
      'Sisa nominal di bawah Rp500.000 tidak dihitung. Contoh: Rp1.700.000 = 3 token.',
      'Token diberikan setelah admin MITO memverifikasi dan menyetujui data peserta.',
      'Token tidak dapat dipindahtangankan, diperjualbelikan, atau ditukarkan dengan uang.',
    ],
  },
  {
    title: '5. Proses Verifikasi',
    content: [
      'Admin MITO akan memverifikasi data peserta dan keaslian struk pembelian.',
      'Proses verifikasi dilakukan dalam 1–3 hari kerja.',
      'MITO berhak meminta dokumen tambahan jika diperlukan.',
      'Data yang terbukti palsu atau tidak sesuai akan langsung didiskualifikasi.',
      'Keputusan verifikasi admin bersifat final dan tidak dapat diganggu gugat.',
    ],
  },
  {
    title: '6. Mekanisme Undian',
    content: [
      'Undian dilakukan pada tanggal yang akan ditentukan dan diumumkan oleh Tim Marketing MITO.',
      'Peluang menang ditentukan berdasarkan jumlah token yang dimiliki peserta.',
      'Peserta dengan lebih banyak token memiliki peluang lebih besar untuk menang.',
      'Proses undian dilakukan secara terbuka dan disaksikan oleh pihak yang ditentukan MITO.',
      'Satu peserta hanya dapat memenangkan satu hadiah (kecuali ditentukan lain).',
    ],
  },
  {
    title: '7. Pengumuman & Pengambilan Hadiah',
    content: [
      'Daftar pemenang diumumkan di MITO Undian Website program setelah tanggal pengundian.',
      'Pemenang akan dihubungi langsung oleh tim MITO melalui nomor HP yang terdaftar.',
      'Pemenang wajib menunjukkan KTP asli saat pengambilan hadiah.',
      'Hadiah tidak dapat dipindahtangankan atau ditukarkan dengan uang tunai.',
      'MITO tidak bertanggung jawab atas pajak hadiah yang menjadi kewajiban pemenang sesuai ketentuan perpajakan yang berlaku.',
      'Pemenang yang tidak dapat dihubungi dalam 30 hari akan dianggap gugur.',
    ],
  },
  {
    title: '8. Privasi Data',
    content: [
      'Data pribadi peserta dikumpulkan semata-mata untuk keperluan program undian.',
      'MITO berkomitmen menjaga kerahasiaan data sesuai peraturan perlindungan data yang berlaku.',
      'Dengan mendaftar, peserta menyetujui penggunaan nama dan foto untuk keperluan publikasi pemenang.',
    ],
  },
  {
    title: '9. Ketentuan Lain',
    content: [
      'MITO berhak mendiskualifikasi peserta yang terbukti melakukan kecurangan.',
      'Segala perselisihan diselesaikan secara musyawarah. Jika tidak tercapai, diselesaikan sesuai hukum yang berlaku di Indonesia.',
      'Keputusan MITO dalam segala hal berkaitan dengan program ini bersifat mutlak dan final.',
    ],
  },
]

export default function SyaratKetentuan() {
  return (
    <div className="min-h-screen">
      <div className="bg-hero-gradient pt-24 pb-16 px-4 text-center relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Syarat & Ketentuan</h1>
          <p className="text-red-100">Program Undian MITO Jawa Timur 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-8">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Syarat dan ketentuan ini dapat diperbarui sewaktu-waktu. Versi terakhir diperbarui: Juli 2026.
            Peserta disarankan untuk membaca kembali sebelum mendaftar.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map(({ title, content }) => (
            <div key={title} className="card p-6">
              <h2 className="font-bold text-gray-900 mb-4 text-base flex items-center gap-2">
                <div className="w-1.5 h-5 bg-mito-red rounded-full flex-shrink-0" />
                {title}
              </h2>
              <ul className="space-y-2">
                {content.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          © 2026 MITO. Program Undian Jawa Timur. Dokumen ini berlaku sejak 1 Agustus 2026.
        </p>
      </div>
    </div>
  )
}
