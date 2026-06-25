import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trophy, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApiHelper } from '../../api/client'
import { formatTanggal } from '../../utils'

export default function AdminPemenang() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pemenang'],
    queryFn: adminApiHelper.listPemenang,
  })

  const umumkanMutation = useMutation({
    mutationFn: (id) => adminApiHelper.umumkanPemenang(id),
    onSuccess: () => {
      toast.success('Status pemenang diperbarui')
      queryClient.invalidateQueries(['admin-pemenang'])
    },
    onError: (err) => toast.error(err?.message || 'Gagal update status'),
  })

  const pemenang = data?.data || []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Manajemen Pemenang</h1>
        <p className="text-sm text-gray-500 mt-1">Umumkan pemenang agar tampil di halaman publik</p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : pemenang.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Belum ada pemenang. Jalankan undian terlebih dahulu.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pemenang.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/60">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0 ${
                  i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-mito-red'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900">{p.peserta?.namaLengkap}</div>
                  <div className="text-xs text-gray-400 font-mono">{p.peserta?.idRegistrasi}</div>
                  <div className="text-xs text-mito-red font-medium mt-0.5">{p.hadiah}</div>
                </div>
                <div className="text-right flex-shrink-0 mr-4">
                  <div className="text-xs text-gray-400">{formatTanggal(p.tglUndian)}</div>
                  <div className={`text-xs font-bold mt-0.5 ${p.diumumkan ? 'text-green-600' : 'text-gray-400'}`}>
                    {p.diumumkan ? '✓ Diumumkan' : 'Belum diumumkan'}
                  </div>
                </div>
                <button
                  onClick={() => umumkanMutation.mutate(p.id)}
                  disabled={umumkanMutation.isPending}
                  title={p.diumumkan ? 'Sembunyikan dari publik' : 'Umumkan ke publik'}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    p.diumumkan
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {p.diumumkan ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
