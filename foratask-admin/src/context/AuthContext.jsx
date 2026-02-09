import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const savedAdmin = localStorage.getItem('adminData')
    if (token && savedAdmin) {
      setAdmin(JSON.parse(savedAdmin))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/master-admin/login', { email, password })
    const { token, admin: adminData } = response.data
    localStorage.setItem('adminToken', token)
    localStorage.setItem('adminData', JSON.stringify(adminData))
    setAdmin(adminData)
    return adminData
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
