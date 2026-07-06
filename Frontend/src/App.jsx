import { useEffect, useState } from 'react'
import './App.css'
import AuthModal from './components/AuthModal'
import LandingPage from './pages/LandingPage'
import DashboardLayout from './pages/DashboardLayout'
import { apiRequest, AUTH_STORAGE_KEY, clearAuth, saveAuth } from './services/api'
import BrandMark from './components/BrandMark'

function App() {
  const [authModal, setAuthModal] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [authToken, setAuthToken] = useState('')
  const [authReady, setAuthReady] = useState(false)

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
    saveAuth({ token, user })
    setAuthToken(token)
    setAuthUser(user)
    setAuthModal(null)
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

  if (authUser) {
    return <DashboardLayout user={authUser} token={authToken} onLogout={handleLogout} />
  }

  return (
    <>
      <div className={`page-shell${authModal ? ' is-modal-open' : ''}`}>
        <div className="page-blur-layer">
          <LandingPage onOpenModal={setAuthModal} />
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
