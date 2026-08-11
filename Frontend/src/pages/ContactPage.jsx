import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DashboardPageShell from '../components/DashboardPageShell'
import Icon from '../components/Icon'
import { apiRequest } from '../services/api'
import {
  getConversationChannelName,
  getPresenceChannelName,
  getRealtimeClient,
  normalizePresenceIds,
  normalizeRealtimeUserId,
} from '../services/realtime'
import { formatDate } from '../utils/formatDate'
import { getPresenceStatus } from '../utils/presence'

function SupportAvatar({ user }) {
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'A'

  return (
    <span className="support-chat-avatar">
      {user?.profile_image_url ? <img src={user.profile_image_url} alt={user.name} /> : initial}
    </span>
  )
}

function ContactPage({ user, token, onlineUserIds: sharedOnlineUserIds = null }) {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [localOnlineUserIds, setLocalOnlineUserIds] = useState([])
  const [typingUserId, setTypingUserId] = useState(null)
  const typingTimeoutRef = useRef(null)
  const threadEndRef = useRef(null)
  const channelRef = useRef(null)
  const fileInputRef = useRef(null)

  const onlineUserIds = sharedOnlineUserIds ?? localOnlineUserIds
  const admin = conversation?.admin
  const adminPresence = useMemo(
    () => getPresenceStatus(admin, onlineUserIds),
    [admin, onlineUserIds],
  )

  const loadSupportConversation = useCallback(async () => {
    setError('')

    try {
      const payload = await apiRequest('/support/conversation', { token })
      setConversation(payload.conversation ?? null)
      setMessages(payload.messages ?? [])
    } catch (requestError) {
      setError(requestError.payload?.message ?? 'Failed to load support conversation.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadSupportConversation()
  }, [loadSupportConversation])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, loading])

  useEffect(() => {
    const echo = getRealtimeClient(token)

    if (sharedOnlineUserIds) return undefined
    if (!echo || !user?.id) return undefined

    const presenceChannel = echo.join(getPresenceChannelName())

    presenceChannel.here((members = []) => {
      setLocalOnlineUserIds(normalizePresenceIds(members.map((member) => member.id)))
    })

    presenceChannel.joining((member) => {
      const memberId = normalizeRealtimeUserId(member.id)
      if (!memberId) return
      setLocalOnlineUserIds((current) => normalizePresenceIds([...current, memberId]))
    })

    presenceChannel.leaving((member) => {
      const memberId = normalizeRealtimeUserId(member.id)
      if (!memberId) return
      setLocalOnlineUserIds((current) => normalizePresenceIds(current).filter((id) => id !== memberId))
    })

    return () => {
      echo.leave(getPresenceChannelName())
    }
  }, [sharedOnlineUserIds, token, user?.id])

  useEffect(() => {
    const echo = getRealtimeClient(token)

    if (!echo || !user?.id || !admin?.id || !conversation?.id) {
      channelRef.current = null
      return undefined
    }

    const channelName = getConversationChannelName(user.id, admin.id)
    const channel = echo.private(channelName)
    channelRef.current = channel

    const handleTyping = (payload) => {
      const senderId = normalizeRealtimeUserId(payload.userId ?? payload.sender_id)

      if (!senderId || senderId === normalizeRealtimeUserId(user.id)) return

      if (payload.typing === false) {
        setTypingUserId(null)
        return
      }

      setTypingUserId(senderId)
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = window.setTimeout(() => setTypingUserId(null), 2500)
    }

    channel.listenForWhisper('typing', handleTyping)
    channel.listen('.message.typing', handleTyping)
    channel.listen('.message.typing.stopped', (payload) => {
      const senderId = normalizeRealtimeUserId(payload.sender_id)
      if (senderId && senderId !== normalizeRealtimeUserId(user.id)) {
        setTypingUserId(null)
      }
    })

    channel.listen('.message.sent', (payload) => {
      const nextMessage = payload.message

      if (!nextMessage?.id || Number(nextMessage.support_conversation_id) !== Number(conversation.id)) return

      setMessages((current) => (
        current.some((message) => message.id === nextMessage.id)
          ? current
          : [...current, nextMessage]
      ))
      setTypingUserId(null)
    })

    channel.listen('.message.read', (payload) => {
      setMessages((current) =>
        current.map((message) => (
          payload.message_ids?.includes(message.id)
            ? { ...message, is_read: true, read_at: payload.read_at ?? new Date().toISOString() }
            : message
        )),
      )
    })

    channel.listen('.message.deleted', (payload) => {
      const deletedMessage = payload.message

      if (!deletedMessage?.id || Number(deletedMessage.support_conversation_id) !== Number(conversation.id)) return

      setMessages((current) => current.map((message) => (
        message.id === deletedMessage.id ? deletedMessage : message
      )))
    })

    return () => {
      channelRef.current = null
      echo.leave(channelName)
    }
  }, [admin?.id, conversation?.id, token, user?.id])

  const sendTyping = (isTyping) => {
    if (!channelRef.current?.whisper || !admin?.id) return

    channelRef.current.whisper('typing', {
      userId: user.id,
      receiverId: admin.id,
      conversationId: `support-${conversation?.id ?? 'new'}`,
      typing: isTyping,
      sentAt: new Date().toISOString(),
    })
  }

  const handleDraftChange = (event) => {
    setDraft(event.target.value)
    sendTyping(Boolean(event.target.value.trim()))
  }

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setError('')

    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please attach a JPG, PNG, or WEBP image.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Attachment must be 5MB or smaller.')
      event.target.value = ''
      return
    }

    setAttachment(file)
  }

  const handleRemoveAttachment = () => {
    setAttachment(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if ((!draft.trim() && !attachment) || sending) return

    setSending(true)
    setError('')

    try {
      const body = attachment ? new FormData() : { message: draft.trim() }

      if (attachment) {
        body.append('attachment', attachment)
        if (draft.trim()) {
          body.append('message', draft.trim())
        }
      }

      const payload = await apiRequest('/support/messages', {
        method: 'POST',
        token,
        body,
      })

      setConversation(payload.conversation ?? conversation)
      setMessages((current) => (
        current.some((message) => message.id === payload.data.id)
          ? current
          : [...current, payload.data]
      ))
      setDraft('')
      handleRemoveAttachment()
      sendTyping(false)
    } catch (requestError) {
      setError(requestError.payload?.message ?? 'Failed to send support message.')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    setError('')

    try {
      const payload = await apiRequest(`/support/messages/${messageId}`, {
        method: 'DELETE',
        token,
      })

      const deletedMessage = payload.data
      setMessages((current) => current.map((message) => (
        message.id === deletedMessage.id ? deletedMessage : message
      )))
    } catch (requestError) {
      setError(requestError.payload?.message ?? 'Failed to delete support message.')
    }
  }

  return (
    <DashboardPageShell>
      <div className="support-chat-layout">
        <section className="support-chat-info-card">
          <span className="contact-support-icon">
            <Icon name="mail" />
          </span>
          <h2>FindIt Support</h2>
          <p>Get help from the FindIt team about reports, claims, returns, or account safety.</p>
          <div className="contact-support-details">
            <div>
              <strong>Status</strong>
              <span>{adminPresence.online ? 'Support team online' : adminPresence.label}</span>
            </div>
            <div>
              <strong>Typical reply</strong>
              <span>We usually respond during township office hours.</span>
            </div>
            <div>
              <strong>Best for</strong>
              <span>Claims, returns, reports, and safety questions.</span>
            </div>
          </div>
        </section>

        <section className="support-chat-card">
          <header className="support-chat-header">
            <div className="support-chat-agent">
              <SupportAvatar user={admin} />
              <span className={`support-presence-dot ${adminPresence.online ? 'is-online' : ''}`} />
            </div>
            <div className="support-chat-heading">
              <h2>Support Team</h2>
              <p>{typingUserId ? 'Typing...' : adminPresence.label}</p>
            </div>
            <span className={`support-status-pill support-status-${conversation?.status ?? 'open'}`}>
              {conversation?.status === 'resolved' ? 'Resolved' : 'Support Chat'}
            </span>
          </header>

          {error ? <p className="settings-feedback is-error support-chat-error">{error}</p> : null}

          <div className="support-chat-thread">
            {loading ? (
              <div className="support-empty-state">Loading support conversation...</div>
            ) : messages.length > 0 ? (
              messages.map((message) => {
                const isOwn = normalizeRealtimeUserId(message.sender?.id) === normalizeRealtimeUserId(user.id)
                const isDeleted = message.is_deleted || message.deleted_at
                const attachmentUrl = message.attachment_url ?? message.image_url ?? message.image

                return (
                  <article key={message.id} className={`support-message-bubble ${isOwn ? 'is-own' : 'is-admin'}${isDeleted ? ' is-deleted' : ''}`}>
                    {!isDeleted && isOwn ? (
                      <div className="support-message-menu">
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(message.id)}
                          aria-label="Delete message"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                    {isDeleted ? (
                      <p>This message was deleted.</p>
                    ) : (
                      <>
                        {attachmentUrl ? (
                          <img
                            className="support-message-attachment"
                            src={attachmentUrl}
                            alt={message.attachment_name || 'Support message attachment'}
                          />
                        ) : null}
                        {message.message ? <p>{message.message}</p> : null}
                      </>
                    )}
                    <span>
                      {formatDate(message.created_at, { hour: 'numeric', minute: '2-digit' })}
                      {isOwn ? ` · ${message.is_read ? 'Read' : 'Sent'}` : ''}
                    </span>
                  </article>
                )
              })
            ) : (
              <div className="support-welcome-card">
                <span className="support-welcome-icon">
                  <Icon name="chat" />
                </span>
                <strong>Welcome to FindIt Support</strong>
                <span>Tell us what happened. An admin reply will appear here, and you can continue the conversation anytime.</span>
              </div>
            )}
            <span ref={threadEndRef} />
          </div>

          <form className="support-chat-composer" onSubmit={handleSubmit}>
            {attachment ? (
              <div className="support-attachment-preview">
                <span>
                  <Icon name="paperclip" />
                </span>
                <strong>{attachment.name}</strong>
                <button type="button" onClick={handleRemoveAttachment} aria-label="Remove attachment">
                  <Icon name="close" />
                </button>
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              className="support-file-input"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAttachmentChange}
            />
            <button
              type="button"
              className="support-attach-button"
              aria-label="Attach image"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="paperclip" />
            </button>
            <textarea
              rows="1"
              value={draft}
              onChange={handleDraftChange}
              placeholder="Type your support message..."
            />
            <button
              type="submit"
              className="support-send-button"
              disabled={sending || (!draft.trim() && !attachment)}
              aria-label={sending ? 'Sending support message' : 'Send support message'}
            >
              <Icon name="send" />
              <span>{sending ? 'Sending' : 'Send'}</span>
            </button>
          </form>
        </section>
      </div>
    </DashboardPageShell>
  )
}

export default ContactPage
