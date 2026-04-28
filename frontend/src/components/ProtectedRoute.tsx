import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import {
  hasPermission,
  useAuthStore,
  type AppPermission,
} from '@/hooks/useAuth'
import type { BackendRole } from '@/services/api'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: BackendRole
  allowedRoles?: BackendRole[]
  requiredPermission?: AppPermission
}

export default function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  requiredPermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />
  }

  if (requiredPermission && !hasPermission(user?.role, requiredPermission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
