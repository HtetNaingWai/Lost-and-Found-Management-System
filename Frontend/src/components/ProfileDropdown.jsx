import Icon from './Icon'
import { useNavigate } from 'react-router-dom'

function ProfileDropdown({ open, onNavigate, onLogout, items }) {
  const navigate = useNavigate()

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

            if (item.path) {
              navigate(item.path)
              onNavigate?.()
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
