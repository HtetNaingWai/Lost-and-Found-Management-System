import { formatDate } from '../../utils/formatDate'

function MessageBubble({ message, isOwn }) {
  return (
    <article className={`message-bubble${isOwn ? ' is-own' : ''}`}>
      <p>{message.message}</p>
      <span>{formatDate(message.created_at, { hour: 'numeric', minute: '2-digit' })}</span>
    </article>
  )
}

export default MessageBubble
