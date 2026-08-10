import { useEffect, useMemo, useRef, useState } from 'react'
import DashboardPageShell from '../components/DashboardPageShell'
import ChatWindow from '../components/messages/ChatWindow'
import ConversationList from '../components/messages/ConversationList'
import ItemDetailsSidebar from '../components/messages/ItemDetailsSidebar'

function MessagesPage({
  user,
  conversations,
  activeConversation,
  messages,
  itemSources,
  onOpenConversation,
  onSendMessage,
  onTypingStateChange,
  sendingMessage,
  loadingConversation,
  messageError,
  onlineUserIds,
  typingParticipantId,
}) {
  const [draftMessage, setDraftMessage] = useState('')
  const [conversationSearch, setConversationSearch] = useState('')
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(activeConversation))
  const typingTimeoutRef = useRef(null)
  const threadEndRef = useRef(null)

  useEffect(() => {
    setDraftMessage('')
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (activeConversation?.participant?.id) {
      onTypingStateChange?.(activeConversation.participant.id, false)
    }
  }, [activeConversation?.participant?.id])

  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!activeConversation?.participant?.id || !draftMessage.trim()) return

    await onSendMessage(activeConversation.participant.id, draftMessage.trim())
    onTypingStateChange?.(activeConversation.participant.id, false)
    setDraftMessage('')
  }

  const handleDraftChange = (event) => {
    const nextValue = event.target.value
    setDraftMessage(nextValue)

    if (!activeConversation?.participant?.id) {
      return
    }

    if (!nextValue.trim()) {
      onTypingStateChange?.(activeConversation.participant.id, false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      return
    }

    onTypingStateChange?.(activeConversation.participant.id, true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingStateChange?.(activeConversation.participant.id, false)
      typingTimeoutRef.current = null
    }, 1500)
  }

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase()

    if (!query) return conversations

    return conversations.filter((conversation) => {
      const participant = conversation.participant
      const latestMessage = conversation.latest_message?.message ?? ''

      return (
        participant?.name?.toLowerCase().includes(query)
        || participant?.email?.toLowerCase().includes(query)
        || latestMessage.toLowerCase().includes(query)
      )
    })
  }, [conversationSearch, conversations])

  const relatedItem = useMemo(() => {
    if (!activeConversation?.participant?.id) return null

    const messageItemId = [...messages]
      .reverse()
      .find((message) => message.item_id)?.item_id

    if (messageItemId) {
      const directMatch = itemSources.find((item) => Number(item.id) === Number(messageItemId))
      if (directMatch) return directMatch
    }

    const participantId = activeConversation.participant.id
    return itemSources.find((item) => item.user?.id === participantId) ?? null
  }, [activeConversation, itemSources, messages])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' })
  }, [activeConversation?.participant?.id, loadingConversation, messages.length, typingParticipantId])

  return (
    <DashboardPageShell>
      <div className={`messages-layout${mobileThreadOpen ? ' is-thread-open' : ''}`}>
        <ConversationList
          conversations={filteredConversations}
          totalConversations={conversations.length}
          searchValue={conversationSearch}
          onSearchChange={setConversationSearch}
          activeParticipantId={activeConversation?.participant?.id}
          onlineUserIds={onlineUserIds}
          onOpenConversation={(participant) => {
            setMobileThreadOpen(true)
            onOpenConversation(participant)
          }}
        />

        <ChatWindow
          user={user}
          activeConversation={activeConversation}
          messages={messages}
          draftMessage={draftMessage}
          onDraftChange={handleDraftChange}
          onSubmit={handleSubmit}
          onBack={() => setMobileThreadOpen(false)}
          sendingMessage={sendingMessage}
          loadingConversation={loadingConversation}
          messageError={messageError}
          onlineUserIds={onlineUserIds}
          typingParticipantId={typingParticipantId}
          relatedItem={relatedItem}
          threadEndRef={threadEndRef}
        />

        <ItemDetailsSidebar relatedItem={relatedItem} />
      </div>
    </DashboardPageShell>
  )
}

export default MessagesPage
