import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DashboardPageShell from '../components/DashboardPageShell'
import ChatWindow from '../components/messages/ChatWindow'
import ConversationList from '../components/messages/ConversationList'
import ItemDetailsSidebar from '../components/messages/ItemDetailsSidebar'
import PostDetailModal from '../components/PostDetailModal'

function MessagesPage({
  user,
  conversations,
  activeConversation,
  messages,
  selectedMessageItem,
  itemSources,
  onOpenConversation,
  onSendMessage,
  onDeleteMessage,
  onDeleteConversation,
  onMarkClaimReturned,
  savingClaimId,
  onTypingStateChange,
  sendingMessage,
  loadingConversation,
  messageError,
  onlineUserIds,
  typingParticipantId,
}) {
  const [draftMessage, setDraftMessage] = useState('')
  const [selectedAttachment, setSelectedAttachment] = useState(null)
  const [detailPost, setDetailPost] = useState(null)
  const [conversationSearch, setConversationSearch] = useState('')
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(activeConversation))
  const typingTimeoutRef = useRef(null)
  const threadEndRef = useRef(null)
  const typingStateChangeRef = useRef(onTypingStateChange)

  useEffect(() => {
    typingStateChangeRef.current = onTypingStateChange
  }, [onTypingStateChange])

  const clearAttachment = useCallback(() => {
    setSelectedAttachment((currentAttachment) => {
      if (currentAttachment?.previewUrl) {
        URL.revokeObjectURL(currentAttachment.previewUrl)
      }

      return null
    })
  }, [])

  useEffect(() => {
    setDraftMessage('')
    clearAttachment()
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (activeConversation?.participant?.id) {
      typingStateChangeRef.current?.(activeConversation.participant.id, false)
    }
  }, [activeConversation?.participant?.id, clearAttachment])

  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  useEffect(() => () => {
    if (selectedAttachment?.previewUrl) {
      URL.revokeObjectURL(selectedAttachment.previewUrl)
    }
  }, [selectedAttachment])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!activeConversation?.participant?.id || (!draftMessage.trim() && !selectedAttachment)) return

    await onSendMessage(
      activeConversation.participant.id,
      draftMessage.trim(),
      selectedAttachment?.file ?? null,
      relatedItem,
      activeConversation,
    )
    onTypingStateChange?.(activeConversation.participant.id, false)
    setDraftMessage('')
    clearAttachment()
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

  const handleAttachmentSelect = (file) => {
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      return
    }

    setSelectedAttachment((currentAttachment) => {
      if (currentAttachment?.previewUrl) {
        URL.revokeObjectURL(currentAttachment.previewUrl)
      }

      return {
        file,
        previewUrl: URL.createObjectURL(file),
      }
    })
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

  let relatedItem = null

  if (activeConversation?.related_item) {
    relatedItem = activeConversation.related_item
  } else if (selectedMessageItem) {
    const selectedOwnerId = selectedMessageItem.user?.id
    const participantId = activeConversation?.participant?.id

    if (selectedOwnerId === user.id || selectedOwnerId === participantId) {
      relatedItem = selectedMessageItem
    }
  }

  if (!relatedItem && activeConversation?.participant?.id) {
    const latestContextMessage = [...messages]
      .reverse()
      .find((message) => message.related_item || message.community_post_id || message.item_id)

    relatedItem = latestContextMessage?.related_item ?? null

    if (!relatedItem && latestContextMessage?.item_id) {
      relatedItem = itemSources.find((item) => Number(item.id) === Number(latestContextMessage.item_id)) ?? null
    }
  }

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
          activeConversationId={activeConversation?.id}
          onlineUserIds={onlineUserIds}
          onOpenConversation={(participant, relatedPost, conversation) => {
            setMobileThreadOpen(true)
            onOpenConversation(participant, relatedPost, conversation)
          }}
          onDeleteConversation={onDeleteConversation}
        />

        <ChatWindow
          user={user}
          activeConversation={activeConversation}
          messages={messages}
          draftMessage={draftMessage}
          onDraftChange={handleDraftChange}
          onSubmit={handleSubmit}
          onDeleteMessage={onDeleteMessage}
          selectedAttachment={selectedAttachment}
          onAttachmentSelect={handleAttachmentSelect}
          onAttachmentRemove={clearAttachment}
          onBack={() => setMobileThreadOpen(false)}
          sendingMessage={sendingMessage}
          loadingConversation={loadingConversation}
          messageError={messageError}
          onlineUserIds={onlineUserIds}
          typingParticipantId={typingParticipantId}
          relatedItem={relatedItem}
          threadEndRef={threadEndRef}
        />

        <ItemDetailsSidebar
          relatedItem={relatedItem}
          user={user}
          activeConversation={activeConversation}
          onViewItem={setDetailPost}
          onMarkClaimReturned={onMarkClaimReturned}
          savingClaimId={savingClaimId}
        />
      </div>
      {detailPost ? (
        <PostDetailModal
          post={detailPost}
          user={user}
          onClose={() => setDetailPost(null)}
          onStartMessage={onOpenConversation}
          onMarkClaimReturned={onMarkClaimReturned}
          savingClaimId={savingClaimId}
        />
      ) : null}
    </DashboardPageShell>
  )
}

export default MessagesPage
