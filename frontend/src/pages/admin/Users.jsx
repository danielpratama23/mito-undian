import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Check, Upload } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApiHelper } from '../../api/client'

const roles = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'verifikator', label: 'Verifikator' },
]

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApiHelper.listAdminUsers,
  })

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('verifikator')
  const [avatar, setAvatar] = useState(null)

  const createUserMutation = useMutation({
    mutationFn: (formData) => adminApiHelper.createAdminUser(formData),
    onSuccess: () => {
      toast.success('Admin baru berhasil dibuat')
      setUsername('')
      setPassword('')
      setRole('verifikator')
      setAvatar(null)
      queryClient.invalidateQueries(['admin-users'])
    },
    onError: (err) => toast.error(err?.message || 'Gagal membuat admin baru'),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) return toast.error('Username dan password wajib diisi')
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    formData.append('role', role)
    if (avatar) formData.append('avatar', avatar)
    createUserMutation.mutate(formData)
  }

  const admins = data?.data || []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manajemen Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Hanya superadmin dapat membuat dan mengelola akun admin lain.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mb-6">
        <div className="card p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Dibuat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" />
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-400 text-sm">Belum ada admin</td>
                </tr>
              ) : admins.map(admin => (
                <tr key={admin.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    {admin.avatarUrl ? (
                      <img src={admin.avatarUrl} alt={admin.username} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-mito-red/10 text-mito-red flex items-center justify-center font-bold">
                        {admin.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{admin.username}</div>
                      <div className="text-xs text-gray-400">{admin.id}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">{admin.role}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(admin.createdAt).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Buat Admin Baru</h2>
            <p className="text-sm text-gray-500 mt-1">Isi form untuk menambahkan akun admin.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="superadmin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
                {roles.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avatar (opsional)</label>
              <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} className="w-full text-sm text-gray-700" />
            </div>
            <button type="submit" disabled={createUserMutation.isLoading} className="btn-primary w-full py-3">
              {createUserMutation.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-4 h-4" />} {createUserMutation.isLoading ? 'Menyimpan...' : 'Buat Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
