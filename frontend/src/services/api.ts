import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const ACCESS_TOKEN_KEY = 'auth-token'
export const REFRESH_TOKEN_KEY = 'refresh-token'

export type BackendRole = 'admin' | 'hr_manager' | 'employee'
export type EmploymentStatus = 'active' | 'inactive' | 'on_leave' | 'terminated'
export type AccessLevel = 'basic' | 'manager' | 'admin'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  role: BackendRole
  isActive: boolean
  employee?: Employee | null
  createdAt?: string
  updatedAt?: string
}

export interface Department {
  id: string
  name: string
  description?: string | null
  managerId?: string | null
  manager?: Employee | null
  positions?: Position[]
  employees?: Employee[]
  _count?: {
    employees: number
    positions: number
  }
  createdAt?: string
  updatedAt?: string
}

export interface Position {
  id: string
  title: string
  description?: string | null
  departmentId?: string | null
  permissions: string[]
  accessLevel: AccessLevel
  department?: Department | null
  employees?: Employee[]
  _count?: {
    employees: number
  }
  createdAt?: string
  updatedAt?: string
}

export interface Employee {
  id: string
  userId: string
  firstName: string
  lastName: string
  phone?: string | null
  address?: string | null
  departmentId?: string | null
  positionId?: string | null
  salary?: number | string | null
  employmentStatus: EmploymentStatus
  dateJoined: string
  profileImage?: string | null
  isActive: boolean
  user?: User
  department?: Department | null
  position?: Position | null
  createdAt?: string
  updatedAt?: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
  reviewedByUserId?: string | null
  reviewComment?: string | null
  employee?: Employee
  reviewedBy?: User | null
  createdAt: string
  updatedAt?: string
}

export interface AuthResponse {
  user: User
  employee?: Employee
  accessToken: string
  refreshToken: string
}

export interface DepartmentCreatePayload {
  name: string
  description?: string
  managerId?: string
}

export interface PositionCreatePayload {
  title: string
  description?: string
  departmentId?: string
  permissions?: string[]
  accessLevel?: AccessLevel
}

export interface EmployeeCreatePayload {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  address?: string
  role?: BackendRole
  departmentId?: string
  positionId?: string
  salary?: number
  employmentStatus?: EmploymentStatus
  dateJoined?: string
  profileImage?: string
}

export type EmployeeUpdatePayload = Partial<EmployeeCreatePayload> & {
  isActive?: boolean
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong',
) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    if (typeof data === 'string' && data.trim()) {
      return data
    }

    if (data && typeof data === 'object') {
      const apiError = data as {
        message?: unknown
        error?: unknown
        errors?: unknown
      }

      if (typeof apiError.message === 'string' && apiError.message.trim()) {
        return apiError.message
      }

      if (typeof apiError.error === 'string' && apiError.error.trim()) {
        return apiError.error
      }

      if (Array.isArray(apiError.errors)) {
        const messages = apiError.errors.filter(
          (item): item is string => typeof item === 'string' && item.trim() !== '',
        )

        if (messages.length > 0) {
          return messages.join(', ')
        }
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export const getStoredAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)

export const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

export const setStoredAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)

  const persistedAuth = localStorage.getItem('auth-storage')

  if (persistedAuth) {
    try {
      const parsedAuth = JSON.parse(persistedAuth) as {
        state?: {
          accessToken?: string | null
          refreshToken?: string | null
        }
        version?: number
      }

      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          ...parsedAuth,
          state: {
            ...(parsedAuth.state ?? {}),
            accessToken,
            refreshToken,
          },
        }),
      )
    } catch {
      localStorage.removeItem('auth-storage')
    }
  }
}

export const clearStoredAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const redirectToSignIn = () => {
  if (window.location.pathname !== '/signin') {
    window.location.href = '/signin'
  }
}

const shouldAttemptRefresh = (requestUrl: string) => {
  return !['/auth/login', '/auth/register', '/auth/refresh'].includes(requestUrl)
}

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      shouldAttemptRefresh(originalRequest.url ?? '')
    ) {
      const refreshToken = getStoredRefreshToken()

      if (refreshToken) {
        try {
          originalRequest._retry = true
          const response = await api.post<AuthResponse>('/auth/refresh', {
            refreshToken,
          })

          setStoredAuthTokens(response.data.accessToken, response.data.refreshToken)
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`

          return api(originalRequest)
        } catch {
          clearStoredAuthTokens()
          localStorage.removeItem('auth-storage')
          redirectToSignIn()
        }
      }
    }

    return Promise.reject(error)
  },
)

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password })
    return response.data
  },

  register: async (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => {
    const response = await api.post<AuthResponse>('/auth/register', userData)
    return response.data
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken })
    return response.data
  },

  logout: async (refreshToken: string) => {
    const response = await api.post<{ message: string }>('/auth/logout', {
      refreshToken,
    })
    return response.data
  },

  me: async () => {
    const response = await api.get<{ user: User }>('/auth/me')
    return response.data
  },
}

export const employeeService = {
  list: async (params?: {
    search?: string
    departmentId?: string
    positionId?: string
    employmentStatus?: EmploymentStatus
    isActive?: boolean
    page?: number
    limit?: number
  }) => {
    const response = await api.get<{
      employees: Employee[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>('/employees', { params })
    return response.data
  },

  create: async (payload: EmployeeCreatePayload) => {
    const response = await api.post<{ employee: Employee }>('/employees', payload)
    return response.data
  },

  get: async (id: string) => {
    const response = await api.get<{ employee: Employee }>(`/employees/${id}`)
    return response.data
  },

  update: async (id: string, payload: EmployeeUpdatePayload) => {
    const response = await api.patch<{ employee: Employee }>(`/employees/${id}`, payload)
    return response.data
  },

  deactivate: async (id: string) => {
    const response = await api.delete<{
      message: string
      employee: Employee
    }>(`/employees/${id}`)
    return response.data
  },
}

export const departmentService = {
  list: async () => {
    const response = await api.get<{ departments: Department[] }>('/departments')
    return response.data
  },

  create: async (payload: DepartmentCreatePayload) => {
    const response = await api.post<{ department: Department }>('/departments', payload)
    return response.data
  },
}

export const positionService = {
  list: async () => {
    const response = await api.get<{ positions: Position[] }>('/positions')
    return response.data
  },

  create: async (payload: PositionCreatePayload) => {
    const response = await api.post<{ position: Position }>('/positions', payload)
    return response.data
  },
}

export const leaveService = {
  listAll: async (params?: { status?: LeaveStatus; employeeId?: string }) => {
    const response = await api.get<{ leaveRequests: LeaveRequest[] }>('/leave', {
      params,
    })
    return response.data
  },

  listMine: async () => {
    const response = await api.get<{ leaveRequests: LeaveRequest[] }>('/leave/me')
    return response.data
  },

  review: async (
    id: string,
    payload: {
      status: Extract<LeaveStatus, 'approved' | 'rejected'>
      reviewComment?: string
    },
  ) => {
    const response = await api.patch<{ leaveRequest: LeaveRequest }>(
      `/leave/${id}/review`,
      payload,
    )
    return response.data
  },
}

export default api
