import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Clock, CheckCircle2, XCircle, Coins, ChevronRight, Loader2, TrendingUp, RefreshCw } from 'lucide-react'
import { adminApiHelper } from '../../api/client'
import { formatTanggalWaktu } from '../../utils'
import StatusBadge from '../../components/StatusBadge'

function StatCard({ label, value, Icon, color, sub }) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    amber:  'bg-amber-50 text-amber-600',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-black text-gray-900">{value ?? '—'}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const { data: dash, isLoading: loadDash } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApiHelper.dashboard,
    refetchInterval: 30000,
  })

  const { data: pesertaRes, isLoading: loadPeserta } = useQuery({
    queryKey: ['admin-peserta-recent'],
    queryFn: () => adminApiHelper.listPeserta({ limit: 5, page: 1 }),
  })

  const stats = dash?.data
  const recent = pesertaRes?.data || []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Program Undian MITO Jawa Timur 2026</p>
      </div>

      {/* Stats grid */}
      {loadDash ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <StatCard label="Total Peserta" value={stats?.totalPeserta} Icon={Users} color="blue" />
            <StatCard label="Pending Registrasi" value={stats?.pending} Icon={Clock} color="yellow" sub="Perlu diverifikasi" />
            <StatCard label="Total Token" value={stats?.totalToken} Icon={Coins} color="amber" sub="Seluruh peserta aktif" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="Disetujui" value={stats?.approved} Icon={CheckCircle2} color="green" />
            <StatCard label="Ditolak" value={stats?.rejected} Icon={XCircle} color="red" />
            <StatCard label="Pending Pembelian Ulang" value={stats?.pendingUlang} Icon={RefreshCw} color="blue" sub="Perlu tambahan token" />
          </div>
        </>
      )}

      {/* Progress bar */}
      {stats && stats.totalPeserta > 0 && (
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-mito-red" />
              Progress Verifikasi
            </h3>
            <span className="text-xs text-gray-500">
              {stats.approved + stats.rejected} dari {stats.totalPeserta} diproses
            </span>
          </div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-100">
            {stats.approved > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(stats.approved / stats.totalPeserta) * 100}%` }}
              />
            )}
            {stats.rejected > 0 && (
              <div
                className="bg-red-400 transition-all"
                style={{ width: `${(stats.rejected / stats.totalPeserta) * 100}%` }}
              />
            )}
            {stats.pending > 0 && (
              <div
                className="bg-yellow-300 transition-all"
                style={{ width: `${(stats.pending / stats.totalPeserta) * 100}%` }}
              />
            )}
          </div>
          <div className="flex gap-4 mt-2">
            {[
              { color: 'bg-green-500', label: 'Disetujui', val: stats.approved },
              { color: 'bg-red-400',   label: 'Ditolak',   val: stats.rejected },
              { color: 'bg-yellow-300',label: 'Pending',   val: stats.pending },
            ].map(({ color, label, val }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                {label} ({val})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending ulang alert */}
      {stats?.pendingUlang > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-blue-900">{stats.pendingUlang} pembelian ulang menunggu token</div>
              <div className="text-xs text-blue-700">Peserta yang sudah terdaftar membeli produk tambahan</div>
            </div>
          </div>
          <Link to="/admin/token-pending?status=PENDING" className="flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-900">
            Lihat <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Pending alert */}
      {stats?.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="font-bold text-yellow-900">{stats.pending} peserta menunggu verifikasi</div>
              <div className="text-xs text-yellow-700">Segera verifikasi untuk memberikan token undian</div>
            </div>
          </div>
          <Link
            to="/admin/peserta?status=PENDING"
            className="flex items-center gap-1 text-sm font-bold text-yellow-700 hover:text-yellow-900"
          >
            Lihat <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Recent registrations */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Registrasi Terbaru</h3>
          <Link to="/admin/peserta" className="text-sm text-mito-red font-medium hover:underline flex items-center gap-1">
            Lihat semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {loadPeserta ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Belum ada registrasi</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(p => (
              <Link
                key={p.id}
                to={`/admin/peserta/${p.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-mito-red font-bold text-sm flex-shrink-0">
                  {p.namaLengkap?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{p.namaLengkap}</div>
                  <div className="text-xs text-gray-400 font-mono">{p.idRegistrasi}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={p.statusVerif} />
                  <span className="text-xs text-gray-400 hidden sm:block">{formatTanggalWaktu(p.tglRegistrasi)}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
