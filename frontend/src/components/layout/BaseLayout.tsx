// src/components/layout/BaseLayout.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from '@/lib/api/auth'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectUser, selectProfile, selectIsAdmin, logout } from '@/store/authSlice'

interface NavLink { to: string; label: string; match?: string }
interface BaseLayoutProps { children: React.ReactNode; navLinks: NavLink[] }

function isActive(to: string, match: string | undefined, pathname: string) {
  if (match) return pathname.startsWith(match)
  if (to === '/') return pathname === '/'
  return pathname === to
}

const FOR_DRIVERS    = [['/','Find a Mechanic'],['/search','Search by City']] as const
const FOR_MECHANICS  = [['/signup','Create Listing'],['/pricing','View Plans']] as const
const COMPANY_LINKS  = [
  ['/about','About'],['/contact','Contact'],
  ['/terms','Terms'],['/privacy','Privacy'],['/cookies','Cookies'],
  ['/demo','Interactive Demo'],   // 👈 added demo link in footer
] as const

export default function BaseLayout({ children, navLinks }: BaseLayoutProps) {
  const dispatch        = useAppDispatch()
  const user            = useAppSelector(selectUser)
  const profile         = useAppSelector(selectProfile)
  const isAdmin         = useAppSelector(selectIsAdmin)
  const isAuthenticated = !!user

  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const close = () => setMobileOpen(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // Ignore API errors — log out locally regardless
    } finally {
      await dispatch(logout())
      navigate('/')
      toast.success('Signed out')
      close()
    }
  }

  return (
    <>
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-surface-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">

          {/* Logo */}
          <Link to="/" onClick={close}
            className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-brand-500 to-red-500
              flex items-center justify-center text-lg sm:text-xl shadow-glow-brand
              group-hover:scale-105 transition-transform">
              🔧
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight">
              Mechanic<span className="text-brand-500">NG</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive(l.to, l.match, location.pathname)
                    ? 'text-brand-500 bg-brand-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                {l.label}
              </Link>
            ))}
            {/* 👇 demo link added to desktop nav */}
            <Link to="/demo"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive('/demo', undefined, location.pathname)
                  ? 'text-brand-500 bg-brand-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              Interactive Demo
            </Link>
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 truncate max-w-[140px]">
                  {profile?.full_name || profile?.email}
                  {isAdmin && (
                    <span className="ml-2 badge bg-brand-500/20 text-brand-500 text-xs">Admin</span>
                  )}
                </span>
                <button onClick={handleSignOut} className="btn-ghost text-sm">Sign Out</button>
              </div>
            ) : (
              <>
                <Link to="/login"  className="btn-ghost text-sm">Sign In</Link>
                <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu">
            <span className="text-xl leading-none">{mobileOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={`md:hidden border-t border-gray-800 bg-surface-900 overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={close}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive(l.to, l.match, location.pathname)
                    ? 'text-brand-500 bg-brand-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}>
                {l.label}
              </Link>
            ))}
            {/* 👇 demo link added to mobile drawer */}
            <Link to="/demo" onClick={close}
              className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive('/demo', undefined, location.pathname)
                  ? 'text-brand-500 bg-brand-500/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}>
              Interactive Demo
            </Link>

            <div className="pt-2 mt-2 border-t border-gray-800 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-xs text-gray-500 truncate">
                    {profile?.full_name || profile?.email}
                    {isAdmin && (
                      <span className="ml-2 badge bg-brand-500/20 text-brand-500">Admin</span>
                    )}
                  </div>
                  <button onClick={handleSignOut}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/5 transition-all">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={close}
                    className="block px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                    Sign In
                  </Link>
                  <Link to="/signup" onClick={close}
                    className="block btn-primary text-center text-sm">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page content ───────────────────────────────────── */}
      <main className="flex-1 page-enter">{children}</main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 bg-surface-900 pt-10 pb-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🔧</span>
                <span className="font-extrabold">
                  Mechanic<span className="text-brand-500">NG</span>
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Nigeria's trusted mechanic directory.<br />Find. Fix. Move.
              </p>
            </div>

            {/* For Drivers */}
            <div>
              <h4 className="font-bold text-gray-300 mb-3 text-xs uppercase tracking-wider">For Drivers</h4>
              <div className="space-y-2">
                {FOR_DRIVERS.map(([to, label]) => (
                  <Link key={to} to={to}
                    className="block text-gray-500 hover:text-brand-500 text-sm transition-colors">
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* For Mechanics */}
            <div>
              <h4 className="font-bold text-gray-300 mb-3 text-xs uppercase tracking-wider">For Mechanics</h4>
              <div className="space-y-2">
                {FOR_MECHANICS.map(([to, label]) => (
                  <Link key={to} to={to}
                    className="block text-gray-500 hover:text-brand-500 text-sm transition-colors">
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-gray-300 mb-3 text-xs uppercase tracking-wider">Company</h4>
              <div className="space-y-2">
                {COMPANY_LINKS.map(([to, label]) => (
                  <Link key={to} to={to}
                    className="block text-gray-500 hover:text-brand-500 text-sm transition-colors">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} MechanicNG. Built for Nigerian roads.</p>

            <div className="footer-dev-bar">
              <div className="footer-dev-rule" />
              <div className="footer-dev-text">
                <span className="footer-dev-label">Website developed by</span>
                <span className="footer-dev-dot" />
                <span className="footer-dev-name-credit">Akaninyene Akpan</span>
              </div>
              <div className="footer-dev-rule footer-dev-rule--right" />
            </div>

            <p>Payments secured by Paystack</p>
          </div>
        </div>
      </footer>
    </>
  )
}