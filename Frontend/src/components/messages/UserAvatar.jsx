function UserAvatar({ user, isOnline }) {
  return (
    <span className={`messages-avatar${isOnline ? ' is-online' : ''}`}>
      {user.profile_image_url ? (
        <img src={user.profile_image_url} alt={user.name} />
      ) : (
        user.name?.charAt(0).toUpperCase()
      )}
    </span>
  )
}

export default UserAvatar
