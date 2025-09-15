import React, { useEffect, useState } from 'react'
import { Spin, Alert } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/api'

interface AuthGuardProps {
  children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, token, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateAuth = async () => {
      console.log('验证认证状态:', { isAuthenticated, hasToken: !!token })
      
      // 如果没有认证状态，直接结束加载
      if (!isAuthenticated || !token) {
        console.log('未认证，清理状态')
        logout()
        setLoading(false)
        return
      }

      try {
        // 验证当前会话是否有效
        console.log('验证会话有效性...')
        const response = await authApi.getCurrentUser()
        
        if (response.data.success) {
          console.log('会话验证成功')
          setError(null)
        } else {
          console.log('会话验证失败:', response.data.message)
          logout()
        }
      } catch (error: any) {
        console.error('会话验证错误:', error)
        if (error.response?.status === 401) {
          console.log('会话已过期，清理认证状态')
          logout()
        } else {
          setError('网络连接错误，请检查网络设置')
        }
      } finally {
        setLoading(false)
      }
    }

    validateAuth()
  }, [isAuthenticated, token, logout])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>
          正在验证登录状态...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px'
      }}>
        <Alert
          message="连接错误"
          description={error}
          type="error"
          showIcon
          action={
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#ff4d4f',
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              重新加载
            </button>
          }
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    // 这里不渲染任何内容，让App.tsx的路由处理重定向
    return null
  }

  return <>{children}</>
}

export default AuthGuard
