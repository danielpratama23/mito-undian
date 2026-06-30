import React from 'react'
import { Link } from 'react-router-dom'
import { Gift, Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-mito-dark text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-mito-red rounded-lg flex items-center justify-center">
                <img src="/logo_mito.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain"/>
              </div>
              <div>
                <div className="font-black text-xl leading-none">MITO</div>
                <div className="text-xs text-gray-400 leading-none">UNDIAN JAWA TIMUR 2026</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Program undian berhadiah eksklusif untuk pelanggan setia MITO di wilayah Jawa Timur. 
              Periode Agustus–Oktober 2026.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-sm text-gray-300 uppercase tracking-wider mb-4">Program</h4>
            <ul className="space-y-2">
              {[
                ['/', 'Beranda'],
                ['/hadiah', 'Hadiah'],
                ['/cara-ikut', 'Cara Ikut'],
                ['/registrasi', 'Daftar'],
                ['/pemenang', 'Pemenang'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="font-bold text-sm text-gray-300 uppercase tracking-wider mb-4">Kontak</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-mito-red" />
                Jawa Timur, Indonesia
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4 flex-shrink-0 text-mito-red" />
                Customer Service MITO
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0 text-mito-red" />
                finance@mito.co.id
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© 2026 MITO. Program Undian Jawa Timur. Semua hak dilindungi.</p>
          <div className="flex gap-4">
            <Link to="/syarat-ketentuan" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
            <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
