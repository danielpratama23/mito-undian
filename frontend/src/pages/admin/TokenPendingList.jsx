import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ChevronRight, Loader2, RefreshCw, CheckCircle2, XCircle, Filter, ChevronLeft, ExternalLink, ZoomIn } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApiHelper } from '../../api/client'
import { formatRupiah, formatTanggalWaktu } from '../../utils'

const STATUS_TABS = [
  { value: '',         label: 'Semua' },
  { value: 'PENDING',  label: 'Pending' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
]

function statusClass(s) {
  if (s === 'APPROVED') return 'badge-approved'
  if (s === 'REJECTED') return 'badge-rejected'
  return 'badge-pending'
}

// ── Modal detail + verifikasi ────────────────────────────────────────────────
function DetailModal({ item, onClose, onDone }) {
  const queryClient = useQueryClient()
  const [alasan, setAlasan] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const mutation = useMutation({
    mutationFn: ({ action, alasanReject }) =>
      adminApiHelper.verifikasiTokenPending(item.id, { action, alasanReject }),
    onSuccess: (res, { action }) => {
      if (action === 'APPROVE') {
        toast.success(res.message)
        if (res.data?.isSuspicious) toast.warning(`⚠️ ${res.data?.catatan}`, { autoClose: 8000 })
      } else {
        toast.info('Pembelian ulang ditolak')
      }
      queryClient.invalidateQueries({ queryKey: ['admin-token-pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      onDone()
    },
    onError: err => toast.error(err?.message || 'Gagal verifikasi'),
  })

  function handleApprove() {
    if (!confirm('Setujui pembelian ini dan tambahkan token?')) return
    mutation.mutate({ action: 'APPROVE' })
  }
  function handleReject() {
    if (!alasan.trim()) { toast.error('Alasan reject wajib diisi'); return }
    mutation.mutate({ action: 'REJECT', alasanReject: alasan })
    setShowReject(false)
  }

  const imeiList = Array.isArray(item.imeiList) ? item.imeiList : []

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-mito-red to-orange-500 px-5 py-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-white" />
              <span className="text-white font-bold">Pembelian Ulang</span>
            </div>
            <p className="text-red-100 text-sm mt-0.5">{item.peserta?.namaLengkap}</p>
            <p className="text-red-200 text-xs font-mono">{item.peserta?.idRegistrasi}</p>
          </div>
          <span className={statusClass(item.status)}>
            {item.status}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Peserta info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Token Saat Ini', value: `${item.peserta?.jumlahToken ?? 0} token` },
              { label: 'Nominal Beli', value: formatRupiah(item.nominalBeli) },
              { label: 'Tgl Submit', value: formatTanggalWaktu(item.tglSubmit) },
              { label: 'Tgl Verif', value: item.tglVerif ? formatTanggalWaktu(item.tglVerif) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-medium text-sm text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* IMEI list */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              IMEI Didaftarkan ({imeiList.length} produk)
            </p>
            <div className="space-y-1.5">
              {imeiList.map((imei, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                  <span className="font-mono text-sm text-gray-800">{imei}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Struk */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Foto Struk</p>
            <div className="relative group inline-block">
              <img
                src={item.strukUrl}
                alt="Struk"
                className="max-h-48 rounded-xl border border-gray-100 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightbox(true)}
              />
              <button
                onClick={() => setLightbox(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors"
              >
                <ZoomIn className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
              </button>
            </div>
            <a href={item.strukUrl} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1 text-xs text-blue-500 hover:underline">
              <ExternalLink className="w-3 h-3" /> Buka di tab baru
            </a>
          </div>

          {/* Alasan reject */}
          {item.alasanReject && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
              <strong>Alasan Ditolak:</strong> {item.alasanReject}
            </div>
          )}

          {/* Token diberikan */}
          {item.status === 'APPROVED' && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
              <span className="text-2xl font-black text-green-700">+{item.tokenDiberikan}</span>
              <span className="text-sm text-green-600 ml-2">token diberikan</span>
            </div>
          )}

          {/* Action */}
          {item.status === 'PENDING' && (
            <>
              {!showReject ? (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleApprove}
                    disabled={mutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve + Token
                  </button>
                  <button
                    onClick={() => setShowReject(true)}
                    disabled={mutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              ) : (
                <div className="pt-2 space-y-3">
                  <textarea
                    value={alasan}
                    onChange={e => setAlasan(e.target.value)}
                    rows={2}
                    autoFocus
                    placeholder="Alasan penolakan..."
                    className="input-field resize-none text-sm"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setShowReject(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl hover:bg-gray-50 text-sm">Batal</button>
                    <button onClick={handleReject} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl hover:bg-red-700 text-sm">Konfirmasi Reject</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <img src={item.strukUrl} alt="Struk full" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TokenPendingList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [inputQ, setInputQ] = useState('')
  const [selected, setSelected] = useState(null)

  const status = searchParams.get('status') || ''
  const page   = parseInt(searchParams.get('page') || '1')

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val); else p.delete(key)
    if (key !== 'page') p.set('page', '1')
    setSearchParams(p)
  }

  useEffect(() => {
    const t = setTimeout(() => setQ(inputQ), 400)
    return () => clearTimeout(t)
  }, [inputQ])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-token-pending', status, page, q],
    queryFn: () => adminApiHelper.listTokenPending({ status, page, limit: 15, q }),
    keepPreviousData: true,
  })

  const items = data?.data || []
  const meta  = data?.meta || {}

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="w-5 h-5 text-mito-red" />
          <h1 className="text-2xl font-black text-gray-900">Pembelian Ulang</h1>
        </div>
        <p className="text-sm text-gray-500">
          Peserta yang sudah terdaftar dan membeli produk tambahan — perlu diverifikasi untuk menambah token
        </p>
      </div>

      {/* Filter */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={inputQ}
              onChange={e => setInputQ(e.target.value)}
              placeholder="Cari nama, ID registrasi, NIK..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setParam('status', tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  status === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Tidak ada data pembelian ulang</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map(item => {
              const imeiList = Array.isArray(item.imeiList) ? item.imeiList : []
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{item.peserta?.namaLengkap}</div>
                    <div className="text-xs text-gray-400 font-mono">{item.peserta?.idRegistrasi}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {imeiList.length} IMEI · {formatRupiah(item.nominalBeli)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={statusClass(item.status)}>{item.status}</span>
                    {item.status === 'APPROVED' && (
                      <span className="text-xs font-bold text-amber-700">+{item.tokenDiberikan} token</span>
                    )}
                    <span className="text-xs text-gray-400">{formatTanggalWaktu(item.tglSubmit)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">Halaman {meta.page} dari {meta.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setParam('page', String(page - 1))} disabled={page <= 1} className="btn-ghost py-1.5 px-3 text-sm disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setParam('page', String(page + 1))} disabled={page >= meta.totalPages} className="btn-ghost py-1.5 px-3 text-sm disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)} onDone={() => setSelected(null)} />
      )}
    </div>
  )
}
