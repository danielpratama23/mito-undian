import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Gift, Clock, Coins, Star, Shield, Smartphone, CheckCircle2 } from 'lucide-react'
import { formatRupiah, hitungEstimasiToken, formatInputRupiah } from '../utils'

// Countdown timer
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({})
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) return setTimeLeft({ hari: 0, jam: 0, menit: 0, detik: 0 })
      setTimeLeft({
        hari:   Math.floor(diff / 86400000),
        jam:    Math.floor((diff % 86400000) / 3600000),
        menit:  Math.floor((diff % 3600000) / 60000),
        detik:  Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [targetDate])
  return timeLeft
}

function CountdownBox({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl w-16 h-16 flex items-center justify-center">
        <span className="text-2xl font-black text-white tabular-nums">
          {String(value ?? 0).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-red-100 mt-1 font-medium">{label}</span>
    </div>
  )
}

const steps = [
  { no: '01', title: 'Beli Produk MITO', desc: 'Beli produk MITO apapun di toko resmi atau marketplace selama periode program' },
  { no: '02', title: 'Daftar di Microsite', desc: 'Isi form registrasi dengan data diri dan IMEI produk yang dibeli' },
  { no: '03', title: 'Upload Struk', desc: 'Unggah foto struk pembelian sebagai bukti transaksi' },
  { no: '04', title: 'Dapat Token Undian', desc: 'Setelah verifikasi admin, token langsung masuk. Rp500.000 = 1 token' },
]

const keunggulan = [
  { Icon: Shield,      title: 'Terpercaya',    desc: 'Undian diawasi langsung oleh tim MITO secara transparan' },
  { Icon: Coins,       title: 'Makin Banyak Token', desc: 'Semakin besar pembelian, semakin banyak token dan peluang menang' },
  { Icon: Smartphone,  title: 'Untuk Semua Produk', desc: 'Berlaku untuk seluruh lini produk MITO yang dibeli di Jawa Timur' },
  { Icon: Star,        title: 'Hadiah Menarik', desc: 'Hadiah total bernilai puluhan juta rupiah menanti pemenang' },
]

export default function Home() {
  const countdown = useCountdown('2026-08-01T00:00:00')
  const [nominal, setNominal] = useState('')
  const estimasi = hitungEstimasiToken(nominal)

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative min-h-screen bg-hero-gradient flex items-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-[-80px] w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-mito-orange/10 rounded-full animate-pulse-slow" />

        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-16 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left text */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Program Aktif · Agustus – Oktober 2026
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
                Menangkan<br />
                <span className="text-mito-orange">Hadiah</span><br />
                Jutaan Rupiah!
              </h1>
              <p className="text-red-100 text-lg mb-8 leading-relaxed max-w-md">
                Beli produk MITO di Jawa Timur, daftar, dan dapatkan token undian. 
                Semakin banyak beli, semakin besar peluang menang!
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/registrasi" className="btn-primary text-base px-8 py-4 shadow-lg shadow-red-900/40">
                  Daftar Sekarang <ChevronRight className="w-5 h-5" />
                </Link>
                <Link to="/hadiah" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
                  <Gift className="w-5 h-5" /> Lihat Hadiah
                </Link>
              </div>
            </div>

            {/* Right - countdown + token calc */}
            <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {/* Countdown */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-red-100 text-sm font-medium mb-4">
                  <Clock className="w-4 h-4" />
                  Program dimulai dalam
                </div>
                <div className="flex gap-3 justify-center">
                  <CountdownBox value={countdown.hari}  label="Hari" />
                  <div className="text-white/40 text-2xl font-bold self-center pb-4">:</div>
                  <CountdownBox value={countdown.jam}   label="Jam" />
                  <div className="text-white/40 text-2xl font-bold self-center pb-4">:</div>
                  <CountdownBox value={countdown.menit} label="Menit" />
                  <div className="text-white/40 text-2xl font-bold self-center pb-4">:</div>
                  <CountdownBox value={countdown.detik} label="Detik" />
                </div>
              </div>

              {/* Token calculator */}
              <div className="bg-white rounded-2xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-gray-800">Kalkulator Token</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">Masukkan nominal pembelian untuk estimasi token</p>
                <div className="relative mb-4">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">Rp</span>
                  <input
                    type="text"
                    value={nominal}
                    onChange={e => setNominal(formatInputRupiah(e.target.value))}
                    placeholder="1.000.000"
                    className="input-field pl-10 text-sm"
                  />
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-black text-amber-600">{estimasi}</div>
                  <div className="text-sm text-amber-700 font-medium">token undian</div>
                  <div className="text-xs text-gray-400 mt-1">Setiap Rp500.000 = 1 token</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60H1440V20C1200 60 960 0 720 20C480 40 240 0 0 20V60Z" fill="#f8f8f8"/>
          </svg>
        </div>
      </section>

      {/* ── CARA IKUT (steps) ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-red-100 text-mito-red text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              Mudah & Cepat
            </div>
            <h2 className="section-title mb-3">Cara Ikut Program</h2>
            <p className="text-gray-500 max-w-md mx-auto">Hanya 4 langkah mudah untuk berkesempatan memenangkan hadiah jutaan rupiah</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ no, title, desc }, i) => (
              <div key={no} className="card p-6 group hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-mito-red/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-mito-red transition-colors">
                  <span className="text-mito-red font-black text-lg group-hover:text-white transition-colors">{no}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-3 text-gray-300">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/registrasi" className="btn-primary px-10 py-4 text-base shadow-lg shadow-red-200">
              Mulai Daftar <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── KEUNGGULAN ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Kenapa Harus Ikut?</h2>
            <p className="text-gray-500">Program undian terpercaya dari MITO khusus Jawa Timur</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {keunggulan.map(({ Icon, title, desc }) => (
              <div key={title} className="text-center group">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-mito-red transition-colors">
                  <Icon className="w-7 h-7 text-mito-red group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto bg-hero-gradient rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 -translate-y-16" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Jangan Sampai Ketinggalan!</h2>
            <p className="text-red-100 mb-8 max-w-md mx-auto">Program berlaku mulai 1 Agustus 2026. Daftarkan diri kamu sekarang dan kejar token sebanyak mungkin.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/registrasi" className="inline-flex items-center justify-center gap-2 bg-white text-mito-red font-black px-8 py-4 rounded-xl hover:bg-red-50 transition-all active:scale-95 shadow-lg">
                <Gift className="w-5 h-5" /> Daftar Sekarang
              </Link>
              <Link to="/hadiah" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all">
                Lihat Hadiah
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
