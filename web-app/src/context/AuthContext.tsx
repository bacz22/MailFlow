import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { CurrentUserResponse } from '../types/auth.types'
import { authService } from '../services/auth.service'
import { userService } from '../services/user.service'

interface AuthContextValue {
  user: CurrentUserResponse | null
  loading: boolean
  refreshUser: () => Promise<CurrentUserResponse | null>
  setUser: (user: CurrentUserResponse | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async (): Promise<CurrentUserResponse | null> => {
    try {
      const me = await userService.getMe()
      setUser(me)
      return me
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const me = await userService.getMe()
        if (!cancelled) {
          setUser(me)
        }
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, refreshUser, setUser, logout }),
    [user, loading, refreshUser, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
