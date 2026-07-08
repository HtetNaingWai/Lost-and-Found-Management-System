import Icon from './Icon'

function FloatingPostButton({ onClick }) {
  return (
    <button
      type="button"
      className="floating-post-button"
      onClick={onClick}
      aria-label="Create community post"
    >
      <Icon name="plus" />
    </button>
  )
}

export default FloatingPostButton
