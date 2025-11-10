import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CredentialResponse } from '@react-oauth/google'

interface User {
  id: string
  email: string
  name: string
  picture?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (credentialResponse: CredentialResponse) => void
  loginWithEmail: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedToken = localStorage.getItem('authToken')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const token = credentialResponse.credential
      
      // Decode JWT to get user info
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      
      const payload = JSON.parse(jsonPayload)
      
      const userData: User = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      }
      
      setUser(userData)
      setToken(token)
      
      // Store in localStorage
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setError(null)
    }
  }

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setError(null)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }
      
      const data = await response.json()
      
      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      setError(null)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }
      
      const data = await response.json()
      
      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setError(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginWithEmail,
        register,
        logout,
        isAuthenticated: !!user,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
