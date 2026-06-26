import axios from 'axios'

// ── Public API ──────────────────────────────────────────────────────────────
export const api = axios.create({ baseURL: '/api', timeout: 30000 })
api.interceptors.response.use(r => r.data, err => Promise.reject(err.response?.data || err))

// ── Admin API (JWT) ─────────────────────────────────────────────────────────
export const adminApi = axios.create({ baseURL: '/api/admin', timeout: 30000 })
adminApi.interceptors.request.use(cfg => {
  const token = localStorage.getItem('mito_admin_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})
adminApi.interceptors.response.use(
  r => r.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mito_admin_token')
      localStorage.removeItem('mito_admin_user')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

// ── Public helpers ──────────────────────────────────────────────────────────
export const publicApi = {
  getProgram:          ()   => api.get('/program'),
  getPemenang:         ()   => api.get('/pemenang'),
  cekStatus:           (id) => api.get(`/registrasi/${id}`),
  submitRegistrasi:    (fd) => api.post('/registrasi', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// ── Admin helpers ───────────────────────────────────────────────────────────
export const adminApiHelper = {
  // Auth
  login:              (creds)  => adminApi.post('/login', creds),

  // Dashboard
  dashboard:          ()       => adminApi.get('/dashboard'),

  // Profile
  getProfile:         ()       => adminApi.get('/profile'),
  changeProfilePassword: (body) => adminApi.put('/profile/password', body),
  updateProfile:      (formData) => adminApi.put('/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Peserta (registrasi baru)
  listPeserta:        (params) => adminApi.get('/peserta', { params }),
  detailPeserta:      (id)     => adminApi.get(`/peserta/${id}`),
  verifikasi:         (id, b)  => adminApi.put(`/peserta/${id}/verifikasi`, b),

  // Token Pending (pembelian ulang)
  listTokenPending:       (params) => adminApi.get('/token-pending', { params }),
  detailTokenPending:     (id)     => adminApi.get(`/token-pending/${id}`),
  verifikasiTokenPending: (id, b)  => adminApi.put(`/token-pending/${id}/verifikasi`, b),

  // Admin users
  listAdminUsers:          ()       => adminApi.get('/users'),
  createAdminUser:         (formData) => adminApi.post('/users', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateAdminUser:         (id, formData) => adminApi.put(`/users/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changeAdminUserPassword: (id, body) => adminApi.put(`/users/${id}/password`, body),

  // Undian & pemenang
  listPemenang:       ()       => adminApi.get('/pemenang'),
  jalankanUndian:     (b)      => adminApi.post('/undian', b),
  umumkanPemenang:    (id)     => adminApi.put(`/pemenang/${id}/umumkan`),
}
