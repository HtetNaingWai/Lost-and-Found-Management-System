import BrandMark from './BrandMark'

function GuestNav() {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <a className="brand" href="#home">
          <BrandMark />
          <span>FindIt</span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          <a className="is-active" href="#home">
            Home
          </a>
          <a href="#about">About Us</a>
          <a href="#contact">Contact Us</a>
        </nav>
      </div>
    </header>
  )
}

export default GuestNav
