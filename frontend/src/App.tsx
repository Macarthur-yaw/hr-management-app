
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import SidebarLayout from '@/layouts/SidebarLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import DashboardPage from '@/pages/Dashboard'
import EmployeesPage from '@/pages/Employees'
import LeaveRequestsPage from '@/pages/LeaveRequests'
import DepartmentsPage from '@/pages/Departments'
import PositionsPage from '@/pages/Positions'
import NotFoundPage from '@/pages/NotFound'
import ProfilePage from '@/pages/Profile'
import Home from './pages/Home'

function App() {
  return (
    <>
      <Routes>
        <Route index element={<Home/>} />
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <DashboardPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr_manager']}>
              <SidebarLayout>
                <EmployeesPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave-requests"
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <LeaveRequestsPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SidebarLayout>
                <DepartmentsPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/positions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SidebarLayout>
                <PositionsPage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requiredPermission="profile:read:self">
              <SidebarLayout>
                <ProfilePage />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
