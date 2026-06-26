import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Camera, Lock, Loader2, ShieldCheck, User, Calendar, Key } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApiHelper } from '../../api/client'

export default function AdminProfile() {
  const navigate = useNavigate()
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: adminApiHelper.getProfile,
    staleTime: 30000,
  })

  const profile = data?.data

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const changePasswordMutation = useMutation({
    mutationFn: (body) => adminApiHelper.changeProfilePassword(body),
    onSuccess: () => {
      toast.success('Password berhasil diperbarui')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err) => toast.error(err?.message || 'Gagal mengubah password'),
  })

  const updateAvatarMutation = useMutation({
    mutationFn: (formData) => adminApiHelper.updateProfile(formData),
    onSuccess: (res) => {
      toast.success('Avatar berhasil diperbarui')
      localStorage.setItem('mito_admin_user', JSON.stringify({
        username: profile.username,
        role: profile.role,
        avatarUrl: res.data.avatarUrl,
      }))
      setAvatarFile(null)
      setAvatarPreview('')
      refetch()
    },
    onError: (err) => toast.error(err?.message || 'Gagal mengunggah avatar'),
  })

  useEffect(() => {
    if (!avatarFile) return
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(avatarFile)
  }, [avatarFile])

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
  }

  function handleAvatarSubmit(e) {
    e.preventDefault()
    if (!avatarFile) return toast.error('Pilih file avatar terlebih dahulu')
    const formData = new FormData()
    formData.append('avatar', avatarFile)
    updateAvatarMutation.mutate(formData)
  }

  function handlePasswordSubmit(e) {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      return toast.error('Isi password lama dan baru')
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Konfirmasi password tidak cocok')
    }
    changePasswordMutation.mutate({ currentPassword, newPassword })
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center text-gray-500">
        Data profil tidak ditemukan. <button className="underline" onClick={() => navigate('/admin')}>Kembali</button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Profil</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola password dan avatar akun Anda</p>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '220px 1fr' }}>

        {/* Kartu avatar */}
        <div className="card p-7 flex flex-col items-center">
          <div
            className="relative w-22 h-22 mb-4 cursor-pointer group"
            style={{ width: 88, height: 88 }}
            onClick={() => document.getElementById('avatarInput').click()}
          >
            {avatarPreview || profile.avatarUrl ? (
              <img
                src={avatarPreview || profile.avatarUrl}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-mito-red/10 text-mito-red flex items-center justify-center text-2xl font-medium">
                {profile.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {updateAvatarMutation.isLoading
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Camera className="w-5 h-5 text-white" />
              }
              <span className="text-white text-[10px] mt-1">Ubah foto</span>
            </div>
            <input id="avatarInput" type="file" accept="image/*" className="hidden"
              onChange={(e) => { handleAvatarChange(e); handleAvatarSubmit(e); }} />
          </div>

          <p className="text-sm font-medium text-gray-900">{profile.username}</p>

          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-mito-red/10 text-mito-red">
            <ShieldCheck className="w-3 h-3" />
            {profile.role === 'superadmin' ? 'Superadmin' : 'Verifikator'}
          </span>
        </div>

        {/* Kartu info */}
        <div className="card p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-5">Informasi akun</p>
          <div className="divide-y divide-gray-100">
            {[
              { icon: User, label: 'Username', value: profile.username },
              { icon: Key, label: 'Role', value: profile.role === 'superadmin' ? 'Superadmin' : 'Verifikator' },
              { icon: Calendar, label: 'Dibuat pada', value: new Date(profile.createdAt).toLocaleString('id-ID') },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Ubah Password</h2>
          <p className="text-sm text-gray-500 mt-1">Gunakan password baru agar akun tetap aman.</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="Minimal 8 karakter"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Ketik ulang password baru"
              required
            />
          </div>
          <button type="submit" disabled={changePasswordMutation.isLoading} className="btn-primary w-full py-3">
            {changePasswordMutation.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />} {changePasswordMutation.isLoading ? 'Menyimpan...' : 'Ubah Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
