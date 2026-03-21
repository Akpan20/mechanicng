import { Link, useNavigate } from 'react-router-dom'
import { signOut } from '@/lib/api/auth'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectProfile, logout } from '@/store/authSlice'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const profile  = useAppSelector(selectProfile)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
    } finally {
      await dispatch(logout())
      navigate('/')
      toast.success('Signed out')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-950">
      <header className="sticky top-0 z-50 bg-surface-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-red-500 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                🔧
              </div>
              <span className="font-extrabold tracking-tight">
                Mechanic<span className="text-brand-500">NG</span>
              </span>
            </Link>
            <span className="text-gray-700">|</span>
            <span className="text-xs font-bold text-brand-500 uppercase tracking-widest">Admin</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">
              {profile?.full_name || profile?.email}
            </span>
            <button onClick={handleSignOut} className="btn-ghost text-sm">Sign Out</button>
          </div>

        </div>
      </header>

      <main className="flex-1 page-enter">{children}</main>

      <footer className="border-t border-gray-800 py-4 px-4 text-center text-xs text-gray-600">
        MechanicNG Admin Panel · © {new Date().getFullYear()}
      </footer>
    </div>
  )
}