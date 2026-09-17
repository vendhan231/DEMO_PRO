import { createContext, useContext, useEffect, useState, useCallback } from "react"
import api from "../services/api"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await api.me()
      if (res.user) {
        setUser(res.user)
      } else {
        localStorage.removeItem("token")
      }
    } catch {
      localStorage.removeItem("token")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = (token, userData) => {
    localStorage.setItem("token", token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  const register = () => {
    localStorage.removeItem("token")
  }

  const isAuthenticated = !!user
  const isAdmin = user?.role === "admin"
  const isVerified = user?.email_verified || false
  const canAddBooks = isAuthenticated && isVerified

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated, isAdmin, isVerified, canAddBooks, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
