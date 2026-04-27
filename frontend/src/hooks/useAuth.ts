import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  clearStoredAuthTokens,
  setStoredAuthTokens,
  type AuthResponse,
  type BackendRole,
  type Employee,
  type User,
} from '@/services/api'

export interface AppUser {
  id: string
  email: string
  name: string
  role: BackendRole
  roleLabel: string
  isActive: boolean
  employeeId?: string
  employee?: Employee | null
}

interface AuthState {
  user: AppUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (response: AuthResponse) => void
  setSession: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
}

const roleLabels: Record<BackendRole, string> = {
  admin: 'Admin',
  hr_manager: 'HR Manager',
  employee: 'Employee',
}

export const getRoleLabel = (role?: BackendRole) => {
  return role ? roleLabels[role] : 'Employee'
}

export const canManagePeople = (role?: BackendRole) => {
  return role === 'admin' || role === 'hr_manager'
}

export const normalizeUser = (user: User, employeeOverride?: Employee): AppUser => {
  const employee = employeeOverride ?? user.employee
  const name = employee
    ? `${employee.firstName} ${employee.lastName}`.trim()
    : user.email

  return {
    id: user.id,
    email: user.email,
    name,
    role: user.role,
    roleLabel: getRoleLabel(user.role),
    isActive: user.isActive,
    employeeId: employee?.id,
    employee,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (response) => {
        setStoredAuthTokens(response.accessToken, response.refreshToken)
        set({
          user: normalizeUser(response.user, response.employee),
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
        })
      },
      setSession: (user, accessToken, refreshToken) => {
        setStoredAuthTokens(accessToken, refreshToken)
        set({
          user: normalizeUser(user),
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },
      logout: () => {
        clearStoredAuthTokens()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
)
