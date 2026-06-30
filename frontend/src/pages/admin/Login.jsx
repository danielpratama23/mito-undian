import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader2, Gift } from 'lucide-react'
import { adminApiHelper } from '../../api/client'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await adminApiHelper.login(form)
      localStorage.setItem('mito_admin_token', res.token)
        localStorage.setItem('mito_admin_user', JSON.stringify({ username: form.username, role: res.role, avatarUrl: res.avatarUrl || null }))
      navigate('/admin')
    } catch (err) {
      setError(err?.message || 'Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <img src="/logo_mito.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain"/>
          </div>
          <h1 className="text-2xl font-black text-white">MITO Admin</h1>
          <p className="text-red-200 text-sm mt-1">Panel Verifikasi Undian Jawa Timur</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="font-bold text-gray-900 mb-6 text-lg">Login Admin</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="input-field"
                placeholder="admin"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
                <Lock className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-red-200 text-xs mt-6">
          © 2026 MITO · Sistem Internal · Hanya untuk Admin
        </p>
      </div>
    </div>
  )
}
