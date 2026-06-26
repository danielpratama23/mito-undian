import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ChevronRight, Loader2, Filter, ChevronLeft } from 'lucide-react'
import { adminApiHelper } from '../../api/client'
import { formatTanggalWaktu, formatRupiah } from '../../utils'
import StatusBadge from '../../components/StatusBadge'
import TokenBadge from '../../components/TokenBadge'

const STATUS_TABS = [
  { value: '',         label: 'Semua' },
  { value: 'PENDING',  label: 'Pending' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
]

export default function PesertaList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [inputQ, setInputQ] = useState('')

  const status = searchParams.get('status') || ''
  const page   = parseInt(searchParams.get('page') || '1')

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val); else p.delete(key)
    if (key !== 'page') p.set('page', '1')
    setSearchParams(p)
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-peserta', status, page, q],
    queryFn: () => adminApiHelper.listPeserta({ status, page, limit: 15, q }),
    keepPreviousData: true,
  })

  const peserta = data?.data || []
  const meta = data?.meta || {}

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setQ(inputQ), 400)
    return () => clearTimeout(t)
  }, [inputQ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Data Peserta</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.total ? `${meta.total} total peserta` : ''}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={inputQ}
              onChange={e => setInputQ(e.target.value)}
              placeholder="Cari nama, ID registrasi, IMEI, atau NIK..."
              className="input-field pl-9 text-sm"
            />
          </div>
          {/* Status tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setParam('status', tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  status === tab.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {['ID Registrasi', 'Nama', 'Total', 'Status', 'Total Token', 'Registrasi', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" />
                  </td>
                </tr>
              ) : peserta.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    <Filter className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                    Tidak ada data
                  </td>
                </tr>
              ) : peserta.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.idRegistrasi}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 truncate max-w-[150px]">{p.namaLengkap}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[150px]">{p.odooProductName || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatRupiah(p.nominalBeli)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.statusVerif} /></td>
                  <td className="px-4 py-3">
                    {p.jumlahToken > 0
                      ? <TokenBadge jumlah={p.jumlahToken} size="sm" />
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatTanggalWaktu(p.tglRegistrasi)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/peserta/${p.id}`} className="btn-ghost text-xs py-1 px-2">
                      Detail <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : peserta.map(p => (
            <Link key={p.id} to={`/admin/peserta/${p.id}`} className="block p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-gray-900">{p.namaLengkap}</div>
                  <div className="text-xs font-mono text-gray-400">{p.idRegistrasi}</div>
                </div>
                <StatusBadge status={p.statusVerif} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatRupiah(p.nominalBeli)}</span>
                {p.jumlahToken > 0 && <TokenBadge jumlah={p.jumlahToken} size="sm" />}
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Halaman {meta.page} dari {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setParam('page', String(page - 1))}
                disabled={page <= 1 || isFetching}
                className="btn-ghost py-1.5 px-3 text-sm disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setParam('page', String(page + 1))}
                disabled={page >= meta.totalPages || isFetching}
                className="btn-ghost py-1.5 px-3 text-sm disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
