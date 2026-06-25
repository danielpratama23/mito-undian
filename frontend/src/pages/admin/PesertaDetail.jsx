import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  CheckCircle2, XCircle, ExternalLink, Loader2,
  User, Phone, CreditCard, Package, Coins, ArrowLeft,
  AlertTriangle, Clock, ZoomIn
} from 'lucide-react'
import { adminApiHelper } from '../../api/client'
import { formatRupiah, formatTanggalWaktu, maskNIK } from '../../utils'
import StatusBadge from '../../components/StatusBadge'
import TokenBadge from '../../components/TokenBadge'

export default function PesertaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [alasanReject, setAlasanReject] = useState('')
  const [lightbox, setLightbox] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['peserta-detail', id],
    queryFn: () => adminApiHelper.detailPeserta(id),
  })

  const verifikasiMutation = useMutation({
    mutationFn: ({ action, alasanReject }) =>
      adminApiHelper.verifikasi(id, { action, alasanReject }),
    onSuccess: (res, { action }) => {
      if (action === 'APPROVE') {
        const d = res.data
        toast.success(`✅ Disetujui! Token diberikan: ${d?.jumlahToken ?? 0}`)
        if (d?.isSuspicious) {
          toast.warning(`⚠️ Perhatian: ${d?.catatan}`, { autoClose: 8000 })
        }
      } else {
        toast.info('Data peserta telah ditolak')
      }
      queryClient.invalidateQueries({ queryKey: ['peserta-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-peserta'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
    onError: (err) => toast.error(err?.message || 'Gagal memproses verifikasi'),
  })

  function handleApprove() {
    if (!confirm('Setujui data peserta ini dan hitung token via Gemini AI?')) return
    verifikasiMutation.mutate({ action: 'APPROVE' })
  }

  function handleReject() {
    if (!alasanReject.trim()) { toast.error('Alasan reject wajib diisi'); return }
    verifikasiMutation.mutate({ action: 'REJECT', alasanReject })
    setShowRejectModal(false)
    setAlasanReject('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-gray-300" />
      </div>
    )
  }

  const peserta = data?.data
  if (!peserta) {
    return (
      <div className="p-6 text-center text-gray-400">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
        <p>Data tidak ditemukan</p>
      </div>
    )
  }

  const infoItems = [
    { Icon: User,       label: 'Nama Lengkap',      value: peserta.namaLengkap },
    { Icon: CreditCard, label: 'NIK',                value: maskNIK(peserta.nik), mono: true },
    { Icon: Phone,      label: 'No. HP',             value: peserta.noHp },
    { Icon: Package,    label: 'IMEI',               value: peserta.imei, mono: true },
    { Icon: Package,    label: 'Produk (Odoo)',      value: peserta.odooProductName || '— tidak ditemukan di Odoo' },
    { Icon: CreditCard, label: 'Nominal Pembelian',  value: formatRupiah(peserta.nominalBeli) },
    { Icon: Coins,      label: 'Token Diberikan',    value: peserta.jumlahToken > 0 ? `${peserta.jumlahToken} token` : '—' },
    { Icon: Clock,      label: 'Tgl Registrasi',     value: formatTanggalWaktu(peserta.tglRegistrasi) },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-mito-red to-mito-redDark px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">{peserta.namaLengkap}</h1>
              <p className="text-red-200 text-sm font-mono mt-0.5">{peserta.idRegistrasi}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={peserta.statusVerif} />
              {peserta.jumlahToken > 0 && <TokenBadge jumlah={peserta.jumlahToken} size="sm" />}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Data Peserta</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {infoItems.map(({ Icon, label, value, mono }) => (
              <div key={label} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className={`font-medium text-gray-800 truncate ${mono ? 'font-mono text-sm' : 'text-sm'}`}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Struk foto */}
        <div className="px-6 pb-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Foto Struk Pembelian</h2>
          {peserta.strukUrl ? (
            <div className="relative group inline-block">
              <img
                src={peserta.strukUrl}
                alt="Struk pembelian"
                className="max-h-56 rounded-xl border border-gray-100 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightbox(true)}
              />
              <button
                onClick={() => setLightbox(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl"
              >
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
              </button>
              <a
                href={peserta.strukUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Buka di tab baru
              </a>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
              Foto struk tidak tersedia
            </div>
          )}
        </div>

        {/* Reject reason */}
        {peserta.alasanReject && (
          <div className="mx-6 mb-5 bg-red-50 border border-red-100 rounded-xl p-4 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-600 mb-0.5">Alasan Penolakan</p>
              <p className="text-sm text-red-700">{peserta.alasanReject}</p>
            </div>
          </div>
        )}

        {/* Token logs */}
        {peserta.tokenLogs?.length > 0 && (
          <div className="px-6 pb-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Log Token AI
            </h2>
            {peserta.tokenLogs.map(log => (
              <div key={log.id} className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-green-700 text-lg">{log.jumlah} token</span>
                  <span className="text-xs text-gray-400">{formatTanggalWaktu(log.createdAt)}</span>
                </div>
                {log.geminiRaw?.candidates?.[0] && (
                  <p className="text-xs text-green-600 mt-1">✓ Dihitung oleh Gemini AI</p>
                )}
                {!log.geminiRaw && (
                  <p className="text-xs text-amber-600 mt-1">⚠ Kalkulasi manual (Gemini tidak tersedia)</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons — hanya tampil jika PENDING */}
        {peserta.statusVerif === 'PENDING' && (
          <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-5">
            <button
              onClick={handleApprove}
              disabled={verifikasiMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {verifikasiMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />
              }
              Approve + Hitung Token
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={verifikasiMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={peserta.strukUrl}
            alt="Struk full"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-bold text-lg text-gray-900 mb-1">Alasan Penolakan</h3>
            <p className="text-sm text-gray-500 mb-4">
              Berikan alasan yang jelas agar peserta bisa memahami keputusan ini.
            </p>
            <textarea
              value={alasanReject}
              onChange={e => setAlasanReject(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Contoh: Foto struk tidak jelas, nominal tidak sesuai dengan produk yang didaftarkan..."
              className="input-field resize-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setAlasanReject('') }}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                Konfirmasi Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
