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
        set({
          isAuthenticated: true,
          user,
          token,
        })
      },

      logout: () => {
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
    }
  )
)
