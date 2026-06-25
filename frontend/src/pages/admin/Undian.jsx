import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trophy, Play, Loader2, AlertTriangle, CheckCircle2, Coins } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApiHelper } from '../../api/client'
import { formatRupiah } from '../../utils'

export default function AdminUndian() {
  const queryClient = useQueryClient()
  const [hadiahInput, setHadiahInput] = useState('')
  const [jumlahPemenang, setJumlahPemenang] = useState(1)
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [hasilUndian, setHasilUndian] = useState(null)

  const { data: dashData } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApiHelper.dashboard,
  })

  const stats = dashData?.data

  const undianMutation = useMutation({
    mutationFn: (body) => adminApiHelper.jalankanUndian(body),
    onSuccess: (res) => {
      setHasilUndian(res.data)
      queryClient.invalidateQueries(['admin-pemenang'])
      toast.success(`Undian berhasil! ${res.data?.length || 0} pemenang dipilih`)
      setKonfirmasi(false)
    },
    onError: (err) => {
      toast.error(err?.message || 'Gagal menjalankan undian')
      setKonfirmasi(false)
    },
  })

  function jalankan() {
    if (!hadiahInput.trim()) { toast.error('Nama hadiah wajib diisi'); return }
    undianMutation.mutate({
      hadiah: hadiahInput,
      jumlahPemenang: parseInt(jumlahPemenang),
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Jalankan Undian</h1>
        <p className="text-sm text-gray-500 mt-1">Undian acak berbobot berdasarkan jumlah token peserta</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Peserta Aktif', value: stats?.approved || 0, Icon: Trophy, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Token Beredar', value: stats?.totalToken || 0, Icon: Coins,  color: 'text-amber-600 bg-amber-50' },
          { label: 'Rata-rata Token/Peserta', value: stats?.approved ? Math.round((stats.totalToken||0) / stats.approved) : 0, Icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Form undian */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Konfigurasi Undian</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Hadiah</label>
            <input
              value={hadiahInput}
              onChange={e => setHadiahInput(e.target.value)}
              placeholder="Contoh: Hadiah Utama – Smartphone MITO X100"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pemenang</label>
            <select
              value={jumlahPemenang}
              onChange={e => setJumlahPemenang(e.target.value)}
              className="input-field"
            >
              {[1,2,3,5,10,20].map(n => <option key={n} value={n}>{n} pemenang</option>)}
            </select>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Undian dilakukan secara acak berbobot. Peserta dengan lebih banyak token memiliki peluang lebih besar.
            Pastikan semua verifikasi sudah selesai sebelum menjalankan undian. Proses ini tidak dapat dibatalkan.
          </p>
        </div>

        {!konfirmasi ? (
          <button
            onClick={() => setKonfirmasi(true)}
            disabled={!hadiahInput.trim() || (stats?.approved || 0) === 0}
            className="btn-primary w-full mt-5 py-3"
          >
            <Play className="w-4 h-4" /> Jalankan Undian
          </button>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800 font-medium text-center">
              ⚠️ Yakin jalankan undian untuk "{hadiahInput}" ({jumlahPemenang} pemenang)?
            </div>
            <div className="flex gap-3">
              <button onClick={() => setKonfirmasi(false)} className="flex-1 btn-outline">Batal</button>
              <button
                onClick={jalankan}
                disabled={undianMutation.isPending}
                className="flex-1 btn-primary"
              >
                {undianMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengundi...</>
                  : <><Trophy className="w-4 h-4" /> Ya, Jalankan!</>
                }
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hasil undian */}
      {hasilUndian && hasilUndian.length > 0 && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Hasil Undian
          </h3>
          <div className="space-y-3">
            {hasilUndian.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center font-black text-white text-lg flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{p.namaLengkap}</div>
                  <div className="text-xs text-gray-500 font-mono">{p.idRegistrasi}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-700">{p.jumlahToken} token</div>
                  <div className="text-xs text-gray-400">{formatRupiah(p.nominalBeli)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
