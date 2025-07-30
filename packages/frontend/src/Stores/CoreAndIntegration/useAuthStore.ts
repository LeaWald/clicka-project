import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from 'shared-types'
import { DateISO } from 'shared-types'

interface AuthState {
  user: User | null
  sessionId: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionExpiry: DateISO | null

  setUser: (user: User) => void
  setSessionId: (sessionId: string) => void
  clearUser: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  isSessionExpired: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionExpiry: null,
      sessionId: null,

      setSessionId: (sessionId) => {
        set({ sessionId })
      },

      setUser: (user) => {
        console.log('Setting user:', user)
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
        set({
          user,
          isAuthenticated: true,
          sessionExpiry: expiresAt,
          error: null,
        })
      },

      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          sessionExpiry: null,
          error: null,
        })
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      isSessionExpired: () => {
        const expiry = get().sessionExpiry
        if (!expiry) return true
        return new Date() > new Date(expiry)
      },
    }),
    {
      name: 'auth-storage', // nombre de la key en localStorage
      partialize: (state) => ({
        user: state.user,
        sessionId: state.sessionId,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
      }),
    }
  )
)
