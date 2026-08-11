import { formatDate } from '../../utils/formatDate'
import UserAvatar from './UserAvatar'

function ConversationItem({ conversation, isActive, presence, isTyping, onClick, onDelete }) {
  const participant = conversation.participant
  const latestMessage = conversation.latest_message
  const relatedItem = conversation.related_item
  const isOnline = Boolean(presence?.online)
  const latestPreview = isTyping
    ? 'typing...'
    : (
        latestMessage?.is_deleted
          ? 'This message was deleted.'
          : latestMessage?.message || (latestMessage?.attachment_url ? 'Image attachment' : 'Start a new conversation')
      )

  if (!participant) return null

  return (
    <div className={`messages-conversation-item${isActive ? ' is-active' : ''}`}>
      <button type="button" className="messages-conversation-main" onClick={onClick}>
      <UserAvatar user={participant} isOnline={isOnline} />
      <span className="messages-conversation-copy">
        <span className="messages-conversation-topline">
          <strong>{participant.name}</strong>
          <small>{latestMessage?.created_at ? formatDate(latestMessage.created_at, { hour: 'numeric', minute: '2-digit' }) : 'New'}</small>
        </span>
        <span className={`messages-preview${isTyping ? ' is-typing' : ''}`}>{latestPreview}</span>
        {relatedItem ? <span className="messages-context-preview">{relatedItem.title || 'Related item'}</span> : null}
        <span className={`messages-presence-text${isOnline ? ' is-online' : ''}`}>
          {presence?.label ?? 'Offline'}
        </span>
      </span>
      {conversation.unread_count > 0 ? (
        <span className="messages-unread-chip">{conversation.unread_count}</span>
      ) : null}
      </button>
      {onDelete ? (
        <button
          type="button"
          className="messages-conversation-delete"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
        >
          Delete
        </button>
      ) : null}
    </div>
  )
}

export default ConversationItem
