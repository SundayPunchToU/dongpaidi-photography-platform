import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  username: string
  email: string
  loginTime: string
  role?: string
  avatarUrl?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: (user: User, token: string) => {
        console.log('用户登录:', { user, token })
        set({
          isAuthenticated: true,
          user,
          token,
        })
      },

      logout: () => {
        console.log('用户登出')
        // 清理localStorage
        localStorage.removeItem('auth-storage')
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        })
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
      // 添加版本控制，强制清理旧数据
      version: 2,
      migrate: (persistedState: any, version: number) => {
        console.log('迁移认证状态:', { persistedState, version })
        // 如果是旧版本，清空状态
        if (version < 2) {
          return {
            isAuthenticated: false,
            user: null,
            token: null,
          }
        }
        return persistedState
      },
    }
  )
)
