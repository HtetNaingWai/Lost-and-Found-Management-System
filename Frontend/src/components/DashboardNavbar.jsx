import BrandMark from './BrandMark'
import Icon from './Icon'
import ProfileDropdown from './ProfileDropdown'

function DashboardNavbar({
  user,
  activePage,
  onNavigate,
  menuItems,
  profileOpen,
  onToggleProfile,
  onLogout,
  mobileMenuOpen,
  onToggleMobileMenu,
  profileRef,
  dropdownItems,
  roleLabel,
}) {
  return (
    <header className="topbar topbar-authenticated">
      <div className="container dashboard-navbar-shell">
        <div className="dashboard-brand-row">
          <a className="brand" href="#dashboard" onClick={() => onNavigate('dashboard')}>
            <BrandMark />
            <span>FindIt</span>
          </a>

          <button
            type="button"
            className="hamburger-button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle menu"
          >
            <Icon name="menu" />
          </button>
        </div>

        <nav
          className={`dashboard-nav${mobileMenuOpen ? ' is-open' : ''}`}
          aria-label="Dashboard"
        >
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.key}
              className={`dashboard-nav-link${activePage === item.key ? ' is-active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span className="dashboard-nav-icon">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="profile-menu-wrap" ref={profileRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={onToggleProfile}
          >
            <span className="profile-avatar">
              {user.profile_image_url ? (
                <img src={user.profile_image_url} alt={user.name} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </span>
            <span className="profile-trigger-copy">
              <strong>{user.name}</strong>
              <small>{roleLabel}</small>
            </span>
            <span className={`profile-arrow${profileOpen ? ' is-open' : ''}`}>
              <Icon name="chevronDown" />
            </span>
          </button>

          <ProfileDropdown
            open={profileOpen}
            onNavigate={onNavigate}
            onLogout={onLogout}
            items={dropdownItems}
          />
        </div>
      </div>
    </header>
  )
}

export default DashboardNavbar
