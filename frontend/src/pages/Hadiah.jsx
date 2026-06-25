import React from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Star, Gift, ChevronRight, Clock } from 'lucide-react'

// Data hadiah - diisi oleh Tim Marketing
// Saat ini menggunakan placeholder
const hadiah = [
  {
    tier: 'Grand Prize',
    label: '🏆 Hadiah Utama',
    items: [
      { nama: 'Hadiah Utama 1', deskripsi: 'Detail hadiah akan diumumkan oleh Tim Marketing', qty: 1, badge: 'UTAMA' },
    ],
    bg: 'from-amber-400 to-orange-500',
    border: 'border-amber-300',
  },
  {
    tier: 'Prize 2',
    label: '🥈 Hadiah Kedua',
    items: [
      { nama: 'Hadiah Kedua', deskripsi: 'Detail hadiah akan diumumkan oleh Tim Marketing', qty: 3, badge: '3 Pemenang' },
    ],
    bg: 'from-slate-400 to-slate-500',
    border: 'border-slate-300',
  },
  {
    tier: 'Prize 3',
    label: '🥉 Hadiah Ketiga',
    items: [
      { nama: 'Hadiah Ketiga', deskripsi: 'Detail hadiah akan diumumkan oleh Tim Marketing', qty: 5, badge: '5 Pemenang' },
    ],
    bg: 'from-amber-600 to-yellow-700',
    border: 'border-amber-400',
  },
  {
    tier: 'Consolation',
    label: '🎁 Hadiah Hiburan',
    items: [
      { nama: 'Hadiah Hiburan', deskripsi: 'Detail hadiah akan diumumkan oleh Tim Marketing', qty: 20, badge: '20 Pemenang' },
    ],
    bg: 'from-red-500 to-mito-red',
    border: 'border-red-300',
  },
]

export default function Hadiah() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-hero-gradient pt-24 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-mito-orange animate-float" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Daftar Hadiah</h1>
          <p className="text-red-100 text-lg">
            Hadiah menarik senilai puluhan juta rupiah menanti para pemenang!
          </p>
        </div>
      </div>

      <br/><br/>


      {/* Notice */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 mb-10">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Catatan:</strong> Detail lengkap hadiah sedang disiapkan oleh Tim Marketing dan akan diumumkan segera sebelum program dimulai pada 1 Agustus 2026.
          </p>
        </div>
      </div>

      {/* Prize cards */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="space-y-6">
          {hadiah.map(({ tier, label, items, bg, border }) => (
            <div key={tier} className={`card border-2 ${border} overflow-hidden`}>
              {/* Header */}
              <div className={`bg-gradient-to-r ${bg} px-6 py-4`}>
                <h2 className="text-xl font-black text-white">{label}</h2>
              </div>
              {/* Items */}
              <div className="p-6">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900">{item.nama}</h3>
                        <span className="text-xs font-bold bg-red-100 text-mito-red px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 italic">{item.deskripsi}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-black text-mito-red">{item.qty}</div>
                      <div className="text-xs text-gray-400">pemenang</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Token info */}
        <div className="mt-10 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 text-center border border-red-100">
          <Star className="w-10 h-10 text-mito-orange mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Perbanyak Token, Perbesar Peluang</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
            Peluang menang ditentukan oleh jumlah token. Setiap <strong>Rp500.000</strong> pembelian produk MITO = <strong>1 token</strong> undian.
          </p>
          <div className="flex justify-center gap-4 flex-wrap mb-6">
            {[
              { nominal: 'Rp500rb', token: 1 },
              { nominal: 'Rp1jt', token: 2 },
              { nominal: 'Rp2jt', token: 4 },
              { nominal: 'Rp5jt', token: 10 },
            ].map(({ nominal, token }) => (
              <div key={nominal} className="bg-white rounded-xl px-4 py-3 text-center shadow-sm border border-red-100 min-w-[80px]">
                <div className="text-xs text-gray-500">{nominal}</div>
                <div className="text-2xl font-black text-mito-red">{token}</div>
                <div className="text-xs text-gray-400">token</div>
              </div>
            ))}
          </div>
          <Link to="/registrasi" className="btn-primary px-8 py-3">
            Daftar & Dapatkan Token <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
