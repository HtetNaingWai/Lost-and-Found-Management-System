import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DashboardPageShell from '../components/DashboardPageShell'
import ChatWindow from '../components/messages/ChatWindow'
import ConversationList from '../components/messages/ConversationList'
import ItemDetailsSidebar from '../components/messages/ItemDetailsSidebar'
import PostDetailModal from '../components/PostDetailModal'
import Icon from '../components/Icon'

function MessageReturnConfirmModal({ target, onClose, onConfirm, saving }) {
  if (!target) return null

  const title = target.community_post?.title || 'this item'

  return (
    <div className="community-modal-root" onClick={onClose}>
      <div className="community-modal-overlay" />
      <div className="community-modal-shell">
        <section className="community-modal-card claim-confirm-modal" onClick={(event) => event.stopPropagation()}>
          <div className="community-modal-top">
            <div>
              <h2>Mark item as returned?</h2>
              <p>This confirms that {title} has been successfully returned. The listing will be removed from active Lost/Found results and both participants can leave feedback.</p>
            </div>
            <button type="button" className="modal-close-button" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
          <div className="community-modal-actions">
            <button type="button" className="secondary-action-button" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="quick-action-button"
              disabled={saving}
              onClick={async () => {
                await onConfirm(target)
                onClose()
              }}
            >
              {saving ? 'Saving...' : 'Mark as Returned'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

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
  onUserProfileClick,
  savingClaimId,
  onTypingStateChange,
  sendingMessage,
  loadingConversation,
  messageError,
  onlineUserIds,
  typingParticipantId,
  typingConversationId,
}) {
  const [draftMessage, setDraftMessage] = useState('')
  const [selectedAttachment, setSelectedAttachment] = useState(null)
  const [detailPost, setDetailPost] = useState(null)
  const [returnTarget, setReturnTarget] = useState(null)
  const [conversationSearch, setConversationSearch] = useState('')
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(activeConversation))
  const typingTimeoutRef = useRef(null)
  const threadEndRef = useRef(null)
  const threadListRef = useRef(null)
  const typingStateChangeRef = useRef(onTypingStateChange)
  const [isThreadNearBottom, setIsThreadNearBottom] = useState(true)
  const [showNewMessageButton, setShowNewMessageButton] = useState(false)

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

  const updateThreadScrollState = useCallback(() => {
    const thread = threadListRef.current

    if (!thread) {
      setIsThreadNearBottom(true)
      setShowNewMessageButton(false)
      return true
    }

    const distanceFromBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight
    const nearBottom = distanceFromBottom < 120
    setIsThreadNearBottom(nearBottom)

    if (nearBottom) {
      setShowNewMessageButton(false)
    }

    return nearBottom
  }, [])

  const scrollToLatest = useCallback((behavior = 'smooth') => {
    threadEndRef.current?.scrollIntoView({ block: 'end', behavior })
    setShowNewMessageButton(false)
    setIsThreadNearBottom(true)
  }, [])

  useEffect(() => {
    setShowNewMessageButton(false)
    setIsThreadNearBottom(true)
    window.requestAnimationFrame(() => scrollToLatest('auto'))
  }, [activeConversation?.id, loadingConversation, scrollToLatest])

  useEffect(() => {
    if (loadingConversation) return

    if (isThreadNearBottom) {
      window.requestAnimationFrame(() => scrollToLatest('smooth'))
      return
    }

    if (messages.length > 0) {
      setShowNewMessageButton(true)
    }
  }, [isThreadNearBottom, loadingConversation, messages.length, scrollToLatest, typingParticipantId])

  const activeTypingParticipantId = typingConversationId === activeConversation?.id
    ? typingParticipantId
    : null

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
          typingParticipantId={typingParticipantId}
          typingConversationId={typingConversationId}
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
          onUserProfileClick={onUserProfileClick}
          sendingMessage={sendingMessage}
          loadingConversation={loadingConversation}
          messageError={messageError}
          onlineUserIds={onlineUserIds}
          typingParticipantId={activeTypingParticipantId}
          relatedItem={relatedItem}
          threadEndRef={threadEndRef}
          threadListRef={threadListRef}
          onThreadScroll={updateThreadScrollState}
          showNewMessageButton={showNewMessageButton}
          onJumpToLatest={() => scrollToLatest('smooth')}
        />

        <ItemDetailsSidebar
          relatedItem={relatedItem}
          user={user}
          activeConversation={activeConversation}
          onViewItem={setDetailPost}
          onMarkClaimReturned={setReturnTarget}
          savingClaimId={savingClaimId}
        />
      </div>
      <MessageReturnConfirmModal
        target={returnTarget}
        onClose={() => setReturnTarget(null)}
        onConfirm={onMarkClaimReturned}
        saving={returnTarget ? savingClaimId === returnTarget.id : false}
      />
      {detailPost ? (
        <PostDetailModal
          post={detailPost}
          user={user}
          onClose={() => setDetailPost(null)}
          onStartMessage={onOpenConversation}
          onUserProfileClick={onUserProfileClick}
          onMarkClaimReturned={onMarkClaimReturned}
          savingClaimId={savingClaimId}
        />
      ) : null}
    </DashboardPageShell>
  )
}

export default MessagesPage
