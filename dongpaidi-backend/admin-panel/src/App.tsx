import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import AdminLayout from '@/components/Layout/AdminLayout'
import ErrorBoundary from '@/components/ErrorBoundary'
import AuthGuard from '@/components/AuthGuard'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import UserManagement from '@/pages/UserManagement'
import WorkManagement from '@/pages/WorkManagement'
import AppointmentManagement from '@/pages/AppointmentManagement'
import MessageManagement from '@/pages/MessageManagement'
import PaymentManagement from '@/pages/PaymentManagement'
import SystemSettings from '@/pages/SystemSettings'
import { useAuthStore } from '@/stores/authStore'

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const { Content } = Layout

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Routes>
          {/* 登录页面 */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />

          {/* 管理界面 */}
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <AuthGuard>
                  <AdminLayout>
                    <ErrorBoundary>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/works" element={<WorkManagement />} />
                        <Route path="/appointments" element={<AppointmentManagement />} />
                        <Route path="/messages" element={<MessageManagement />} />
                        <Route path="/payments" element={<PaymentManagement />} />
                        <Route path="/settings" element={<SystemSettings />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </ErrorBoundary>
                  </AdminLayout>
                </AuthGuard>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App