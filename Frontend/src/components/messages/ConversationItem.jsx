import { formatDate } from '../../utils/formatDate'
import UserAvatar from './UserAvatar'

function ConversationItem({ conversation, isActive, isOnline, onClick }) {
  const participant = conversation.participant
  const latestMessage = conversation.latest_message

  if (!participant) return null

  return (
    <button
      type="button"
      className={`messages-conversation-item${isActive ? ' is-active' : ''}`}
      onClick={onClick}
    >
      <UserAvatar user={participant} isOnline={isOnline} />
      <span className="messages-conversation-copy">
        <span className="messages-conversation-topline">
          <strong>{participant.name}</strong>
          <small>{latestMessage?.created_at ? formatDate(latestMessage.created_at, { hour: 'numeric', minute: '2-digit' }) : 'New'}</small>
        </span>
        <span className="messages-preview">{latestMessage?.message || 'Start a new conversation'}</span>
        <span className={`messages-presence-text${isOnline ? ' is-online' : ''}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </span>
      {conversation.unread_count > 0 ? (
        <span className="messages-unread-chip">{conversation.unread_count}</span>
      ) : null}
    </button>
  )
}

export default ConversationItem
