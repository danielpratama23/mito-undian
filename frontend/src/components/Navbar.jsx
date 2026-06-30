import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Gift, ChevronRight } from 'lucide-react'

const navItems = [
  { to: '/',                label: 'Beranda' },
  { to: '/hadiah',          label: 'Hadiah' },
  { to: '/cara-ikut',       label: 'Cara Ikut' },
  { to: '/syarat-ketentuan',label: 'S&K' },
  { to: '/faq',             label: 'FAQ' },
  { to: '/daftar-peserta',  label: 'Daftar Peserta' },
  { to: '/pemenang',        label: 'Pemenang' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-mito-red rounded-lg flex items-center justify-center">
            <img src="/logo_mito_white.png" alt="Logo"/>
          </div>
          <div className="leading-tight">
            <div className={`font-black text-lg leading-none ${scrolled ? 'text-mito-red' : 'text-white'}`}>
              MITO
            </div>
            <div className={`text-[10px] font-medium leading-none ${scrolled ? 'text-gray-500' : 'text-red-100'}`}>
              UNDIAN JAWA TIMUR
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === to
                  ? 'bg-mito-red text-white'
                  : scrolled
                    ? 'text-gray-600 hover:text-mito-red hover:bg-red-50'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA + Burger */}
        <div className="flex items-center gap-3">
          <Link
            to="/registrasi"
            className="hidden md:flex items-center gap-1.5 bg-mito-red hover:bg-mito-redDark text-white text-sm font-bold px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            Daftar <ChevronRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setOpen(o => !o)}
            className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`block px-4 py-2.5 rounded-xl font-medium transition-all ${
                  pathname === to
                    ? 'bg-red-50 text-mito-red'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/registrasi"
              className="block w-full text-center bg-mito-red text-white font-bold px-4 py-3 rounded-xl mt-2"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
