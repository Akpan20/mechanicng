import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import PageLoader from '../ui/PageLoader'

export default function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode
  role?: 'admin' | 'mechanic'
}) {
  const { isAuthenticated, isAdmin, isMechanic, isLoading } = useAuth()

  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role === 'admin' && !isAdmin) return <Navigate to="/" replace />
  if (role === 'mechanic' && !isMechanic && !isAdmin)
    return <Navigate to="/" replace />

  return <>{children}</>
}