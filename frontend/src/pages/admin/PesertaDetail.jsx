import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  CheckCircle2, XCircle, ExternalLink, Loader2,
  User, Phone, CreditCard, Package, Coins, ArrowLeft,
  AlertTriangle, Clock, ZoomIn, ChevronDown, ChevronUp,
  ShoppingBag, RefreshCw
} from 'lucide-react'
import { adminApiHelper } from '../../api/client'
import { formatRupiah, formatTanggalWaktu, maskNIK } from '../../utils'
import StatusBadge from '../../components/StatusBadge'
import TokenBadge from '../../components/TokenBadge'

// ── Komponen struk thumbnail yang bisa dibuka lightbox ────────────────────────
function StrukThumb({ url, onOpen }) {
  if (!url) return <span className="text-xs text-gray-400 italic">Tidak ada struk</span>
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="relative group inline-block cursor-pointer" onClick={() => onOpen(url)}>
        <img
          src={url}
          alt="Struk"
          className="h-16 w-16 rounded-lg object-cover border border-gray-100 hover:opacity-80 transition-opacity"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors">
          <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
        </div>
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
        <ExternalLink className="w-3 h-3" /> Buka
      </a>
    </div>
  )
}

function LogItem({ icon: Icon, iconBg, label, tanggal, nominal, imeiList, token, tokenStatus, strukUrl, alasan, onLightbox }) {
  const [open, setOpen] = useState(false)
  
  // Handle both old format (array of strings) and new format (array of objects with imei, productId, productName)
  const iList = Array.isArray(imeiList) 
    ? imeiList.map(item => 
        typeof item === 'string' 
          ? { imei: item, productId: null, productName: null }
          : item
      )
    : []

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header row — selalu tampil */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">{tanggal} · {iList.length} produk · {formatRupiah(nominal)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {tokenStatus === 'APPROVED' && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              +{token} token
            </span>
          )}
          {tokenStatus === 'PENDING' && (
            <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
              menunggu
            </span>
          )}
          {tokenStatus === 'REJECTED' && (
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              ditolak
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Detail expand */}
      {open && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
          {/* IMEI list with product info */}
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1.5">IMEI / Unique Code & Produk</p>
            <div className="space-y-2">
              {imeiList.map((item, i) => {
                // Handle both old format (string) and new format (object)
                const imei = typeof item === 'string' ? item : item.imei
                const productName = typeof item === 'string' ? null : item.productName
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">{i + 1}.</span>
                      <span className="font-mono text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-700">
                        {imei}
                      </span>
                      <span className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-700">
                        {productName || <span className="italic text-gray-400">tidak ada info produk</span>}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Nominal */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Nominal Pembelian</span>
            <span className="text-sm font-bold text-gray-800">{formatRupiah(nominal)}</span>
          </div>

          {/* Struk */}
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1">Bukti Struk</p>
            <StrukThumb url={strukUrl} onOpen={onLightbox} />
          </div>

          {/* Alasan reject */}
          {alasan && (
            <div className="bg-red-50 rounded-lg p-2 flex gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{alasan}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PesertaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [alasanReject, setAlasanReject] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState(null)

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
        if (d?.isSuspicious) toast.warning(`⚠️ Perhatian: ${d?.catatan}`, { autoClose: 8000 })
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
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin w-8 h-8 text-gray-300" /></div>
  }

  const peserta = data?.data
  if (!peserta) {
    return <div className="p-6 text-center text-gray-400"><Package className="w-12 h-12 mx-auto mb-3 text-gray-200" /><p>Data tidak ditemukan</p></div>
  }

  const imeiList = Array.isArray(peserta.imeiList) ? peserta.imeiList : []
  const approvedPendings = (peserta.tokenPendings || []).filter(p => p.status === 'APPROVED')

  // Total nominal = registrasi awal + semua Pending Token yang APPROVED
  const totalNominal = Number(peserta.nominalBeli) +
    approvedPendings.reduce((sum, p) => sum + Number(p.nominalBeli), 0)

  // Total transaksi (untuk label)
  const totalTransaksi = 1 + (peserta.tokenPendings?.length || 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="card overflow-hidden">
        {/* ── Header ── */}
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

        {/* ── Summary (data peserta) ── */}
        <div className="p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Ringkasan Peserta</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Nama */}
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div><p className="text-xs text-gray-400">Nama Lengkap</p><p className="text-sm font-medium text-gray-800">{peserta.namaLengkap}</p></div>
            </div>

            {/* NIK */}
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <CreditCard className="w-4 h-4 text-gray-400" />
              </div>
              <div><p className="text-xs text-gray-400">NIK</p><p className="text-sm font-mono font-medium text-gray-800">{maskNIK(peserta.nik)}</p></div>
            </div>

            {/* No HP */}
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Phone className="w-4 h-4 text-gray-400" />
              </div>
              <div><p className="text-xs text-gray-400">No. HP</p><p className="text-sm font-medium text-gray-800">{peserta.noHp}</p></div>
            </div>

            {/* Produk (Odoo) — untuk backward compatibility */}
            {(peserta.imeiList?.some(i => i.productName)) && (
              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Produk (Total Unik)</p>
                  <p className="text-sm font-medium text-gray-800">
                    {peserta.imeiList
                      ?.filter((item, index, self) => self.findIndex(i => typeof i === 'string' ? i === item : i.productName === item.productName) === index)
                      .map(item => typeof item === 'string' ? item : item.productName)
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Total nominal (akumulasi) */}
            <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-700">Total Nominal ({totalTransaksi} transaksi)</p>
                <p className="text-sm font-bold text-amber-800">{formatRupiah(totalNominal)}</p>
                {totalTransaksi > 1 && (
                  <p className="text-xs text-amber-600 mt-0.5">Awal {formatRupiah(peserta.nominalBeli)} + {approvedPendings.length} Pending Token</p>
                )}
              </div>
            </div>

            {/* Total token */}
            <div className="flex items-start gap-3 bg-green-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Coins className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-700">Total Token</p>
                <p className="text-sm font-bold text-green-800">{peserta.jumlahToken} token</p>
              </div>
            </div>

            {/* IMEI list registrasi awal — full width */}
            <div className="sm:col-span-2 flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Package className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1.5">IMEI / Unique Code & Produk (Registrasi Awal — {imeiList.length} produk)</p>
                {imeiList.length > 0 ? (
                  <div className="space-y-2">
                    {imeiList.map((item, i) => {
                      // Handle both old format (string) and new format (object)
                      const imei = typeof item === 'string' ? item : item.imei
                      const productName = typeof item === 'string' ? null : item.productName
                      return (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">{i + 1}.</span>
                            <span className="font-mono text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-700">
                              {imei}
                            </span>
                            <span className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-700">
                              {productName || <span className="italic text-gray-400">tidak ada info produk</span>}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">—</span>
                )}
              </div>
            </div>

            {/* Tgl registrasi */}
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <div><p className="text-xs text-gray-400">Tgl Registrasi</p><p className="text-sm font-medium text-gray-800">{formatTanggalWaktu(peserta.tglRegistrasi)}</p></div>
            </div>
          </div>
        </div>

        {/* ── Alasan reject registrasi ── */}
        {peserta.alasanReject && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-100 rounded-xl p-4 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-600 mb-0.5">Alasan Penolakan Registrasi</p>
              <p className="text-sm text-red-700">{peserta.alasanReject}</p>
            </div>
          </div>
        )}

        {/* ── Log semua transaksi ── */}
        <div className="px-6 pb-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Riwayat Transaksi & Struk
          </h2>
          <div className="space-y-2">

            {/* Transaksi 1: registrasi awal */}
            <LogItem
              icon={ShoppingBag}
              iconBg="bg-mito-red"
              label="Registrasi Awal"
              tanggal={formatTanggalWaktu(peserta.tglRegistrasi)}
              nominal={peserta.nominalBeli}
              imeiList={imeiList}
              token={peserta.tokenLogs?.find(l => l.sumber === 'registrasi')?.jumlah ?? 0}
              tokenStatus={peserta.statusVerif}
              strukUrl={peserta.strukUrl}
              alasan={peserta.alasanReject}
              onLightbox={setLightboxUrl}
            />

            {/* Transaksi berikutnya: Pending Token */}
            {(peserta.tokenPendings || []).map((tp, i) => (
              <LogItem
                key={tp.id}
                icon={RefreshCw}
                iconBg={tp.status === 'APPROVED' ? 'bg-green-500' : tp.status === 'REJECTED' ? 'bg-red-400' : 'bg-gray-400'}
                label={`Pending Token #${i + 1}`}
                tanggal={formatTanggalWaktu(tp.tglSubmit)}
                nominal={tp.nominalBeli}
                imeiList={tp.imeiList}
                token={tp.tokenDiberikan}
                tokenStatus={tp.status}
                strukUrl={tp.strukUrl}
                alasan={tp.alasanReject}
                onLightbox={setLightboxUrl}
              />
            ))}
          </div>
        </div>

        {/* ── Action buttons ── */}
        {peserta.statusVerif === 'PENDING' && (
          <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-5">
            <button
              onClick={handleApprove}
              disabled={verifikasiMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {verifikasiMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
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

      {/* ── Lightbox ── */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Struk full" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* ── Reject modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-bold text-lg text-gray-900 mb-1">Alasan Penolakan</h3>
            <p className="text-sm text-gray-500 mb-4">Berikan alasan yang jelas agar peserta bisa memahami keputusan ini.</p>
            <textarea
              value={alasanReject}
              onChange={e => setAlasanReject(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Contoh: Foto struk tidak jelas, nominal tidak sesuai..."
              className="input-field resize-none text-sm mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectModal(false); setAlasanReject('') }} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
              <button onClick={handleReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-colors">Konfirmasi Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}