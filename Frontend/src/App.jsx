import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import AuthModal from './components/AuthModal'
import LandingPage from './pages/LandingPage'
import DashboardLayout from './pages/DashboardLayout'
import { apiRequest, AUTH_STORAGE_KEY, clearAuth, saveAuth } from './services/api'
import BrandMark from './components/BrandMark'
import AdminDashboard from './pages/AdminDashboard'

function GuestOnlyRoute({ authUser, children }) {
  if (!authUser) return children

  return <Navigate to={authUser.role === 'admin' ? '/admin' : '/community'} replace />
}

function ProtectedRoute({ authUser, allowAdmin = false, children }) {
  if (!authUser) {
    return <Navigate to="/" replace />
  }

  if (authUser.role === 'admin' && !allowAdmin) {
    return <Navigate to="/admin" replace />
  }

  return children
}

function AdminRoute({ authUser, children }) {
  if (!authUser) {
    return <Navigate to="/" replace />
  }

  if (authUser.role !== 'admin') {
    return <Navigate to="/community" replace />
  }

  return children
}

function App() {
  const [authModal, setAuthModal] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [authToken, setAuthToken] = useState('')
  const [authReady, setAuthReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const bootAuth = async () => {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY)

      if (!saved) {
        setAuthReady(true)
        return
      }

      try {
        const parsed = JSON.parse(saved)
        const payload = await apiRequest('/me', {
          token: parsed.token,
        })

        setAuthToken(parsed.token)
        setAuthUser(payload.user)
      } catch {
        clearAuth()
      } finally {
        setAuthReady(true)
      }
    }

    void bootAuth()
  }, [])

  const handleAuthSuccess = ({ token, user }) => {
    console.log('Login user:', user)
    saveAuth({ token, user })
    setAuthToken(token)
    setAuthUser(user)
    setAuthModal(null)
    navigate(user.role === 'admin' ? '/admin' : '/community', { replace: true })
  }

  const handleUserUpdate = (user) => {
    saveAuth({ token: authToken, user })
    setAuthUser(user)
  }

  const handleLogout = async () => {
    try {
      if (authToken) {
        await apiRequest('/logout', {
          method: 'POST',
          token: authToken,
        })
      }
    } catch {
      // Ignore logout request failures and clear local auth anyway.
    } finally {
      clearAuth()
      setAuthToken('')
      setAuthUser(null)
      navigate('/', { replace: true })
    }
  }

  if (!authReady) {
    return (
      <div className="app-loading">
        <div className="loading-card">
          <BrandMark />
          <p>Loading FindIt...</p>
        </div>
      </div>
    )
  }

  const isModalOpen = Boolean(authModal)
  const renderDashboard = () => (
    <DashboardLayout
      user={authUser}
      token={authToken}
      onLogout={handleLogout}
      onUserUpdate={handleUserUpdate}
    />
  )

  return (
    <>
      <div className={`page-shell${isModalOpen ? ' is-modal-open' : ''}`}>
        <div className="page-blur-layer">
          <Routes>
            <Route
              path="/"
              element={(
                <GuestOnlyRoute authUser={authUser}>
                  <LandingPage onOpenModal={setAuthModal} />
                </GuestOnlyRoute>
              )}
            />
            <Route
              path="/community"
              element={(
                <ProtectedRoute authUser={authUser}>
                  {renderDashboard()}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/lost-items"
              element={(
                <ProtectedRoute authUser={authUser}>
                  {renderDashboard()}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/found-items"
              element={(
                <ProtectedRoute authUser={authUser}>
                  {renderDashboard()}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/messages"
              element={(
                <ProtectedRoute authUser={authUser}>
                  {renderDashboard()}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/contact"
              element={(
                <ProtectedRoute authUser={authUser}>
                  {renderDashboard()}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/profile"
              element={(
                <ProtectedRoute authUser={authUser}>
                  {renderDashboard()}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin"
              element={(
                <AdminRoute authUser={authUser}>
                  <AdminDashboard
                    user={authUser}
                    token={authToken}
                    onLogout={handleLogout}
                  />
                </AdminRoute>
              )}
            />
            <Route
              path="/admin/users"
              element={(
                <AdminRoute authUser={authUser}>
                  {renderDashboard()}
                </AdminRoute>
              )}
            />
            <Route
              path="/admin/lost-items"
              element={(
                <AdminRoute authUser={authUser}>
                  {renderDashboard()}
                </AdminRoute>
              )}
            />
            <Route
              path="/admin/found-items"
              element={(
                <AdminRoute authUser={authUser}>
                  {renderDashboard()}
                </AdminRoute>
              )}
            />
            <Route
              path="/admin/contact-messages"
              element={(
                <AdminRoute authUser={authUser}>
                  {renderDashboard()}
                </AdminRoute>
              )}
            />
            <Route
              path="/admin/profile"
              element={(
                <AdminRoute authUser={authUser}>
                  {renderDashboard()}
                </AdminRoute>
              )}
            />
            <Route
              path="*"
              element={(
                <Navigate
                  to={
                    authUser
                      ? authUser.role === 'admin'
                        ? '/admin'
                        : '/community'
                      : '/'
                  }
                  replace
                />
              )}
            />
          </Routes>
        </div>
      </div>

      <AuthModal
        authModal={authModal}
        setAuthModal={setAuthModal}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  )
}

export default App
