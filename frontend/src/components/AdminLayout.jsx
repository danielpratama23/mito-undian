import React, { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Trophy, Gift, LogOut, Menu, RefreshCw, ChevronRight, UserCog} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminApiHelper } from '../api/client'

const navItems = [
  { to: '/admin',                label: 'Dashboard',       Icon: LayoutDashboard, exact: true },
  { to: '/admin/peserta',        label: 'Peserta',         Icon: Users },
  { to: '/admin/token-pending',  label: 'Pembelian Ulang', Icon: RefreshCw, badgeKey: 'pendingUlang' },
  { to: '/admin/undian',         label: 'Undian',          Icon: Trophy },
  { to: '/admin/pemenang',       label: 'Pemenang',        Icon: Gift },
  { to: '/admin/users',          label: 'Manajemen',       Icon: UserCog},
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate     = useNavigate()

  const admin = JSON.parse(localStorage.getItem('mito_admin_user') || '{}')

  // Ambil dashboard untuk badge pending ulang
  const { data: dash } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApiHelper.dashboard,
    refetchInterval: 30000,
  })
  const pendingUlang = dash?.data?.pendingUlang || 0

  function logout() {
    localStorage.removeItem('mito_admin_token')
    localStorage.removeItem('mito_admin_user')
    navigate('/admin/login')
  }

  const isActive = (to, exact) => exact ? pathname === to : pathname.startsWith(to)

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-mito-dark text-white">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-mito-red rounded-lg flex items-center justify-center">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-black text-sm leading-none">MITO Admin</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Undian Jawa Timur</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, Icon, exact, badgeKey }) => {
          const active = isActive(to, exact)
          const badge  = badgeKey === 'pendingUlang' ? pendingUlang : 0
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-mito-red text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="bg-amber-400 text-amber-900 text-xs font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {badge}
                </span>
              )}
              {active && <ChevronRight className="w-3 h-3" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <Link to="/admin/profile" className="flex items-center gap-3 mb-3 overflow-y-auto">
          {admin.avatarUrl ? (
            <img src={admin.avatarUrl} alt={admin.username} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 bg-mito-red/30 rounded-full flex items-center justify-center text-mito-red font-bold text-sm">
              {admin.username?.[0]?.toUpperCase() || 'A'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{admin.username || 'Admin'}</div>
            <div className="text-xs text-gray-400 capitalize">{admin.role || 'verifikator'}</div>
          </div>
        </Link>
        <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="hidden md:flex w-56 flex-shrink-0 flex-col"><Sidebar /></div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-56 flex flex-col"><Sidebar /></div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-800">MITO Admin</span>
          {pendingUlang > 0 && (
            <span className="ml-auto bg-amber-400 text-amber-900 text-xs font-black px-2 py-0.5 rounded-full">
              {pendingUlang} pending
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto"><Outlet /></div>
      </div>
    </div>
  )
}
