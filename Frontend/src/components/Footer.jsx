import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="brand brand-footer">
          <BrandMark />
          <span className="brand-copy">
            <strong>FindIt</strong>
            <small>Lost &amp; Found Community</small>
          </span>
        </div>

        <p className="footer-tagline">Helping people reconnect with what matters.</p>

        <nav className="footer-links" aria-label="Footer">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/security">Security</Link>
          <Link to="/how-it-works">How It Works</Link>
        </nav>

        <p className="footer-copy">© 2026 FindIt. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
