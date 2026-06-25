import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Search, Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { publicApi } from '../api/client'
import { formatTanggal, maskHP } from '../utils'

function CekStatusBox() {
  const [idInput, setIdInput] = useState('')
  const [searchId, setSearchId] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cek-status', searchId],
    queryFn: () => publicApi.cekStatus(searchId),
    enabled: !!searchId,
    retry: false,
  })

  const statusConfig = {
    PENDING:  { label: 'Menunggu Verifikasi', color: 'text-amber-700 bg-amber-50 border-amber-200', Icon: Clock },
    APPROVED: { label: 'Disetujui ✓',         color: 'text-green-700 bg-green-50 border-green-200',  Icon: CheckCircle2 },
    REJECTED: { label: 'Ditolak',             color: 'text-red-700 bg-red-50 border-red-200',        Icon: Clock },
  }

  return (
    <div className="card p-6 mb-10">
      <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Search className="w-5 h-5 text-mito-red" /> Cek Status Registrasi
      </h3>
      <p className="text-sm text-gray-500 mb-4">Masukkan ID Registrasi untuk melihat status verifikasi kamu</p>
      <div className="flex gap-2">
        <input
          value={idInput}
          onChange={e => setIdInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && setSearchId(idInput)}
          placeholder="MITO-20260801-XXXX"
          className="input-field font-mono text-sm flex-1"
        />
        <button
          onClick={() => setSearchId(idInput)}
          disabled={!idInput || isLoading}
          className="btn-primary px-5"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek'}
        </button>
      </div>

      {isError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error?.message || 'ID Registrasi tidak ditemukan'}
        </div>
      )}

      {data?.data && (() => {
        const p = data.data
        const cfg = statusConfig[p.statusVerif]
        const StatusIcon = cfg.Icon
        return (
          <div className={`mt-4 p-4 rounded-xl border ${cfg.color}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold">{p.namaLengkap}</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                <StatusIcon className="w-3 h-3" /> {cfg.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">ID:</span> <span className="font-mono font-bold">{p.idRegistrasi}</span></div>
              <div><span className="text-gray-500">Daftar:</span> {formatTanggal(p.tglRegistrasi)}</div>
              {p.jumlahToken > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-500">Token:</span>{' '}
                  <span className="font-bold text-amber-700">{p.jumlahToken} token</span>
                </div>
              )}
              {p.alasanReject && (
                <div className="col-span-2">
                  <span className="text-gray-500">Alasan:</span> {p.alasanReject}
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default function Pemenang() {
  const { data, isLoading } = useQuery({
    queryKey: ['pemenang-publik'],
    queryFn: publicApi.getPemenang,
  })

  const pemenang = data?.data || []

  return (
    <div className="min-h-screen">
      <div className="bg-hero-gradient pt-24 pb-16 px-4 text-center relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-mito-orange animate-float" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Daftar Pemenang</h1>
          <p className="text-red-100 text-lg">Selamat kepada para pemenang Program Undian MITO Jawa Timur!</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <CekStatusBox />

        <h2 className="section-title mb-6">Pemenang Undian</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : pemenang.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-400 text-lg mb-2">Belum Ada Pemenang</h3>
            <p className="text-gray-400 text-sm">
              Pengundian belum dilaksanakan. Pantau terus halaman ini untuk pengumuman pemenang!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pemenang.map((p, i) => (
              <div key={p.id} className="card p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                  i === 0 ? 'bg-amber-400 text-white' :
                  i === 1 ? 'bg-gray-400 text-white' :
                  i === 2 ? 'bg-amber-700 text-white' :
                  'bg-red-100 text-mito-red'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900">{p.peserta?.namaLengkap}</div>
                  <div className="text-sm text-gray-500">{maskHP(p.peserta?.noHp)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-mito-red text-sm">{p.hadiah}</div>
                  <div className="text-xs text-gray-400">{formatTanggal(p.tglUndian)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
