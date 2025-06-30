"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  userEmail: string | null
  login: (email: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Handle mounting to prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Only check localStorage after component is mounted on client
    if (!isMounted) return
    
    try {
      const authStatus = localStorage.getItem('isAuthenticated')
      const email = localStorage.getItem('userEmail')
      
      if (authStatus === 'true' && email) {
        setIsAuthenticated(true)
        setUserEmail(email)
      } else {
        setIsAuthenticated(false)
        setUserEmail(null)
      }
    } catch (error) {
      console.warn('Error accessing localStorage:', error)
      setIsAuthenticated(false)
      setUserEmail(null)
    }
    
    setIsLoading(false)
  }, [isMounted])

  useEffect(() => {
    if (!isLoading) {
      // Redirect to login if not authenticated and not already on login page
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login')
      }
      // Redirect to dashboard if authenticated and on login page
      else if (isAuthenticated && pathname === '/login') {
        router.push('/')
      }
    }
  }, [isAuthenticated, pathname, isLoading, router])

  const login = (email: string) => {
    setIsAuthenticated(true)
    setUserEmail(email)
    
    try {
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userEmail', email)
    } catch (error) {
      console.warn('Error saving to localStorage:', error)
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUserEmail(null)
    
    try {
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userEmail')
    } catch (error) {
      console.warn('Error removing from localStorage:', error)
    }
    
    router.push('/login')
  }

  const value = {
    isAuthenticated,
    userEmail,
    login,
    logout
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 