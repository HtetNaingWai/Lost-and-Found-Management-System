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

function SupportAvatar({ user }) {
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'A'

  return (
    <span className="support-chat-avatar">
      {user?.profile_image_url ? <img src={user.profile_image_url} alt={user.name} /> : initial}
    </span>
  )
}

function ContactPage({ user, token }) {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [onlineUserIds, setOnlineUserIds] = useState([])
  const [typingUserId, setTypingUserId] = useState(null)
  const typingTimeoutRef = useRef(null)
  const threadEndRef = useRef(null)
  const channelRef = useRef(null)

  const admin = conversation?.admin
  const adminId = normalizeRealtimeUserId(admin?.id)
  const isAdminOnline = useMemo(
    () => adminId !== null && normalizePresenceIds(onlineUserIds).includes(adminId),
    [adminId, onlineUserIds],
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

    if (!echo || !user?.id) return undefined

    const presenceChannel = echo.join(getPresenceChannelName())

    presenceChannel.here((members = []) => {
      setOnlineUserIds(normalizePresenceIds(members.map((member) => member.id)))
    })

    presenceChannel.joining((member) => {
      const memberId = normalizeRealtimeUserId(member.id)
      if (!memberId) return
      setOnlineUserIds((current) => normalizePresenceIds([...current, memberId]))
    })

    presenceChannel.leaving((member) => {
      const memberId = normalizeRealtimeUserId(member.id)
      if (!memberId) return
      setOnlineUserIds((current) => normalizePresenceIds(current).filter((id) => id !== memberId))
    })

    return () => {
      echo.leave(getPresenceChannelName())
    }
  }, [token, user?.id])

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!draft.trim() || sending) return

    setSending(true)
    setError('')

    try {
      const payload = await apiRequest('/support/messages', {
        method: 'POST',
        token,
        body: { message: draft.trim() },
      })

      setConversation(payload.conversation ?? conversation)
      setMessages((current) => (
        current.some((message) => message.id === payload.data.id)
          ? current
          : [...current, payload.data]
      ))
      setDraft('')
      sendTyping(false)
    } catch (requestError) {
      setError(requestError.payload?.message ?? 'Failed to send support message.')
    } finally {
      setSending(false)
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
          <p>Chat with the admin team about account issues, reports, claims, returns, or safety concerns.</p>
          <div className="contact-support-details">
            <div>
              <strong>Status</strong>
              <span>{isAdminOnline ? 'Admin online now' : 'Admin currently offline'}</span>
            </div>
            <div>
              <strong>Response window</strong>
              <span>We usually reply during township office hours.</span>
            </div>
          </div>
        </section>

        <section className="support-chat-card">
          <header className="support-chat-header">
            <SupportAvatar user={admin} />
            <div>
              <h2>{admin?.name ?? 'FindIt Admin'}</h2>
              <p>{typingUserId ? 'Typing...' : isAdminOnline ? 'Online' : 'Offline'}</p>
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

                return (
                  <article key={message.id} className={`support-message-bubble ${isOwn ? 'is-own' : 'is-admin'}`}>
                    <p>{message.message}</p>
                    <span>
                      {formatDate(message.created_at, { hour: 'numeric', minute: '2-digit' })}
                      {isOwn ? ` · ${message.is_read ? 'Read' : 'Sent'}` : ''}
                    </span>
                  </article>
                )
              })
            ) : (
              <div className="support-empty-state">
                <strong>Start a support conversation</strong>
                <span>Send your first message and an admin can reply here in real time.</span>
              </div>
            )}
            <span ref={threadEndRef} />
          </div>

          <form className="support-chat-composer" onSubmit={handleSubmit}>
            <textarea
              rows="1"
              value={draft}
              onChange={handleDraftChange}
              placeholder="Type your support message..."
            />
            <button type="submit" disabled={sending || !draft.trim()}>
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
