import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit, useAuth } from '@/hooks/useAuth'
import Layout         from '@/components/layout/Layout'
import AdminLayout    from '@/components/layout/AdminLayout'
import MechanicLayout from '@/components/layout/MechanicLayout'
import HomePage            from '@/pages/HomePage'
import AboutPage           from '@/pages/About'
import ContactPage         from '@/pages/Contact'
import TermsPage           from '@/pages/Terms'
import PrivacyPage         from '@/pages/Privacy'
import CookiesPage         from '@/pages/Cookies'
import SearchPage          from '@/pages/SearchPage'
import MechanicProfilePage from '@/pages/MechanicProfilePage'
import SignupPage          from '@/pages/SignupPage'
import LoginPage           from '@/pages/LoginPage'
import PricingPage         from '@/pages/PricingPage'
import DashboardPage       from '@/pages/DashboardPage'
import AdminPage           from '@/pages/AdminPage'
import AdminSetupPage      from '@/pages/AdminSetupPage'
import NotFoundPage        from '@/pages/NotFoundPage'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'admin' | 'mechanic' }) {
  const { isAuthenticated, isAdmin, isMechanic, isLoading } = useAuth()

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><div className="loader" /></div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role === 'admin'    && !isAdmin)    return <Navigate to="/" replace />
  if (role === 'mechanic' && !isMechanic) return <Navigate to="/signup" replace />
  return <>{children}</>
}

export default function App() {
  useAuthInit()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"            element={<Layout><HomePage /></Layout>} />
      <Route path="/about"   element={<AboutPage />}   />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/terms"   element={<TermsPage />}   />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/search"      element={<Layout><SearchPage /></Layout>} />     
      <Route path="/signup"      element={<Layout><SignupPage /></Layout>} />
      <Route path="/login"       element={<Layout><LoginPage /></Layout>} />
      <Route path="/pricing"     element={<Layout><PricingPage /></Layout>} />
      <Route path="/mechanic/:id" element={<MechanicLayout><MechanicProfilePage /></MechanicLayout>} />

      {/* Mechanic-only */}
      <Route path="/dashboard" element={
        <ProtectedRoute role="mechanic">
          <MechanicLayout><DashboardPage /></MechanicLayout>
        </ProtectedRoute>
      } />

      {/* Admin-only */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminLayout><AdminPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/ads" element={
        <ProtectedRoute role="admin">
          <AdminLayout><AdminPage /></AdminLayout>
        </ProtectedRoute>
      } />

      {/* Setup — unprotected so first admin can be created */}
      <Route path="/admin/setup" element={<AdminSetupPage />} />

      <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
    </Routes>
  )
}