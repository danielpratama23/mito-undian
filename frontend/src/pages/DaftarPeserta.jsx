import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Coins, Search, Loader2, Medal, Trophy } from 'lucide-react'
import { api } from '../api/client'
import { maskHP, maskNIK } from '../utils'

function useLeaderboard(q) {
  return useQuery({
    queryKey: ['leaderboard', q],
    queryFn: () => api.get('/peserta-publik', { params: { q } }),
    staleTime: 60000,
  })
}

function RankIcon({ rank }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400" />
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />
  return <span className="text-sm font-bold text-gray-400 w-5 text-center">{rank}</span>
}

function rankBg(rank) {
  if (rank === 1) return 'bg-amber-50 border-amber-200'
  if (rank === 2) return 'bg-gray-50 border-gray-200'
  if (rank === 3) return 'bg-orange-50 border-orange-200'
  return 'bg-white border-gray-100'
}

export default function DaftarPeserta() {
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')

  const { data, isLoading } = useLeaderboard(q)
  const peserta = data?.data || []

  function handleSearch(e) {
    e.preventDefault()
    setQ(input.trim())
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-hero-gradient pt-24 pb-16 px-4 text-center relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Coins className="w-7 h-7 text-mito-orange animate-float" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Daftar Peserta</h1>
          <p className="text-red-100 text-lg">Diurutkan berdasarkan jumlah token terbanyak</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Cari nama peserta..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <button type="submit" className="btn-primary px-5 py-2.5 text-sm">Cari</button>
          {q && (
            <button type="button" onClick={() => { setQ(''); setInput('') }} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
              Reset
            </button>
          )}
        </form>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
          </div>
        ) : peserta.length === 0 ? (
          <div className="text-center py-16">
            <Coins className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">{q ? `Tidak ada peserta dengan nama "${q}"` : 'Belum ada peserta terdaftar'}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{peserta.length} peserta aktif</p>
            <div className="space-y-2">
              {peserta.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border ${rankBg(i + 1)} transition-shadow hover:shadow-sm`}
                >
                  {/* Rank */}
                  {/* <div className="w-8 flex items-center justify-center flex-shrink-0">
                    <RankIcon rank={i + 1} />
                  </div> */}

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${
                    i === 0 ? 'bg-amber-400 text-white' :
                    i === 1 ? 'bg-gray-300 text-white' :
                    i === 2 ? 'bg-amber-700 text-white' :
                    'bg-red-100 text-mito-red'
                  }`}>
                    {p.namaLengkap?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{p.namaLengkap}</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {p.idRegistrasi
                        ? `${p.idRegistrasi.slice(0, 4)}${'*'.repeat(Math.max(0, p.idRegistrasi.length - 6))}${p.idRegistrasi.slice(-3)}`
                        : '-'}
                    </p>
                  </div>

                  {/* Token */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="font-black text-amber-700 text-lg">{p.jumlahToken}</span>
                    <span className="text-xs text-gray-400">token</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">
          Data diperbarui secara berkala. Nama ditampilkan lengkap, nomor HP disamarkan.
        </p>
      </div>
    </div>
  )
}