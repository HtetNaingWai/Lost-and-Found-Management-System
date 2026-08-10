import Icon from '../Icon'

function MessageComposer({
  participantName,
  draftMessage,
  onDraftChange,
  onSubmit,
  sendingMessage,
}) {
  return (
    <form className="messages-composer" onSubmit={onSubmit}>
      <button type="button" className="messages-attachment-button" aria-label="Add attachment">
        <Icon name="paperclip" />
      </button>
      <textarea
        rows="1"
        placeholder={`Type your message to ${participantName}...`}
        value={draftMessage}
        onChange={onDraftChange}
      />
      <button type="submit" className="messages-send-button" disabled={sendingMessage || !draftMessage.trim()}>
        <Icon name="send" />
        <span>{sendingMessage ? 'Sending' : 'Send'}</span>
      </button>
    </form>
  )
}

export default MessageComposer
