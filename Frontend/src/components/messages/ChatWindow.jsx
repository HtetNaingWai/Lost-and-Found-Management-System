import { Fragment, useMemo } from 'react'
import Icon from '../Icon'
import ChatHeader from './ChatHeader'
import MessageBubble from './MessageBubble'
import MessageComposer from './MessageComposer'
import MessagesSkeleton from './MessagesSkeleton'
import { normalizePresenceIds, normalizeRealtimeUserId } from '../../services/realtime'
import { formatDate } from '../../utils/formatDate'

function ChatWindow({
  user,
  activeConversation,
  messages,
  draftMessage,
  onDraftChange,
  onSubmit,
  onDeleteMessage,
  selectedAttachment,
  onAttachmentSelect,
  onAttachmentRemove,
  onBack,
  onUserProfileClick,
  sendingMessage,
  loadingConversation,
  messageError,
  onlineUserIds,
  typingParticipantId,
  relatedItem,
  threadEndRef,
  threadListRef,
  onThreadScroll,
  showNewMessageButton,
  onJumpToLatest,
}) {
  const onlineIdSet = useMemo(() => new Set(normalizePresenceIds(onlineUserIds)), [onlineUserIds])

  if (!activeConversation) {
    return (
      <section className="messages-chat-panel">
        <div className="messages-empty-thread">
          <span className="messages-empty-icon">
            <Icon name="chat" />
          </span>
          <h2>Select a conversation</h2>
          <p>Choose a recent conversation to continue talking about a lost or found item.</p>
        </div>
      </section>
    )
  }

  const participant = activeConversation.participant
  const participantId = normalizeRealtimeUserId(participant.id)
  const isOnline = onlineIdSet.has(participantId)
  const isTyping = normalizeRealtimeUserId(typingParticipantId) === participantId

  return (
    <section className="messages-chat-panel">
      <ChatHeader
        participant={participant}
        isOnline={isOnline}
        isTyping={isTyping}
        relatedItem={relatedItem}
        onBack={onBack}
        onUserProfileClick={onUserProfileClick}
      />

      {messageError ? <p className="settings-feedback is-error messages-error">{messageError}</p> : null}

      <div className="messages-thread-list" ref={threadListRef} onScroll={onThreadScroll}>
        {loadingConversation ? (
          <MessagesSkeleton />
        ) : messages.length > 0 ? (
          messages.map((message, index) => {
            const messageDate = message.created_at ? new Date(message.created_at) : null
            const previousMessageDate = messages[index - 1]?.created_at
              ? new Date(messages[index - 1].created_at)
              : null
            const messageDateKey = messageDate?.toDateString()
            const previousDateKey = previousMessageDate?.toDateString()
            const showDateSeparator = messageDateKey && messageDateKey !== previousDateKey

            return (
              <Fragment key={message.id}>
                {showDateSeparator ? (
                  <div className="messages-date-separator">
                    <span>{formatDate(message.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                ) : null}
                <MessageBubble
                  message={message}
                  isOwn={normalizeRealtimeUserId(message.sender?.id) === normalizeRealtimeUserId(user.id)}
                  onDelete={onDeleteMessage}
                />
              </Fragment>
            )
          })
        ) : (
          <div className="messages-empty-card">
            <strong>No messages yet</strong>
            <span>Send the first message and keep the item details clear.</span>
          </div>
        )}
        {isTyping ? (
          <div className="messages-typing-indicator" aria-live="polite">
            <span>{participant.name} is typing</span>
            <span className="messages-typing-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
        ) : null}
        <span ref={threadEndRef} aria-hidden="true" />
      </div>

      {showNewMessageButton ? (
        <button type="button" className="messages-new-message-button" onClick={onJumpToLatest}>
          New message ↓
        </button>
      ) : null}

      <MessageComposer
        participantName={participant.name}
        draftMessage={draftMessage}
        onDraftChange={onDraftChange}
        onSubmit={onSubmit}
        selectedAttachment={selectedAttachment}
        onAttachmentSelect={onAttachmentSelect}
        onAttachmentRemove={onAttachmentRemove}
        sendingMessage={sendingMessage}
      />
    </section>
  )
}

export default ChatWindow
