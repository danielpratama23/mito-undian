import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Layout      from './components/Layout'
import AdminLayout from './components/AdminLayout'
import AuthGuard   from './components/AuthGuard'

import Home             from './pages/Home'
import Hadiah           from './pages/Hadiah'
import CaraIkut         from './pages/CaraIkut'
import Registrasi       from './pages/Registrasi'
import SyaratKetentuan  from './pages/SyaratKetentuan'
import FAQ              from './pages/FAQ'
import DaftarPeserta    from './pages/DaftarPeserta'
import Pemenang         from './pages/Pemenang'

import AdminLogin         from './pages/admin/Login'
import AdminDashboard     from './pages/admin/Dashboard'
import AdminPesertaList   from './pages/admin/PesertaList'
import AdminPesertaDetail from './pages/admin/PesertaDetail'
import TokenPendingList   from './pages/admin/TokenPendingList'
import AdminUndian        from './pages/admin/Undian'
import AdminPemenang      from './pages/admin/Pemenang'
import AdminProfile       from './pages/admin/Profile'
import AdminUsers         from './pages/admin/Users'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route element={<Layout />}>
            <Route path="/"                  element={<Home />} />
            <Route path="/hadiah"            element={<Hadiah />} />
            <Route path="/cara-ikut"         element={<CaraIkut />} />
            <Route path="/registrasi"        element={<Registrasi />} />
            <Route path="/syarat-ketentuan"  element={<SyaratKetentuan />} />
            <Route path="/faq"               element={<FAQ />} />
            <Route path="/daftar-peserta"    element={<DaftarPeserta />} />
            <Route path="/pemenang"          element={<Pemenang />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
            <Route index                  element={<AdminDashboard />} />
            <Route path="peserta"         element={<AdminPesertaList />} />
            <Route path="peserta/:id"     element={<AdminPesertaDetail />} />
            <Route path="token-pending"   element={<TokenPendingList />} />
            <Route path="undian"          element={<AdminUndian />} />
            <Route path="pemenang"        element={<AdminPemenang />} />
            <Route path="profile"         element={<AdminProfile />} />
            <Route path="users"           element={<AdminUsers />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
    </QueryClientProvider>
  )
}
