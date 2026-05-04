import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { User } from './lib/api'
import { getSavedUser, clearAuth, saveAuth } from './lib/auth'
import api from './lib/api'

const GUEST_USER: User = {
  id: 0,
  email: 'guest@metis.local',
  username: 'guest',
  full_name: 'Guest',
  department: 'General',
  avatar_initials: 'G',
  is_admin: true,
  is_active: true,
  xp: 0,
  level: 1,
  streak: 0,
  last_login: null,
  created_at: new Date().toISOString(),
}

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Toast from './components/Toast'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SkillGames from './pages/SkillGames'
import Learning from './pages/Learning'
import WhatsOn from './pages/WhatsOn'
import EnterpriseTools from './pages/EnterpriseTools'
import AITools from './pages/AITools'
import Admin from './pages/Admin'

// Auth Context
interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

// Toast Context
interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type?: ToastMessage['type']) => void
}

export const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

// Auth disabled — all routes are open
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// App shell with sidebar + topbar
function AppShell({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="main-area">
        <Topbar title={pageTitle} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUserState] = useState<User | null>(getSavedUser() ?? GUEST_USER)
  const [authReady, setAuthReady] = useState(() => !!localStorage.getItem('metis_token'))
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  let toastIdRef = React.useRef(0)

  const setUser = useCallback((u: User | null) => {
    setUserState(u)
    if (u) {
      localStorage.setItem('metis_user', JSON.stringify(u))
    } else {
      localStorage.removeItem('metis_user')
    }
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUserState(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      // token invalid - will be handled by interceptor
    }
  }, [setUser])

  // Auto-login: if no token is stored, authenticate as the default admin account
  useEffect(() => {
    const token = localStorage.getItem('metis_token')
    if (token) {
      setAuthReady(true)
      return
    }
    ;(async () => {
      try {
        const loginRes = await api.post('/auth/login', {
          email: 'admin@metis.ai',
          password: 'MetisAdmin2024!',
        })
        const { access_token } = loginRes.data
        localStorage.setItem('metis_token', access_token)
        const meRes = await api.get('/auth/me')
        saveAuth(access_token, meRes.data)
        setUserState(meRes.data)
      } catch {
        // backend unavailable — guest user stays in place
      } finally {
        setAuthReady(true)
      }
    })()
  }, [])

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  if (!authReady) return null

  return (
    <AuthContext.Provider value={{ user, setUser, logout, refreshUser }}>
      <ToastContext.Provider value={{ showToast }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell pageTitle="Dashboard">
                    <Dashboard />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/skill-games"
              element={
                <ProtectedRoute>
                  <AppShell pageTitle="Skill Games">
                    <SkillGames />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning"
              element={
                <ProtectedRoute>
                  <AppShell pageTitle="Learning">
                    <Learning />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/whats-on"
              element={
                <ProtectedRoute>
                  <AppShell pageTitle="What's On">
                    <WhatsOn />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/enterprise-tools"
              element={
                <ProtectedRoute>
                  <AppShell pageTitle="Enterprise Tools">
                    <EnterpriseTools />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-tools"
              element={
                <ProtectedRoute>
                  <AppShell pageTitle="AI Tools">
                    <AITools />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AppShell pageTitle="Admin">
                    <Admin />
                  </AppShell>
                </AdminRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <Toast toasts={toasts} onRemove={removeToast} />
        </BrowserRouter>
      </ToastContext.Provider>
    </AuthContext.Provider>
  )
}
