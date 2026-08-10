import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'
import CommunityPage from './CommunityPage'
import ContactPage from './ContactPage'
import ItemsPage from './ItemsPage'
import MessagesPage from './MessagesPage'
import ProfilePage from './ProfilePage'
import ReportItemsPage from './ReportItemsPage'
import {
  dashboardMenuItems,
  profileDropdownItems,
} from '../utils/constants'
import { apiRequest } from '../services/api'
import {
  disconnectRealtime,
  getConversationChannelName,
  getPresenceChannelName,
  getRealtimeClient,
  getUserChannelName,
} from '../services/realtime'
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
  messageConversations,
  activeConversation,
  activeConversationMessages,
  onOpenConversation,
  onSendMessage,
  onTypingStateChange,
  onSubmitClaim,
  submittingClaim,
  sendingMessage,
  loadingConversation,
  messageError,
  onStartMessage,
  onlineUserIds,
  typingParticipantId,
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
          onStartMessage={onStartMessage}
          onSubmitClaim={onSubmitClaim}
          submittingClaim={submittingClaim}
        />
      )
    case 'lost-items':
      return (
        <ItemsPage
          type="lost"
          items={approvedItems}
          user={user}
          onStartMessage={onStartMessage}
          myClaims={myClaims}
          onSubmitClaim={onSubmitClaim}
          submittingClaim={submittingClaim}
        />
      )
    case 'found-items':
      return (
        <ItemsPage
          type="found"
          items={approvedItems}
          user={user}
          onStartMessage={onStartMessage}
          myClaims={myClaims}
          onSubmitClaim={onSubmitClaim}
          submittingClaim={submittingClaim}
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
          itemSources={[...communityPosts, ...approvedItems, ...myItems]}
          onOpenConversation={onOpenConversation}
          onSendMessage={onSendMessage}
          onTypingStateChange={onTypingStateChange}
          sendingMessage={sendingMessage}
          loadingConversation={loadingConversation}
          messageError={messageError}
          onlineUserIds={onlineUserIds}
          typingParticipantId={typingParticipantId}
        />
      )
    case 'contact':
      return <ContactPage user={user} token={token} />
    case 'profile':
      return <ProfilePage user={user} token={token} onUserUpdate={onUserUpdate} />
    default:
      return (
        <CommunityPage
          user={user}
          token={token}
          categories={categories}
          posts={communityPosts}
          myPosts={myItems}
          onCreatePost={onItemSubmitted}
          onNavigate={onNavigate}
          notifications={notifications}
        />
      )
  }
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
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [submittingClaim, setSubmittingClaim] = useState(false)
  const [messageError, setMessageError] = useState('')
  const [onlineUserIds, setOnlineUserIds] = useState([])
  const [typingParticipantId, setTypingParticipantId] = useState(null)
  const profileRef = useRef(null)
  const notificationRef = useRef(null)
  const activeConversationRef = useRef(null)
  const typingStateRef = useRef({ receiverId: null, isTyping: false })
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

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
      default:
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
        lostResult.status === 'fulfilled' && foundResult.status === 'fulfilled'
          ? [...(lostResult.value.posts ?? []), ...(foundResult.value.posts ?? [])]
          : [],
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

  const handleOpenConversation = async (participant) => {
    if (location.pathname !== '/messages' || searchParams.get('user') !== String(participant.id)) {
      navigate(`/messages?user=${participant.id}`)
    }
    setActiveConversation({ participant })
    setLoadingConversation(true)
    setMessageError('')

    try {
      const payload = await apiRequest(`/messages/${participant.id}`, { token })
      setActiveConversation({ participant: payload.participant })
      setActiveConversationMessages(payload.messages ?? [])
      setSearchParams({ user: String(payload.participant.id) }, { replace: true })
      setMessageConversations((current) => {
        const exists = current.some((conversation) => conversation.participant?.id === payload.participant.id)

        if (exists) {
          return current
            .map((conversation) =>
            conversation.participant?.id === payload.participant.id
              ? {
                  ...conversation,
                  participant: payload.participant,
                  latest_message: payload.messages.at(-1) ?? conversation.latest_message,
                  unread_count: 0,
                }
              : conversation,
          )
            .sort((left, right) => {
              const leftTime = new Date(left.latest_message?.created_at ?? 0).getTime()
              const rightTime = new Date(right.latest_message?.created_at ?? 0).getTime()
              return rightTime - leftTime
            })
        }

        return [
          {
            participant: payload.participant,
            latest_message: payload.messages.at(-1) ?? null,
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
      setTypingParticipantId(null)
    } catch (error) {
      setMessageError(error.payload?.message ?? 'Failed to load the conversation.')
    } finally {
      setLoadingConversation(false)
    }
  }

  const handleSendMessage = async (receiverId, message) => {
    setSendingMessage(true)
    setMessageError('')

    try {
      const payload = await apiRequest('/messages', {
        method: 'POST',
        token,
        body: {
          receiver_id: receiverId,
          message,
        },
      })

      setActiveConversationMessages((current) => {
        if (current.some((entry) => entry.id === payload.data.id)) {
          return current
        }

        return [...current, payload.data]
      })

      setMessageConversations((current) => {
        const participant = payload.data.receiver?.id === user.id
          ? payload.data.sender
          : payload.data.receiver

        const nextConversation = {
          participant,
          latest_message: payload.data,
          unread_count: 0,
        }

      const filtered = current.filter((conversation) => conversation.participant?.id !== participant?.id)
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

  const handleTypingStateChange = (receiverId, isTyping) => {
    if (!receiverId) return

    if (
      typingStateRef.current.receiverId === receiverId
      && typingStateRef.current.isTyping === isTyping
    ) {
      return
    }

    typingStateRef.current = { receiverId, isTyping }

    void apiRequest(isTyping ? '/messages/typing' : '/messages/typing/stop', {
      method: 'POST',
      token,
      body: {
        receiver_id: receiverId,
      },
    }).catch(() => {})
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

  const handleSubmitClaim = async (claimValues) => {
    setSubmittingClaim(true)

    try {
      const payload = await apiRequest('/claims', {
        method: 'POST',
        token,
        body: claimValues,
      })

      setMyClaims((current) => [payload.claim, ...current.filter((claim) => claim.id !== payload.claim.id)])
      if (payload.notification) {
        setNotificationItems((current) => [payload.notification, ...current].slice(0, 20))
      }
      return payload
    } finally {
      setSubmittingClaim(false)
    }
  }

  const menuItems = dashboardMenuItems
  const dropdownItems = profileDropdownItems
  const roleLabel = 'Community Member'
  const notifications = useMemo(() => {
    return notificationItems.map((notification) => ({
      ...notification,
      time: notification.time
        ? formatDate(notification.time, { month: 'short', day: 'numeric' })
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

    return Array.from(map.values())
  }, [communityPosts, messageConversations, user.id])
  const handleStartMessage = (targetUser) => {
    if (!targetUser?.id || targetUser.id === user.id) return
    void handleOpenConversation(targetUser)
  }

  useEffect(() => {
    if (activePage !== 'messages') return

    const requestedUserId = Number(searchParams.get('user'))

    if (requestedUserId && activeConversation?.participant?.id !== requestedUserId) {
      const requestedParticipant =
        messageConversations.find((conversation) => conversation.participant?.id === requestedUserId)?.participant
        ?? contactUsers.find((contact) => contact.id === requestedUserId)

      if (requestedParticipant) {
        void handleOpenConversation(requestedParticipant)
      }
      return
    }

    if (!requestedUserId && !activeConversation && contactUsers.length > 0) {
      void handleOpenConversation(contactUsers[0])
    }
  }, [activePage, activeConversation, contactUsers, messageConversations, searchParams])

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

      const participant = nextMessage.sender?.id === user.id
        ? nextMessage.receiver
        : nextMessage.sender

      if (!participant?.id) {
        return
      }

      setMessageConversations((current) => {
        const existing = current.find((conversation) => conversation.participant?.id === participant.id)
        const unreadCount = nextMessage.receiver?.id === user.id && activeConversationRef.current?.participant?.id !== participant.id
          ? (existing?.unread_count ?? 0) + 1
          : 0

        const nextConversation = {
          participant,
          latest_message: nextMessage,
          unread_count: unreadCount,
        }

        return [
          nextConversation,
          ...current.filter((conversation) => conversation.participant?.id !== participant.id),
        ]
      })

      if (activeConversationRef.current?.participant?.id === participant.id) {
        setActiveConversationMessages((current) => {
          if (current.some((entry) => entry.id === nextMessage.id)) {
            return current
          }

          return [...current, nextMessage]
        })
        setTypingParticipantId(null)
      }
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
          conversation.participant?.id === payload.reader_id
            ? {
                ...conversation,
                unread_count: 0,
              }
            : conversation
        )),
      )
    })

    const presenceChannel = echo.join(getPresenceChannelName())

    presenceChannel.here((members) => {
      setOnlineUserIds(members.map((member) => member.id))
    })

    presenceChannel.joining((member) => {
      setOnlineUserIds((current) => (current.includes(member.id) ? current : [...current, member.id]))
    })

    presenceChannel.leaving((member) => {
      setOnlineUserIds((current) => current.filter((id) => id !== member.id))
    })

    return () => {
      echo.leave(getPresenceChannelName())
      echo.leave(getUserChannelName(user.id))
      disconnectRealtime()
    }
  }, [token, user?.id])

  useEffect(() => {
    const echo = getRealtimeClient(token)
    const participantId = activeConversation?.participant?.id

    if (!echo || !participantId || !user?.id) {
      return undefined
    }

    const channelName = getConversationChannelName(user.id, participantId)
    const channel = echo.private(channelName)

    channel.listen('.message.typing', (payload) => {
      if (payload.sender_id !== user.id) {
        setTypingParticipantId(payload.sender_id)
      }
    })

    channel.listen('.message.typing.stopped', (payload) => {
      if (payload.sender_id !== user.id) {
        setTypingParticipantId((current) => (current === payload.sender_id ? null : current))
      }
    })

    return () => {
      echo.leave(channelName)
      setTypingParticipantId(null)
    }
  }, [activeConversation?.participant?.id, token, user?.id])

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
          setNotificationOpen((current) => {
            const next = !current
            if (next && unreadNotifications > 0) {
              void handleMarkNotificationsRead()
            }
            return next
          })
          setProfileOpen(false)
        }}
        unreadNotifications={unreadNotifications}
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
          onOpenConversation={handleOpenConversation}
          onSendMessage={handleSendMessage}
          onTypingStateChange={handleTypingStateChange}
          onSubmitClaim={handleSubmitClaim}
          submittingClaim={submittingClaim}
          sendingMessage={sendingMessage}
          loadingConversation={loadingConversation}
          messageError={messageError}
          onStartMessage={handleStartMessage}
          onlineUserIds={onlineUserIds}
          typingParticipantId={typingParticipantId}
        />
      </main>
      <Footer />
    </div>
  )
}

export default DashboardLayout
