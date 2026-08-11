import { useMemo, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'
import { dashboardMenuItems, profileDropdownItems } from '../utils/constants'

function UserLayout({ user, onLogout, children }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const profileRef = useRef(null)
  const notificationRef = useRef(null)

  const closeMenus = () => {
    setProfileOpen(false)
    setNotificationOpen(false)
    setMobileMenuOpen(false)
  }

  const userId = user?.id

  const dropdownItems = useMemo(
    () => profileDropdownItems.map((item) => (
      item.key === 'my-profile' && userId
        ? { ...item, path: `/users/${userId}` }
        : item
    )),
    [userId],
  )

  return (
    <div className="dashboard-page">
      <DashboardNavbar
        user={user}
        menuItems={dashboardMenuItems}
        homePath="/community"
        profileOpen={profileOpen}
        onToggleProfile={() => {
          setProfileOpen((current) => !current)
          setNotificationOpen(false)
        }}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
        onNavClose={closeMenus}
        profileRef={profileRef}
        notificationRef={notificationRef}
        dropdownItems={dropdownItems}
        roleLabel={user?.role === 'admin' ? 'Administrator' : 'Community Member'}
        notifications={[]}
        notificationOpen={notificationOpen}
        onToggleNotifications={() => {
          setNotificationOpen((current) => !current)
          setProfileOpen(false)
        }}
        unreadNotifications={0}
        onNotificationClick={closeMenus}
        onMarkAllNotificationsRead={() => {}}
        onViewAllNotifications={closeMenus}
      />
      <div className="dashboard-main">
        {children ?? <Outlet />}
      </div>
      <Footer />
    </div>
  )
}

export default UserLayout
