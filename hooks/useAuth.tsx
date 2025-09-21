'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { User } from '@supabase/supabase-js'
import { authService } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  isPremium: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: any }>
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: any }>
  updatePremiumStatus: (premium: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth må brukes innenfor AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    // Sjekk om bruker allerede er logget inn
    const checkUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        console.log('Initial user check:', user)
        setUser(user)
        
        // Sjekk Premium-status fra localStorage
        const premiumStatus = localStorage.getItem('isPremium') === 'true'
        setIsPremium(premiumStatus)
      } catch (error) {
        console.error('Error checking user:', error)
        setUser(null)
        setIsPremium(false)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Lytt til auth state endringer
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      console.log('Auth state changed:', user)
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true)
    const response = await authService.signUp(email, password, fullName)
    setLoading(false)
    return response
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const response = await authService.signIn(email, password)
    setLoading(false)
    return response
  }

  const signOut = async () => {
    setLoading(true)
    await authService.signOut()
    setUser(null)
    setLoading(false)
    // Redirect til forsiden etter utlogging
    window.location.href = '/'
  }

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email)
  }

  const updatePremiumStatus = (premium: boolean) => {
    setIsPremium(premium)
    localStorage.setItem('isPremium', premium.toString())
  }

  const value = {
    user,
    loading,
    isPremium,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePremiumStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
