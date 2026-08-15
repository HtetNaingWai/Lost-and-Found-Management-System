import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'
import RatingModal from '../components/ratings/RatingModal'
import CommunityPage from './CommunityPage'
import ContactPage from './ContactPage'
import ItemsPage from './ItemsPage'
import MessagesPage from './MessagesPage'
import ProfilePage from './ProfilePage'
import PublicProfilePage from './PublicProfilePage'
import ReportItemsPage from './ReportItemsPage'
import {
  dashboardMenuItems,
  profileDropdownItems,
} from '../utils/constants'
import { apiRequest } from '../services/api'
import {
  getConversationChannelName,
  getPresenceChannelName,
  getRealtimeClient,
  getUserChannelName,
  logRealtimeDebug,
  normalizePresenceIds,
  normalizeRealtimeUserId,
} from '../services/realtime'
import { useSavedPosts } from '../hooks/useSavedPosts'
import { formatDate } from '../utils/formatDate'

function DashboardContent({
  activePage,
  user,
  onNavigate,
  token,
  onUserUpdate,
  categories,
  communityPosts,
  approvedItems,
  myItems,
  myClaims,
  onItemSubmitted,
  notifications,
  onNotificationClick,
  messageConversations,
  activeConversation,
  activeConversationMessages,
  selectedMessageItem,
  onOpenConversation,
  onSendMessage,
  onDeleteMessage,
  onDeleteConversation,
  onTypingStateChange,
  onSubmitClaim,
  onUpdateClaim,
  onWithdrawClaim,
  onMarkClaimReturned,
  savingClaimId,
  submittingClaim,
  sendingMessage,
  loadingConversation,
  messageError,
  onStartMessage,
  onUserProfileClick,
  onlineUserIds,
  typingParticipantId,
  typingConversationId,
  savedPostsState,
  onDeletePost,
  onUpdatePost,
  deletingPostId,
}) {
  switch (activePage) {
    case 'community':
      return (
        <CommunityPage
          user={user}
          token={token}
          categories={categories}
          posts={communityPosts}
          myPosts={myItems}
          myClaims={myClaims}
          onCreatePost={onItemSubmitted}
          onNavigate={onNavigate}
          notifications={notifications}
          onNotificationClick={onNotificationClick}
          onStartMessage={onStartMessage}
          onSubmitClaim={onSubmitClaim}
          onUpdateClaim={onUpdateClaim}
          onWithdrawClaim={onWithdrawClaim}
          onMarkClaimReturned={onMarkClaimReturned}
          savingClaimId={savingClaimId}
          submittingClaim={submittingClaim}
          savedPostsState={savedPostsState}
          onDeletePost={onDeletePost}
          onUpdatePost={onUpdatePost}
          deletingPostId={deletingPostId}
          onUserProfileClick={onUserProfileClick}
        />
      )
    case 'lost-items':
      return (
        <ItemsPage
          type="lost"
          items={approvedItems}
          user={user}
          categories={categories}
          onStartMessage={onStartMessage}
          myClaims={myClaims}
          onSubmitClaim={onSubmitClaim}
          submittingClaim={submittingClaim}
          savedPostsState={savedPostsState}
          onUserProfileClick={onUserProfileClick}
        />
      )
    case 'found-items':
      return (
        <ItemsPage
          type="found"
          items={approvedItems}
          user={user}
          categories={categories}
          onStartMessage={onStartMessage}
          myClaims={myClaims}
          onSubmitClaim={onSubmitClaim}
          submittingClaim={submittingClaim}
          savedPostsState={savedPostsState}
          onUserProfileClick={onUserProfileClick}
        />
      )
    case 'report-items':
      return (
        <ReportItemsPage
          token={token}
          categories={categories}
          myItems={myItems}
          onItemSubmitted={onItemSubmitted}
        />
      )
    case 'messages':
      return (
        <MessagesPage
          user={user}
          conversations={messageConversations}
          activeConversation={activeConversation}
          messages={activeConversationMessages}
          selectedMessageItem={selectedMessageItem}
          itemSources={[...communityPosts, ...approvedItems, ...myItems]}
          onOpenConversation={onOpenConversation}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          onDeleteConversation={onDeleteConversation}
          onMarkClaimReturned={onMarkClaimReturned}
          onUserProfileClick={onUserProfileClick}
          savingClaimId={savingClaimId}
          onTypingStateChange={onTypingStateChange}
          sendingMessage={sendingMessage}
          loadingConversation={loadingConversation}
          messageError={messageError}
          onlineUserIds={onlineUserIds}
          typingParticipantId={typingParticipantId}
          typingConversationId={typingConversationId}
        />
      )
    case 'contact':
      return <ContactPage user={user} token={token} onlineUserIds={onlineUserIds} />
    case 'profile':
      return <ProfilePage user={user} token={token} onUserUpdate={onUserUpdate} />
    case 'public-profile':
      return (
        <PublicProfilePage
          user={user}
          token={token}
          posts={communityPosts}
          approvedItems={approvedItems}
          myItems={myItems}
          onStartMessage={onStartMessage}
          onlineUserIds={onlineUserIds}
        />
      )
    default:
      return (
        <CommunityPage
          user={user}
          token={token}
          categories={categories}
          posts={communityPosts}
          myPosts={myItems}
          myClaims={myClaims}
          onCreatePost={onItemSubmitted}
          onNavigate={onNavigate}
          notifications={notifications}
          onNotificationClick={onNotificationClick}
          savedPostsState={savedPostsState}
          onUpdatePost={onUpdatePost}
          onStartMessage={onStartMessage}
          onUserProfileClick={onUserProfileClick}
        />
      )
  }
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return 'Just now'

  const diffMs = Date.now() - new Date(dateValue).getTime()
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000))
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 45) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffHours < 24) return `${diffHours} hr ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return formatDate(dateValue, { month: 'short', day: 'numeric' })
}

function DashboardLayout({ user, token, onLogout, onUserUpdate }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [communityPosts, setCommunityPosts] = useState([])
  const [approvedItems, setApprovedItems] = useState([])
  const [myItems, setMyItems] = useState([])
  const [notificationItems, setNotificationItems] = useState([])
  const [messageConversations, setMessageConversations] = useState([])
  const [myClaims, setMyClaims] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [activeConversationMessages, setActiveConversationMessages] = useState([])
  const [selectedMessageItem, setSelectedMessageItem] = useState(null)
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [submittingClaim, setSubmittingClaim] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState(null)
  const [savingClaimId, setSavingClaimId] = useState(null)
  const [notificationRatingClaim, setNotificationRatingClaim] = useState(null)
  const [messageError, setMessageError] = useState('')
  const [onlineUserIds, setOnlineUserIds] = useState([])
  const [typingParticipantId, setTypingParticipantId] = useState(null)
  const [typingConversationId, setTypingConversationId] = useState(null)
  const profileRef = useRef(null)
  const notificationRef = useRef(null)
  const activeConversationRef = useRef(null)
  const activeConversationChannelRef = useRef(null)
  const openConversationRef = useRef(null)
  const typingStateRef = useRef({ receiverId: null, isTyping: false })
  const typingHideTimerRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const savedPostsState = useSavedPosts(token)

  const getConversationId = (participantId, relatedPost = null, itemId = null) => {
    const postId = relatedPost?.community_post_id ?? relatedPost?.id ?? null
    return `${participantId}:post-${postId ?? 'none'}:item-${itemId ?? 'none'}`
  }

  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

  const clearTypingIndicator = useCallback(() => {
    if (typingHideTimerRef.current) {
      window.clearTimeout(typingHideTimerRef.current)
      typingHideTimerRef.current = null
    }

    setTypingParticipantId(null)
    setTypingConversationId(null)
  }, [])

  const activePage = useMemo(() => {
    switch (location.pathname) {
      case '/lost-items':
        return 'lost-items'
      case '/found-items':
        return 'found-items'
      case '/messages':
        return 'messages'
      case '/contact':
        return 'contact'
      case '/profile':
        return 'profile'
      case '/community':
        return 'community'
      default:
        if (location.pathname.startsWith('/users/')) {
          return 'public-profile'
        }

        return 'community'
    }
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false)
      }

      if (!notificationRef.current?.contains(event.target)) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    let ignore = false

    const loadUserData = async () => {
      const results = await Promise.allSettled([
        apiRequest('/categories', { token }),
        apiRequest('/community-posts', { token }),
        apiRequest('/my-posts', { token }),
        apiRequest('/lost-items', { token }),
        apiRequest('/found-items', { token }),
        apiRequest('/messages', { token }),
        apiRequest('/claims', { token }),
        apiRequest('/notifications', { token }),
      ])

      if (ignore) return

      const [
        categoriesResult,
        communityResult,
        myPostsResult,
        lostResult,
        foundResult,
        messagesResult,
        claimsResult,
        notificationsResult,
      ] = results

      setCategories(
        categoriesResult.status === 'fulfilled'
          ? (categoriesResult.value.categories ?? [])
          : [],
      )
      setCommunityPosts(
        communityResult.status === 'fulfilled'
          ? (communityResult.value.posts ?? [])
          : [],
      )
      setMyItems(
        myPostsResult.status === 'fulfilled'
          ? (myPostsResult.value.posts ?? [])
          : [],
      )
      setApprovedItems(
        [
          ...(lostResult.status === 'fulfilled' ? (lostResult.value.posts ?? []) : []),
          ...(foundResult.status === 'fulfilled' ? (foundResult.value.posts ?? []) : []),
        ],
      )
      setMessageConversations(
        messagesResult.status === 'fulfilled'
          ? (messagesResult.value.conversations ?? [])
          : [],
      )
      setMyClaims(
        claimsResult.status === 'fulfilled'
          ? (claimsResult.value.claims ?? [])
          : [],
      )
      setNotificationItems(
        notificationsResult.status === 'fulfilled'
          ? (notificationsResult.value.notifications ?? [])
          : [],
      )
    }

    void loadUserData()
    const refreshTimer = window.setInterval(() => {
      void loadUserData()
    }, 30000)

    return () => {
      ignore = true
      window.clearInterval(refreshTimer)
    }
  }, [token])

  const closeMenus = () => {
    setProfileOpen(false)
    setNotificationOpen(false)
    setMobileMenuOpen(false)
  }

  const pageRouteMap = {
    community: '/community',
    'lost-items': '/lost-items',
    'found-items': '/found-items',
    messages: '/messages',
    contact: '/contact',
    profile: '/profile',
  }

  const handleNavigate = (page) => {
    const targetPath = pageRouteMap[page]
    closeMenus()

    if (targetPath && targetPath !== location.pathname) {
      navigate(targetPath)
    }
  }

  const handleOpenConversation = async (participant, relatedPost = null, conversation = null) => {
    if (!participant?.id || Number(participant.id) === Number(user.id)) return

    const contextPost = relatedPost ?? conversation?.related_item ?? null
    const communityPostId = conversation?.community_post_id ?? contextPost?.community_post_id ?? contextPost?.id ?? null
    const itemId = conversation?.item_id ?? null
    const conversationId = conversation?.id ?? getConversationId(participant.id, communityPostId ? { id: communityPostId } : null, itemId)

    setSelectedMessageItem(contextPost)

    const nextParams = new URLSearchParams({ user: String(participant.id) })
    if (communityPostId) nextParams.set('community_post_id', String(communityPostId))
    if (itemId) nextParams.set('item_id', String(itemId))
    const nextPath = `/messages?${nextParams.toString()}`

    if (`${location.pathname}${location.search}` !== nextPath) {
      navigate(nextPath)
    }
    setActiveConversation({ participant, id: conversationId, community_post_id: communityPostId, item_id: itemId })
    setLoadingConversation(true)
    setMessageError('')

    try {
      const apiParams = new URLSearchParams()
      if (communityPostId) apiParams.set('community_post_id', String(communityPostId))
      if (itemId) apiParams.set('item_id', String(itemId))
      const payload = await apiRequest(`/messages/${participant.id}${apiParams.toString() ? `?${apiParams.toString()}` : ''}`, { token })
      const nextConversation = {
        id: payload.id ?? conversationId,
        participant: payload.participant,
        community_post_id: payload.community_post_id ?? communityPostId,
        item_id: payload.item_id ?? itemId,
        related_item: payload.related_item ?? contextPost,
      }

      setActiveConversation(nextConversation)
      setSelectedMessageItem(nextConversation.related_item)
      setActiveConversationMessages(payload.messages ?? [])
      setMessageConversations((current) => {
        const latestMessage = payload.messages.at(-1) ?? null
        const exists = current.some((currentConversation) => currentConversation.id === nextConversation.id)

        if (exists) {
          return current
            .map((currentConversation) =>
            currentConversation.id === nextConversation.id
              ? {
                  ...currentConversation,
                  participant: payload.participant,
                  related_item: nextConversation.related_item,
                  latest_message: latestMessage ?? currentConversation.latest_message,
                  unread_count: 0,
                }
              : currentConversation,
          )
            .sort((left, right) => {
              const leftTime = new Date(left.latest_message?.created_at ?? 0).getTime()
              const rightTime = new Date(right.latest_message?.created_at ?? 0).getTime()
              return rightTime - leftTime
            })
        }

        return [
          {
            ...nextConversation,
            participant: payload.participant,
            latest_message: latestMessage,
            unread_count: 0,
          },
          ...current,
        ]
      })
      setNotificationItems((current) =>
        current.map((notification) => (
          notification.type === 'message_received' && notification.data?.sender_id === payload.participant.id
            ? { ...notification, read: true, read_at: notification.read_at ?? new Date().toISOString() }
            : notification
        )),
      )
      clearTypingIndicator()
    } catch (error) {
      setMessageError(error.payload?.message ?? 'Failed to load the conversation.')
    } finally {
      setLoadingConversation(false)
    }
  }

  useEffect(() => {
    openConversationRef.current = handleOpenConversation
  })

  const handleSendMessage = async (receiverId, message, attachment = null, relatedPost = null, conversation = null) => {
    setSendingMessage(true)
    setMessageError('')

    try {
      const formData = new FormData()
      formData.append('receiver_id', receiverId)
      if (message?.trim()) formData.append('message', message.trim())
      if (attachment) formData.append('attachment', attachment)

      const communityPostId = conversation?.community_post_id ?? relatedPost?.community_post_id ?? relatedPost?.id
      const itemId = conversation?.item_id ?? null

      if (communityPostId) formData.append('community_post_id', communityPostId)
      if (itemId) formData.append('item_id', itemId)

      const payload = await apiRequest('/messages', {
        method: 'POST',
        token,
        body: formData,
      })

      setActiveConversationMessages((current) => {
        if (current.some((entry) => entry.id === payload.data.id)) {
          return current
        }

        return [...current, payload.data]
      })

      setMessageConversations((current) => {
        const participant = normalizeRealtimeUserId(payload.data.receiver?.id) === normalizeRealtimeUserId(user.id)
          ? payload.data.sender
          : payload.data.receiver

        const nextConversation = {
          id: getConversationId(participant.id, payload.data.community_post_id ? { id: payload.data.community_post_id } : null, payload.data.item_id),
          participant,
          community_post_id: payload.data.community_post_id,
          item_id: payload.data.item_id,
          related_item: payload.data.related_item,
          latest_message: payload.data,
          unread_count: 0,
        }

      const filtered = current.filter((conversation) => conversation.id !== nextConversation.id)
      return [nextConversation, ...filtered]
      })
      handleTypingStateChange(receiverId, false)
    } catch (error) {
      setMessageError(error.payload?.message ?? 'Failed to send the message.')
      throw error
    } finally {
      setSendingMessage(false)
    }
  }

  const handleDeleteMessage = async (message) => {
    if (!message?.id || message.sender?.id !== user.id) return

    setMessageError('')

    try {
      const payload = await apiRequest(`/messages/${message.id}`, {
        method: 'DELETE',
        token,
      })

      const deletedMessage = payload.data

      setActiveConversationMessages((current) =>
        current.map((entry) => (entry.id === deletedMessage.id ? deletedMessage : entry)),
      )

      setMessageConversations((current) =>
        current.map((conversation) => (
          conversation.latest_message?.id === deletedMessage.id
            ? { ...conversation, latest_message: deletedMessage }
            : conversation
        )),
      )
    } catch (error) {
      setMessageError(error.payload?.message ?? 'Failed to delete the message.')
    }
  }

  const handleDeleteConversation = async (conversation) => {
    const participantId = conversation?.participant?.id
    if (!participantId) return

    setMessageError('')

    try {
      const params = new URLSearchParams()
      if (conversation.community_post_id) params.set('community_post_id', conversation.community_post_id)
      if (conversation.item_id) params.set('item_id', conversation.item_id)

      await apiRequest(`/messages/conversations/${participantId}${params.toString() ? `?${params.toString()}` : ''}`, {
        method: 'DELETE',
        token,
      })

      setMessageConversations((current) => current.filter((entry) => entry.id !== conversation.id))

      if (activeConversation?.id === conversation.id) {
        setActiveConversation(null)
        setActiveConversationMessages([])
        setSelectedMessageItem(null)
      }
    } catch (error) {
      setMessageError(error.payload?.message ?? 'Failed to delete the conversation.')
    }
  }

  const handleTypingStateChange = (receiverId, isTyping) => {
    const normalizedReceiverId = normalizeRealtimeUserId(receiverId)
    const currentUserId = normalizeRealtimeUserId(user.id)
    const currentConversation = activeConversationRef.current
    const channel = activeConversationChannelRef.current

    if (!normalizedReceiverId || !currentUserId || !currentConversation?.id || !channel?.whisper) return

    if (
      typingStateRef.current.receiverId === normalizedReceiverId
      && typingStateRef.current.isTyping === isTyping
    ) {
      return
    }

    typingStateRef.current = { receiverId: normalizedReceiverId, isTyping }

    try {
      channel.whisper('typing', {
        userId: currentUserId,
        receiverId: normalizedReceiverId,
        conversationId: currentConversation.id,
        typing: Boolean(isTyping),
        sentAt: new Date().toISOString(),
      })
      logRealtimeDebug('[Conversation] whisper typing:', {
        conversationId: currentConversation.id,
        typing: Boolean(isTyping),
      })
    } catch (error) {
      logRealtimeDebug('[Conversation] whisper typing failed:', error)
    }
  }

  const handleItemSubmitted = (payload) => {
    const item = payload?.post ?? payload

    setCommunityPosts((current) => [item, ...current])
    setMyItems((current) => [item, ...current])

    if (item.status === 'approved' && ['lost', 'found'].includes(item.post_type ?? item.type)) {
      setApprovedItems((current) => [item, ...current.filter((currentItem) => currentItem.id !== item.id)])
    }

    if (payload?.notification) {
      setNotificationItems((current) => [payload.notification, ...current].slice(0, 20))
    }

  }

  const handlePostUpdated = (payload) => {
    const updatedPost = payload?.post ?? payload

    if (!updatedPost?.id) return

    const replacePost = (items) =>
      items.map((item) => (item.id === updatedPost.id ? updatedPost : item))

    setCommunityPosts(replacePost)
    setMyItems(replacePost)
    setApprovedItems((current) => {
      const withoutUpdated = current.filter((item) => item.id !== updatedPost.id)
      const shouldShowAsApprovedItem =
        updatedPost.status === 'approved'
        && ['lost', 'found'].includes(updatedPost.post_type ?? updatedPost.type)

      return shouldShowAsApprovedItem ? [updatedPost, ...withoutUpdated] : withoutUpdated
    })
    savedPostsState.replaceSavedPost?.(updatedPost)
  }

  const handleDeletePost = async (post) => {
    if (!post?.id) return

    const confirmed = window.confirm(`Delete "${post.title || 'this post'}"? This cannot be undone.`)
    if (!confirmed) return

    setDeletingPostId(post.id)

    try {
      await apiRequest(`/community-posts/${post.id}`, {
        method: 'DELETE',
        token,
      })

      setCommunityPosts((current) => current.filter((item) => item.id !== post.id))
      setMyItems((current) => current.filter((item) => item.id !== post.id))
      setApprovedItems((current) => current.filter((item) => item.id !== post.id))
      savedPostsState.removeSavedPost?.(post.id)
    } catch (error) {
      window.alert(error.payload?.message ?? 'Failed to delete the post.')
    } finally {
      setDeletingPostId(null)
    }
  }

  const handleSubmitClaim = async (claimValues) => {
    setSubmittingClaim(true)

    try {
      const payload = await apiRequest('/claims', {
        method: 'POST',
        token,
        body: claimValues,
      })

      setMyClaims((current) => [payload.claim, ...current.filter((claim) => claim.id !== payload.claim.id)])
      const returnedNotifications = [
        payload.notification,
        ...(payload.rating_notifications ?? []),
      ].filter(Boolean)

      if (returnedNotifications.length > 0) {
        setNotificationItems((current) => {
          const merged = [...returnedNotifications, ...current]
          const unique = merged.filter((notification, index, list) => (
            list.findIndex((item) => item.id === notification.id) === index
          ))

          return unique.slice(0, 20)
        })
      }
      return payload
    } finally {
      setSubmittingClaim(false)
    }
  }

  const handleUpdateClaim = async (claimId, values) => {
    setSavingClaimId(claimId)

    try {
      const payload = await apiRequest(`/claims/${claimId}`, {
        method: 'PATCH',
        token,
        body: values,
      })

      setMyClaims((current) =>
        current.map((claim) => (claim.id === payload.claim.id ? payload.claim : claim)),
      )

      return payload
    } finally {
      setSavingClaimId(null)
    }
  }

  const handleWithdrawClaim = async (claim) => {
    if (!claim?.id) return

    setSavingClaimId(claim.id)

    try {
      await apiRequest(`/claims/${claim.id}`, {
        method: 'DELETE',
        token,
      })

      setMyClaims((current) => current.filter((currentClaim) => currentClaim.id !== claim.id))
    } finally {
      setSavingClaimId(null)
    }
  }

  const markClaimRatingSubmitted = (claimId) => {
    if (!claimId) return

    const markClaim = (claim) => (
      claim?.id === claimId
        ? { ...claim, rating_submitted: true, can_rate: false }
        : claim
    )

    setMyClaims((current) => current.map(markClaim))
    setMyItems((current) =>
      current.map((item) => ({
        ...item,
        claims: Array.isArray(item.claims) ? item.claims.map(markClaim) : item.claims,
      })),
    )
  }

  const handleReturnRatingSuccess = (payload) => {
    const claimId = payload?.rating?.claim_id ?? notificationRatingClaim?.id

    markClaimRatingSubmitted(claimId)

    if (payload?.notification) {
      setNotificationItems((current) => {
        const merged = [payload.notification, ...current]
        return merged
          .filter((notification, index, list) => (
            list.findIndex((item) => item.id === notification.id) === index
          ))
          .slice(0, 20)
      })
    }

    setNotificationRatingClaim(null)
  }

  const handleMarkClaimReturned = async (claim) => {
    const returnPost = claim?.community_post
    const participantId = claim?.participant?.id ?? claim?.user?.id ?? claim?.participant_user_id
    const saveKey = claim?.id ?? (returnPost?.id && participantId ? `post-${returnPost.id}-${participantId}` : null)

    if (!saveKey) return

    setSavingClaimId(saveKey)

    try {
      const payload = claim?.id && !String(claim.id).startsWith('post-')
        ? await apiRequest(`/claims/${claim.id}/return`, {
            method: 'PATCH',
            token,
          })
        : await apiRequest(`/community-posts/${returnPost.id}/return`, {
            method: 'PATCH',
            token,
            body: {
              participant_user_id: participantId,
            },
          })
      const updatedClaim = payload.claim
      const returnedPost = updatedClaim?.community_post

      if (updatedClaim?.id) {
        setMyClaims((current) =>
          current.some((currentClaim) => currentClaim.id === updatedClaim.id)
            ? current.map((currentClaim) => (
                currentClaim.id === updatedClaim.id ? updatedClaim : currentClaim
              ))
            : current,
        )
      }

      if (returnedPost?.id) {
        const replaceReturnedPost = (items) =>
          items.map((item) => {
            if (item.id !== returnedPost.id) return item

            const claims = Array.isArray(item.claims)
              ? item.claims.some((claim) => claim.id === updatedClaim.id)
                ? item.claims.map((claim) => (
                    claim.id === updatedClaim.id ? updatedClaim : claim
                  ))
                : [updatedClaim, ...item.claims]
              : []

            return {
              ...item,
              ...returnedPost,
              claims,
            }
          })

        setCommunityPosts((current) => current.filter((item) => item.id !== returnedPost.id))
        setApprovedItems((current) => current.filter((item) => item.id !== returnedPost.id))
        setMyItems(replaceReturnedPost)
        savedPostsState.replaceSavedPost?.(returnedPost)
        setSelectedMessageItem((current) => (
          current?.id === returnedPost.id ? { ...current, ...returnedPost } : current
        ))
        setActiveConversation((current) => (
          current?.related_item?.id === returnedPost.id
            ? { ...current, related_item: { ...current.related_item, ...returnedPost } }
            : current
        ))
        setMessageConversations((current) =>
          current.map((conversation) => (
            conversation.related_item?.id === returnedPost.id
              ? { ...conversation, related_item: { ...conversation.related_item, ...returnedPost } }
              : conversation
          )),
        )
      }

      const returnedNotifications = [
        payload.notification,
        ...(payload.rating_notifications ?? []),
      ].filter(Boolean)

      if (returnedNotifications.length > 0) {
        setNotificationItems((current) => {
          const merged = [...returnedNotifications, ...current]
          const unique = merged.filter((notification, index, list) => (
            list.findIndex((item) => item.id === notification.id) === index
          ))

          return unique.slice(0, 20)
        })
      }

      if (updatedClaim?.id && (updatedClaim.can_rate ?? true) && !updatedClaim.rating_submitted) {
        setNotificationRatingClaim(updatedClaim)
      }

      return payload
    } finally {
      setSavingClaimId(null)
    }
  }

  const markNotificationRead = async (notificationId) => {
    if (!notificationId) return

    setNotificationItems((current) =>
      current.map((notification) => (
        notification.id === notificationId && !notification.read
          ? { ...notification, read: true, read_at: new Date().toISOString() }
          : notification
      )),
    )

    try {
      await apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token,
      })
    } catch {
      // Keep the optimistic state so the user is not bounced by a transient network issue.
    }
  }

  const handleNotificationClick = (notification) => {
    closeMenus()
    void markNotificationRead(notification.id)

    if (notification.type === 'message_received') {
      const senderId = notification.data?.sender_id
      const postId = notification.data?.community_post_id
      const itemId = notification.data?.item_id
      const params = new URLSearchParams()
      if (senderId) params.set('user', senderId)
      if (postId) params.set('community_post_id', postId)
      if (itemId) params.set('item_id', itemId)
      navigate(`/messages${params.toString() ? `?${params.toString()}` : ''}`)
      return
    }

    if (notification.type === 'claim_received') {
      navigate(`/community?section=${notification.data?.section ?? 'my-found'}`)
      return
    }

    if (notification.type?.startsWith('claim_')) {
      navigate('/community?section=my-returns')
      return
    }

    if (notification.type === 'rating_available' || notification.data?.action === 'rating_available') {
      if (notification.data?.claim_id) {
        setNotificationRatingClaim({ id: notification.data.claim_id })
      }
      return
    }

    if (notification.type === 'rating_received' || notification.data?.action === 'rating_received') {
      navigate('/profile')
      return
    }

    if (notification.type === 'item_returned' || notification.type === 'return_completed') {
      navigate(`/community?section=${notification.data?.section ?? 'my-returns'}`)
      return
    }

    if (notification.type === 'post_approved' || notification.type === 'post_rejected') {
      navigate(`/community?section=${notification.data?.section ?? 'my-lost'}`)
      return
    }

    navigate(notification.data?.section ? `/community?section=${notification.data.section}` : '/community')
  }

  const menuItems = dashboardMenuItems
  const dropdownItems = useMemo(
    () =>
      profileDropdownItems.map((item) => (
        item.key === 'my-profile'
          ? { ...item, path: `/users/${user.id}` }
          : item
      )),
    [user.id],
  )
  const roleLabel = 'Community Member'
  const notifications = useMemo(() => {
    return notificationItems.map((notification) => ({
      ...notification,
      rawTime: notification.time,
      time: notification.time
        ? formatDate(notification.time, { month: 'short', day: 'numeric' })
        : 'Today',
      relativeTime: formatRelativeTime(notification.time),
      absoluteTime: notification.time
        ? formatDate(notification.time, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Today',
    }))
  }, [notificationItems])
  const unreadNotifications = notificationItems.filter((notification) => !notification.read).length
  const contactUsers = useMemo(() => {
    const map = new Map()

    communityPosts.forEach((post) => {
      const participant = post.user
      if (!participant || participant.id === user.id || map.has(participant.id)) return
      map.set(participant.id, participant)
    })

    messageConversations.forEach((conversation) => {
      const participant = conversation.participant
      if (!participant || participant.id === user.id || map.has(participant.id)) return
      map.set(participant.id, participant)
    })

    myItems.forEach((post) => {
      if ((post.post_type ?? post.type) !== 'found' || !Array.isArray(post.claims)) return

      post.claims.forEach((claim) => {
        const claimant = claim.user
        if (!claimant || claimant.id === user.id || map.has(claimant.id)) return
        map.set(claimant.id, claimant)
      })
    })

    return Array.from(map.values())
  }, [communityPosts, messageConversations, myItems, user.id])
  const handleStartMessage = (targetUser, relatedPost = null) => {
    if (!targetUser?.id || Number(targetUser.id) === Number(user.id)) return
    void handleOpenConversation(targetUser, relatedPost)
  }

  const handleUserProfileClick = (profileUser) => {
    if (!profileUser?.id) return
    closeMenus()
    navigate(`/users/${profileUser.id}`)
  }

  useEffect(() => {
    if (activePage !== 'messages') return

    const requestedUserId = Number(searchParams.get('user'))
    const requestedPostId = Number(searchParams.get('community_post_id'))
    const requestedItemId = Number(searchParams.get('item_id'))
    const requestedConversationId = requestedUserId
      ? getConversationId(
        requestedUserId,
        requestedPostId ? { id: requestedPostId } : null,
        requestedItemId || null,
      )
      : null

    if (requestedUserId && activeConversation?.id !== requestedConversationId) {
      const requestedParticipant =
        messageConversations.find((conversation) => conversation.participant?.id === requestedUserId)?.participant
        ?? contactUsers.find((contact) => contact.id === requestedUserId)
      const requestedConversation = messageConversations.find((conversation) => (
        conversation.participant?.id === requestedUserId
        && (!requestedPostId || Number(conversation.community_post_id) === requestedPostId)
        && (!requestedItemId || Number(conversation.item_id) === requestedItemId)
      ))
      const requestedPost = requestedPostId
        ? [...communityPosts, ...approvedItems, ...myItems].find((post) => Number(post.id) === requestedPostId)
        : requestedConversation?.related_item

      if (requestedParticipant) {
        void openConversationRef.current?.(requestedParticipant, requestedPost ?? null, requestedConversation ?? null)
      }
      return
    }

    if (!requestedUserId && !activeConversation && messageConversations.length > 0) {
      const firstConversation = messageConversations[0]
      void openConversationRef.current?.(firstConversation.participant, firstConversation.related_item ?? null, firstConversation)
    }
  }, [activePage, activeConversation, approvedItems, communityPosts, contactUsers, messageConversations, myItems, searchParams])

  const handleMarkNotificationsRead = async () => {
    setNotificationItems((current) =>
      current.map((notification) => (
        notification.read ? notification : { ...notification, read: true, read_at: new Date().toISOString() }
      )),
    )

    try {
      await apiRequest('/notifications/read', {
        method: 'PATCH',
        token,
      })
    } catch {
      // Keep the optimistic read state to avoid a noisy UI reset.
    }
  }

  useEffect(() => {
    const echo = getRealtimeClient(token)

    if (!echo || !user?.id) {
      return undefined
    }

    const userChannel = echo.private(getUserChannelName(user.id))

    userChannel.listen('.notification.created', (payload) => {
      const nextNotification = payload.notification

      if (!nextNotification?.id) {
        return
      }

      setNotificationItems((current) => {
        const filtered = current.filter((notification) => notification.id !== nextNotification.id)
        return [nextNotification, ...filtered].slice(0, 20)
      })
    })

    userChannel.listen('.notification.read', (payload) => {
      setNotificationItems((current) =>
        current.map((notification) => {
          if (payload.all) {
            return notification.read
              ? notification
              : { ...notification, read: true, read_at: payload.read_at ?? new Date().toISOString() }
          }

          return payload.notification_ids?.includes(notification.id)
            ? { ...notification, read: true, read_at: payload.read_at ?? new Date().toISOString() }
            : notification
        }),
      )
    })

    userChannel.listen('.message.sent', (payload) => {
      const nextMessage = payload.message

      if (!nextMessage?.id) {
        return
      }

      const currentUserId = normalizeRealtimeUserId(user.id)
      const senderId = normalizeRealtimeUserId(nextMessage.sender?.id)
      const receiverId = normalizeRealtimeUserId(nextMessage.receiver?.id)
      const participant = senderId === currentUserId
        ? nextMessage.receiver
        : nextMessage.sender
      const nextConversationId = getConversationId(
        participant.id,
        nextMessage.community_post_id ? { id: nextMessage.community_post_id } : null,
        nextMessage.item_id,
      )

      if (!participant?.id) {
        return
      }

      setMessageConversations((current) => {
        const existing = current.find((conversation) => conversation.id === nextConversationId)
        const unreadCount = receiverId === currentUserId && activeConversationRef.current?.id !== nextConversationId
          ? (existing?.unread_count ?? 0) + 1
          : 0

        const nextConversation = {
          id: nextConversationId,
          participant,
          community_post_id: nextMessage.community_post_id,
          item_id: nextMessage.item_id,
          related_item: nextMessage.related_item,
          latest_message: nextMessage,
          unread_count: unreadCount,
        }

        return [
          nextConversation,
          ...current.filter((conversation) => conversation.id !== nextConversationId),
        ]
      })

      if (activeConversationRef.current?.id === nextConversationId) {
        setActiveConversationMessages((current) => {
          if (current.some((entry) => entry.id === nextMessage.id)) {
            return current
          }

          return [...current, nextMessage]
        })
        clearTypingIndicator()
      }
    })

    userChannel.listen('.message.deleted', (payload) => {
      const deletedMessage = payload.message

      if (!deletedMessage?.id) return

      setActiveConversationMessages((current) =>
        current.map((message) => (message.id === deletedMessage.id ? deletedMessage : message)),
      )

      setMessageConversations((current) =>
        current.map((conversation) => (
          conversation.latest_message?.id === deletedMessage.id
            ? { ...conversation, latest_message: deletedMessage }
            : conversation
        )),
      )
    })

    userChannel.listen('.message.read', (payload) => {
      if (!Array.isArray(payload.message_ids) || payload.message_ids.length === 0) {
        return
      }

      setActiveConversationMessages((current) =>
        current.map((message) => (
          payload.message_ids.includes(message.id)
            ? { ...message, is_read: true, read_at: payload.read_at ?? new Date().toISOString() }
            : message
        )),
      )

      setMessageConversations((current) =>
        current.map((conversation) => (
          normalizeRealtimeUserId(conversation.participant?.id) === normalizeRealtimeUserId(payload.reader_id)
            ? {
                ...conversation,
                unread_count: 0,
              }
            : conversation
        )),
      )
    })

    logRealtimeDebug('[Presence] subscribing...', getPresenceChannelName())

    const presenceChannel = echo.join(getPresenceChannelName())

    presenceChannel.subscribed(() => {
      logRealtimeDebug('[Presence] subscribed')
    })

    presenceChannel.error((error) => {
      logRealtimeDebug('[Presence] subscription error:', error)
    })

    presenceChannel.here((members = []) => {
      const ids = normalizePresenceIds(members.map((member) => member.id))
      logRealtimeDebug('[Presence] members:', ids)
      setOnlineUserIds(ids)
    })

    presenceChannel.joining((member) => {
      const memberId = normalizeRealtimeUserId(member.id)
      if (!memberId) return

      logRealtimeDebug('[Presence] joining:', member)
      setOnlineUserIds((current) => normalizePresenceIds([...current, memberId]))
    })

    presenceChannel.leaving((member) => {
      const memberId = normalizeRealtimeUserId(member.id)
      if (!memberId) return

      logRealtimeDebug('[Presence] leaving:', member)
      setOnlineUserIds((current) => normalizePresenceIds(current).filter((id) => id !== memberId))
      if (normalizeRealtimeUserId(activeConversationRef.current?.participant?.id) === memberId) {
        clearTypingIndicator()
      }
    })

    return () => {
      echo.leave(getPresenceChannelName())
      echo.leave(getUserChannelName(user.id))
      setOnlineUserIds([])
    }
  }, [clearTypingIndicator, token, user?.id])

  useEffect(() => {
    const echo = getRealtimeClient(token)
    const participantId = activeConversation?.participant?.id

    if (!echo || !participantId || !user?.id) {
      activeConversationChannelRef.current = null
      return undefined
    }

    const channelName = getConversationChannelName(user.id, participantId)
    const channel = echo.private(channelName)
    activeConversationChannelRef.current = channel
    logRealtimeDebug('[Conversation] subscribing:', channelName)

    channel.subscribed(() => {
      logRealtimeDebug('[Conversation] subscribed:', channelName)
    })

    channel.error((error) => {
      logRealtimeDebug('[Conversation] subscription error:', { channelName, error })
    })

    const showParticipantTyping = (senderId, conversationId = activeConversation.id) => {
      if (!senderId || senderId === normalizeRealtimeUserId(user.id)) return
      if (String(conversationId) !== String(activeConversation.id)) return

      if (typingHideTimerRef.current) {
        window.clearTimeout(typingHideTimerRef.current)
      }

      setTypingParticipantId(senderId)
      setTypingConversationId(activeConversation.id)
      typingHideTimerRef.current = window.setTimeout(() => {
        clearTypingIndicator()
      }, 3000)
    }

    channel.listen('.message.typing', (payload) => {
      const senderId = normalizeRealtimeUserId(payload.sender_id)
      showParticipantTyping(senderId)
    })

    channel.listen('.message.typing.stopped', (payload) => {
      const senderId = normalizeRealtimeUserId(payload.sender_id)
      if (senderId && senderId !== normalizeRealtimeUserId(user.id)) {
        setTypingParticipantId((current) => (current === senderId ? null : current))
        setTypingConversationId((current) => (current === activeConversation.id ? null : current))
        if (typingHideTimerRef.current) {
          window.clearTimeout(typingHideTimerRef.current)
          typingHideTimerRef.current = null
        }
      }
    })

    channel.listenForWhisper('typing', (payload) => {
      const senderId = normalizeRealtimeUserId(payload.userId ?? payload.sender_id)
      const conversationId = payload.conversationId

      logRealtimeDebug('[Conversation] whisper typing received:', payload)

      if (!senderId || senderId === normalizeRealtimeUserId(user.id)) {
        return
      }

      if (String(conversationId) !== String(activeConversation.id)) {
        return
      }

      if (payload.typing) {
        showParticipantTyping(senderId, conversationId)
        return
      }

      setTypingParticipantId((current) => (current === senderId ? null : current))
      setTypingConversationId((current) => (current === activeConversation.id ? null : current))
      if (typingHideTimerRef.current) {
        window.clearTimeout(typingHideTimerRef.current)
        typingHideTimerRef.current = null
      }
    })

    return () => {
      activeConversationChannelRef.current = null
      echo.leave(channelName)
      clearTypingIndicator()
      typingStateRef.current = { receiverId: null, isTyping: false }
    }
  }, [activeConversation?.id, activeConversation?.participant?.id, clearTypingIndicator, token, user?.id])

  return (
    <div className="dashboard-page">
      <DashboardNavbar
        user={user}
        menuItems={menuItems}
        homePath="/community"
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen((current) => !current)}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
        onNavClose={closeMenus}
        profileRef={profileRef}
        notificationRef={notificationRef}
        dropdownItems={dropdownItems}
        roleLabel={roleLabel}
        notifications={notifications}
        notificationOpen={notificationOpen}
        onToggleNotifications={() => {
          setNotificationOpen((current) => !current)
          setProfileOpen(false)
        }}
        unreadNotifications={unreadNotifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllNotificationsRead={handleMarkNotificationsRead}
        onViewAllNotifications={() => {
          setNotificationOpen(false)
          navigate('/community?section=notifications')
        }}
      />
      <main className="dashboard-main">
        <DashboardContent
          activePage={activePage}
          user={user}
          onNavigate={handleNavigate}
          token={token}
          onUserUpdate={onUserUpdate}
          categories={categories}
          communityPosts={communityPosts}
          approvedItems={approvedItems}
          myItems={myItems}
          myClaims={myClaims}
          onItemSubmitted={handleItemSubmitted}
          notifications={notifications}
          messageConversations={messageConversations}
          activeConversation={activeConversation}
          activeConversationMessages={activeConversationMessages}
          selectedMessageItem={selectedMessageItem}
          onOpenConversation={handleOpenConversation}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          onDeleteConversation={handleDeleteConversation}
          onTypingStateChange={handleTypingStateChange}
          onSubmitClaim={handleSubmitClaim}
          onUpdateClaim={handleUpdateClaim}
          onWithdrawClaim={handleWithdrawClaim}
          onMarkClaimReturned={handleMarkClaimReturned}
          savingClaimId={savingClaimId}
          submittingClaim={submittingClaim}
          sendingMessage={sendingMessage}
          loadingConversation={loadingConversation}
          messageError={messageError}
          onStartMessage={handleStartMessage}
          onUserProfileClick={handleUserProfileClick}
          onlineUserIds={onlineUserIds}
          typingParticipantId={typingParticipantId}
          typingConversationId={typingConversationId}
          savedPostsState={savedPostsState}
          onDeletePost={handleDeletePost}
          onUpdatePost={handlePostUpdated}
          deletingPostId={deletingPostId}
        />
      </main>
      <RatingModal
        open={Boolean(notificationRatingClaim)}
        claim={notificationRatingClaim}
        token={token}
        onClose={() => setNotificationRatingClaim(null)}
        onSuccess={handleReturnRatingSuccess}
      />
      <Footer />
    </div>
  )
}

export default DashboardLayout
