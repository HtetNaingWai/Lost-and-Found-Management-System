import { useEffect, useRef } from 'react'
import Icon from '../Icon'

function MessageComposer({
  participantName,
  draftMessage,
  onDraftChange,
  onSubmit,
  selectedAttachment,
  onAttachmentSelect,
  onAttachmentRemove,
  sendingMessage,
}) {
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const canSend = Boolean(draftMessage.trim() || selectedAttachment)

  useEffect(() => {
    if (!textareaRef.current) return

    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`
  }, [draftMessage])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    onAttachmentSelect?.(file)
    event.target.value = ''
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return

    event.preventDefault()

    if (!canSend || sendingMessage) return

    event.currentTarget.form?.requestSubmit()
  }

  return (
    <form className="messages-composer-shell" onSubmit={onSubmit}>
      {selectedAttachment ? (
        <div className="messages-attachment-preview">
          <img src={selectedAttachment.previewUrl} alt={selectedAttachment.file.name} />
          <div>
            <strong>{selectedAttachment.file.name}</strong>
            <span>{Math.max(1, Math.round(selectedAttachment.file.size / 1024))} KB</span>
          </div>
          <button type="button" onClick={onAttachmentRemove} aria-label="Remove selected attachment">
            <Icon name="close" />
          </button>
        </div>
      ) : null}

      <div className="messages-composer">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="messages-file-input"
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="messages-attachment-button"
          aria-label="Add image attachment"
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="paperclip" />
        </button>
        <textarea
          ref={textareaRef}
          rows="1"
          placeholder={`Type your message to ${participantName}...`}
          value={draftMessage}
          onChange={onDraftChange}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="messages-send-button" disabled={sendingMessage || !canSend}>
          <Icon name="send" />
          <span>{sendingMessage ? 'Sending' : 'Send'}</span>
        </button>
      </div>
    </form>
  )
}

export default MessageComposer
