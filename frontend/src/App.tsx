import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit, useAuth } from '@/hooks/useAuth'
import Layout from '@/components/layout/Layout'
import AdminLayout from '@/components/layout/AdminLayout'
import MechanicLayout from '@/components/layout/MechanicLayout'
import Loader from '@/components/ui/Loader'

// Pages
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/About'
import ContactPage from '@/pages/Contact'
import TermsPage from '@/pages/Terms'
import PrivacyPage from '@/pages/Privacy'
import CookiesPage from '@/pages/Cookies'
import SearchPage from '@/pages/SearchPage'
import MechanicProfilePage from '@/pages/MechanicProfilePage'
import SignupPage from '@/pages/SignupPage'
import LoginPage from '@/pages/LoginPage'
import PricingPage from '@/pages/PricingPage'
import DashboardPage from '@/pages/DashboardPage'
import AdminPage from '@/pages/AdminPage'
import AdminAdsPage from '@/pages/AdminAdsPage'
import AdminSetupPage from '@/pages/AdminSetupPage'
import DemoPage from '@/pages/DemoPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AffiliateDashboardPage from '@/pages/AffiliateDashboardPage'

// Protected route wrapper
function ProtectedRoute({ 
  children, 
  role 
}: { 
  children: React.ReactNode
  role?: 'admin' | 'mechanic'
}) {
  const { isAuthenticated, isAdmin, isMechanic, isLoading } = useAuth()

  if (isLoading) return <Loader fullPage />

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (role === 'admin' && !isAdmin) {
    // Redirect to home with an error message (could use a toast)
    return <Navigate to="/" replace />
  }

  if (role === 'mechanic' && !isMechanic) {
    // Redirect to home with an informative toast
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  useAuthInit()

  return (
    <Routes>
      {/* Public routes – all wrapped with Layout for consistency */}
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/about" element={<Layout><AboutPage /></Layout>} />
      <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
      <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
      <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
      <Route path="/cookies" element={<Layout><CookiesPage /></Layout>} />
      <Route path="/search" element={<Layout><SearchPage /></Layout>} />
      <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
      <Route path="/login" element={<Layout><LoginPage /></Layout>} />
      <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
      <Route path="/mechanic/:id" element={<MechanicLayout><MechanicProfilePage /></MechanicLayout>} />
      <Route path="/demo" element={<Layout><DemoPage /></Layout>} />

      {/* Mechanic-only routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="mechanic">
            <MechanicLayout><DashboardPage /></MechanicLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/affiliate"
        element={
          <ProtectedRoute>
            <Layout><AffiliateDashboardPage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin routes – using separate pages for clarity */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout><AdminPage /></AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ads"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout><AdminAdsPage /></AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Setup – unprotected for initial admin creation */}
      <Route path="/admin/setup" element={<AdminSetupPage />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
    </Routes>
  )
}