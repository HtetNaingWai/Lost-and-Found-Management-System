import { useState } from 'react'
import BrandMark from './BrandMark'
import Icon from './Icon'

function GuestNav({ onOpenModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeMobileMenu = () => setMobileMenuOpen(false)
  const openAuthModal = (mode) => {
    closeMobileMenu()
    onOpenModal?.(mode)
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <a className="brand" href="/" onClick={closeMobileMenu}>
          <BrandMark />
          <span className="brand-copy">
            <strong>FindIt</strong>
            <small>Lost &amp; Found Community</small>
          </span>
        </a>

        <button
          type="button"
          className="hamburger-button landing-menu-toggle"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <Icon name={mobileMenuOpen ? 'close' : 'menu'} />
        </button>

        <nav className={`nav-links${mobileMenuOpen ? ' is-open' : ''}`} aria-label="Primary">
          <a className="is-active" href="/#home" onClick={closeMobileMenu}>
            Home
          </a>
          <a href="/#lost-items" onClick={closeMobileMenu}>Lost Items</a>
          <a href="/#found-items" onClick={closeMobileMenu}>Found Items</a>
          <a href="/#messages" onClick={closeMobileMenu}>Messages</a>
          <a href="/#contact" onClick={closeMobileMenu}>Contact Us</a>
          <span className="nav-mobile-auth">
            <button type="button" className="nav-auth-button nav-login-button" onClick={() => openAuthModal('login')}>
              Login
            </button>
            <button type="button" className="nav-auth-button nav-register-button" onClick={() => openAuthModal('register')}>
              Register
            </button>
          </span>
        </nav>

        <div className="topbar-actions">
          <button type="button" className="nav-auth-button nav-login-button" onClick={() => openAuthModal('login')}>
            Login
          </button>
          <button type="button" className="nav-auth-button nav-register-button" onClick={() => openAuthModal('register')}>
            Register
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`mobile-nav-backdrop${mobileMenuOpen ? ' is-open' : ''}`}
        aria-label="Close menu"
        onClick={closeMobileMenu}
      />
    </header>
  )
}

export default GuestNav
