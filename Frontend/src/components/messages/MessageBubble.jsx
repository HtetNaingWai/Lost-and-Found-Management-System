import { formatDate } from '../../utils/formatDate'
import { useState } from 'react'

function MessageBubble({ message, isOwn, onDelete }) {
  const [showActions, setShowActions] = useState(false)
  const attachmentUrl = message.attachment_url ?? message.image_url ?? message.image
  const isDeleted = message.is_deleted || message.deleted_at

  const handleCopy = () => {
    if (!message.message || isDeleted) return
    navigator.clipboard?.writeText(message.message)
    setShowActions(false)
  }

  const handleDelete = () => {
    setShowActions(false)
    onDelete?.(message)
  }

  return (
    <article className={`message-bubble${isOwn ? ' is-own' : ''}${isDeleted ? ' is-deleted' : ''}`}>
      <div className="message-bubble-body">
        {isDeleted ? (
          <p>This message was deleted.</p>
        ) : null}
        {!isDeleted && attachmentUrl ? (
          <img className="message-bubble-attachment" src={attachmentUrl} alt="Message attachment" />
        ) : null}
        {!isDeleted && message.message ? <p>{message.message}</p> : null}
        <span className="message-bubble-time">{formatDate(message.created_at, { hour: 'numeric', minute: '2-digit' })}</span>
      </div>

      {!isDeleted ? <div className="message-action-wrap">
        <button
          type="button"
          className="message-action-toggle"
          aria-label="Message actions"
          aria-expanded={showActions}
          onClick={() => setShowActions((isOpen) => !isOpen)}
        >
          ...
        </button>

        {showActions ? (
          <div className="message-action-menu">
            <button type="button" onClick={handleCopy}>Copy Text</button>
            {isOwn ? <button type="button" onClick={handleDelete}>Delete Message</button> : null}
          </div>
        ) : null}
      </div> : null}
    </article>
  )
}

export default MessageBubble
