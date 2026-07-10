import BrandMark from './BrandMark'
import Icon from './Icon'
import ProfileDropdown from './ProfileDropdown'
import { NavLink } from 'react-router-dom'

function DashboardNavbar({
  user,
  menuItems,
  homePath = '/community',
  profileOpen,
  onToggleProfile,
  onLogout,
  mobileMenuOpen,
  onToggleMobileMenu,
  onNavClose,
  profileRef,
  dropdownItems,
  roleLabel,
  notifications,
  notificationOpen,
  onToggleNotifications,
  notificationRef,
  unreadNotifications,
}) {
  return (
    <header className="topbar topbar-authenticated">
      <div className="container dashboard-navbar-shell">
        <div className="dashboard-brand-row">
          <NavLink className="brand" to={homePath} onClick={onNavClose}>
            <BrandMark />
            <span className="brand-copy">
              <strong>FindIt</strong>
              <small>Lost &amp; Found</small>
            </span>
          </NavLink>

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
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) => `dashboard-nav-link${isActive ? ' is-active' : ''}`}
              onClick={onNavClose}
            >
              <span className="dashboard-nav-icon">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dashboard-toolbar">
          <div className="notification-wrap" ref={notificationRef}>
            <button
              type="button"
              className="notification-trigger"
              onClick={onToggleNotifications}
              aria-label="Notifications"
            >
              <Icon name="bell" />
              {unreadNotifications > 0 ? <span className="notification-dot" /> : null}
            </button>

            {notificationOpen ? (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <strong>Notifications</strong>
                </div>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <article className="notification-item" key={notification.id}>
                        <div className="notification-item-copy">
                          <strong>{notification.title}</strong>
                          <p>{notification.detail}</p>
                        </div>
                        <span>{notification.time}</span>
                      </article>
                    ))
                  ) : (
                    <div className="notification-empty">No new notifications</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

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
              onNavigate={onNavClose}
              onLogout={onLogout}
              items={dropdownItems}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

export default DashboardNavbar
