import Icon from '../Icon'
import UserAvatar from './UserAvatar'

function ChatHeader({ participant, isOnline, relatedItem, onBack }) {
  const itemType = relatedItem?.post_type ?? relatedItem?.type

  return (
    <div className="messages-thread-header">
      <button type="button" className="messages-mobile-back" onClick={onBack}>
        <Icon name="arrowLeft" />
      </button>
      <UserAvatar user={participant} isOnline={isOnline} />
      <div className="messages-thread-title">
        <strong>{participant.name}</strong>
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
      <div className="messages-header-item">
        <span>{itemType ? `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Item` : 'Item context'}</span>
        <strong>{relatedItem?.title || 'No item linked yet'}</strong>
      </div>
    </div>
  )
}

export default ChatHeader
