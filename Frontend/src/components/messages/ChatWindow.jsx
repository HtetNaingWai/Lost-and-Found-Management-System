import Icon from '../Icon'
import ChatHeader from './ChatHeader'
import MessageBubble from './MessageBubble'
import MessageComposer from './MessageComposer'
import MessagesSkeleton from './MessagesSkeleton'

function ChatWindow({
  user,
  activeConversation,
  messages,
  draftMessage,
  onDraftChange,
  onSubmit,
  onBack,
  sendingMessage,
  loadingConversation,
  messageError,
  onlineUserIds,
  typingParticipantId,
  relatedItem,
  threadEndRef,
}) {
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
  const isOnline = onlineUserIds.includes(participant.id)

  return (
    <section className="messages-chat-panel">
      <ChatHeader
        participant={participant}
        isOnline={isOnline}
        relatedItem={relatedItem}
        onBack={onBack}
      />

      {messageError ? <p className="settings-feedback is-error messages-error">{messageError}</p> : null}

      <div className="messages-thread-list">
        {loadingConversation ? (
          <MessagesSkeleton />
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender?.id === user.id}
            />
          ))
        ) : (
          <div className="messages-empty-card">
            <strong>No messages yet</strong>
            <span>Send the first message and keep the item details clear.</span>
          </div>
        )}
        {typingParticipantId === participant.id ? (
          <div className="messages-typing-indicator">Typing...</div>
        ) : null}
        <span ref={threadEndRef} aria-hidden="true" />
      </div>

      <MessageComposer
        participantName={participant.name}
        draftMessage={draftMessage}
        onDraftChange={onDraftChange}
        onSubmit={onSubmit}
        sendingMessage={sendingMessage}
      />
    </section>
  )
}

export default ChatWindow
