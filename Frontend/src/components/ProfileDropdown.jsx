import Icon from './Icon'

const navigationMap = {
  profile: 'profile',
  'my-items': 'lost-items',
  'my-claims': 'messages',
  users: 'users',
  'admin-lost-items': 'admin-lost-items',
  'admin-found-items': 'admin-found-items',
  'contact-messages': 'contact-messages',
}

function ProfileDropdown({ open, onNavigate, onLogout, items }) {
  if (!open) return null

  return (
    <div className="profile-dropdown">
      {items.map((item) => (
        <button
          type="button"
          key={item.key}
          className="profile-dropdown-item"
          onClick={() => {
            if (item.key === 'logout') {
              onLogout()
              return
            }

            if (navigationMap[item.key]) {
              onNavigate(navigationMap[item.key])
            }
          }}
        >
          <span className="profile-dropdown-icon">
            <Icon name={item.icon} />
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export default ProfileDropdown
