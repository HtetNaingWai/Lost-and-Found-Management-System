import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import BrandMark from '../components/BrandMark'
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

const sidebarGroups = [
  {
    label: 'Dashboard',
    items: [
      { key: 'overview', label: 'Overview', icon: 'grid' },
    ],
  },
  {
    label: 'Content',
    items: [
      { key: 'pending', label: 'Pending Posts', icon: 'clock' },
      { key: 'lost', label: 'Lost Items', icon: 'search' },
      { key: 'found', label: 'Found Items', icon: 'inventory' },
    ],
  },
  {
    label: 'Management',
    items: [
      { key: 'users', label: 'Users', icon: 'group' },
      { key: 'claims', label: 'Claims', icon: 'clipboard' },
      { key: 'contact', label: 'Messages', icon: 'mail' },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'notifications', label: 'Notifications', icon: 'bell' },
    ],
  },
]

const emptyOverview = {
  stats: {},
  pending_posts: [],
  recent_activity: [],
  recent_users: [],
  recent_items: [],
  recent_claims: [],
  recent_contact_messages: [],
}

const routeSectionMap = {
  '/admin': 'overview',
  '/admin/pending-posts': 'pending',
  '/admin/lost-items': 'lost',
  '/admin/found-items': 'found',
  '/admin/users': 'users',
  '/admin/claims': 'claims',
  '/admin/contact-messages': 'contact',
  '/admin/notifications': 'notifications',
  '/admin/settings': 'settings',
  '/admin/profile': 'settings',
}

const sectionRouteMap = {
  overview: '/admin',
  pending: '/admin/pending-posts',
  lost: '/admin/lost-items',
  found: '/admin/found-items',
  users: '/admin/users',
  claims: '/admin/claims',
  contact: '/admin/contact-messages',
  notifications: '/admin/notifications',
  settings: '/admin/settings',
}

function hasValidCoordinates(post) {
  const latitude = Number(post?.latitude)
  const longitude = Number(post?.longitude)

  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
    && !(latitude === 0 && longitude === 0)
}

function AdminMapPreview({ post }) {
  const mapRef = useRef(null)
  const nodeRef = useRef(null)

  useEffect(() => {
    if (!nodeRef.current || !hasValidCoordinates(post)) return undefined

    const center = [Number(post.latitude), Number(post.longitude)]
    const map = L.map(nodeRef.current, {
      center,
      zoom: 14,
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    L.marker(center).addTo(map)
    mapRef.current = map

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 120)

    return () => {
      window.clearTimeout(resizeTimer)
      map.remove()
      mapRef.current = null
    }
  }, [post])

  if (!hasValidCoordinates(post)) return null

  return <div ref={nodeRef} className="admin-modal-map" aria-label="Item location map preview" />
}

function AdminActionButton({
  children = 'View Details',
  icon = 'eye',
  ariaLabel,
  onClick,
  className = '',
  disabled = false,
}) {
  return (
    <button
      type="button"
      className={`admin-action-button${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} />
      <span>{children}</span>
    </button>
  )
}

function AdminDashboard({ user, token, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [overview, setOverview] = useState(emptyOverview)
  const [allPosts, setAllPosts] = useState([])
  const [users, setUsers] = useState([])
  const [claims, setClaims] = useState([])
  const [contactMessages, setContactMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [savingPostId, setSavingPostId] = useState(null)
  const [savingContactId, setSavingContactId] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [messageDialog, setMessageDialog] = useState(null)
  const [banDialog, setBanDialog] = useState(null)
  const [selectedContactId, setSelectedContactId] = useState(null)
  const [contactSearch, setContactSearch] = useState('')
  const [supportMessages, setSupportMessages] = useState([])
  const [supportDraft, setSupportDraft] = useState('')
  const [supportLoading, setSupportLoading] = useState(false)
  const [supportError, setSupportError] = useState('')
  const [onlineUserIds, setOnlineUserIds] = useState([])
  const [typingSupportUserId, setTypingSupportUserId] = useState(null)
  const [adminProfileOpen, setAdminProfileOpen] = useState(false)
  const [postSearch, setPostSearch] = useState('')
  const [postStatusFilter, setPostStatusFilter] = useState('all')
  const [postCategoryFilter, setPostCategoryFilter] = useState('all')
  const [moderationDialog, setModerationDialog] = useState(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [savingUserId, setSavingUserId] = useState(null)
  const [userActionMenuId, setUserActionMenuId] = useState(null)
  const [webhooks, setWebhooks] = useState([])
  const [supportedWebhookEvents, setSupportedWebhookEvents] = useState([])
  const [webhookLoading, setWebhookLoading] = useState(false)
  const profileMenuRef = useRef(null)
  const supportChannelRef = useRef(null)
  const supportTypingTimerRef = useRef(null)
  const supportThreadEndRef = useRef(null)

  const activeSection = routeSectionMap[location.pathname] ?? 'overview'

  const loadDashboard = async ({ silent = false } = {}) => {
    if (!token) return

    if (!silent) {
      setLoading(true)
    }

    setError('')

    try {
      const [overviewPayload, postsPayload, usersPayload, claimsPayload, contactPayload] = await Promise.all([
        apiRequest('/admin/overview', { token }),
        apiRequest('/admin/community-posts', { token }),
        apiRequest('/admin/users', { token }),
        apiRequest('/admin/claims', { token }),
        apiRequest('/admin/support-conversations', { token }),
      ])

      setOverview({
        stats: overviewPayload?.stats ?? {},
        pending_posts: overviewPayload?.pending_posts ?? [],
        recent_activity: overviewPayload?.recent_activity ?? [],
        recent_users: overviewPayload?.recent_users ?? [],
        recent_items: overviewPayload?.recent_items ?? [],
        recent_claims: overviewPayload?.recent_claims ?? [],
        recent_contact_messages: overviewPayload?.recent_contact_messages ?? [],
      })
      setAllPosts(postsPayload?.posts ?? [])
      setUsers(usersPayload?.users ?? [])
      setClaims(claimsPayload?.claims ?? [])
      setContactMessages(contactPayload?.conversations ?? [])
    } catch (requestError) {
      console.error('Failed to load admin dashboard:', requestError)
      setError(requestError.payload?.message ?? 'Failed to load admin dashboard data.')
      setOverview(emptyOverview)
      setAllPosts([])
      setUsers([])
      setClaims([])
      setContactMessages([])
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    let ignore = false

    const run = async () => {
      if (!token || ignore) return

      setLoading(true)
      setError('')

      try {
        const [overviewPayload, postsPayload, usersPayload, claimsPayload, contactPayload] = await Promise.all([
          apiRequest('/admin/overview', { token }),
          apiRequest('/admin/community-posts', { token }),
          apiRequest('/admin/users', { token }),
          apiRequest('/admin/claims', { token }),
          apiRequest('/admin/support-conversations', { token }),
        ])

        if (ignore) return

        setOverview({
          stats: overviewPayload?.stats ?? {},
          pending_posts: overviewPayload?.pending_posts ?? [],
          recent_activity: overviewPayload?.recent_activity ?? [],
          recent_users: overviewPayload?.recent_users ?? [],
          recent_items: overviewPayload?.recent_items ?? [],
          recent_claims: overviewPayload?.recent_claims ?? [],
          recent_contact_messages: overviewPayload?.recent_contact_messages ?? [],
        })
        setAllPosts(postsPayload?.posts ?? [])
        setUsers(usersPayload?.users ?? [])
        setClaims(claimsPayload?.claims ?? [])
        setContactMessages(contactPayload?.conversations ?? [])
      } catch (requestError) {
        if (ignore) return

        console.error('Failed to load admin dashboard:', requestError)
        setError(requestError.payload?.message ?? 'Failed to load admin dashboard data.')
        setOverview(emptyOverview)
        setAllPosts([])
        setUsers([])
        setClaims([])
        setContactMessages([])
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      ignore = true
    }
  }, [token])

  const pendingPosts = useMemo(
    () => allPosts.filter((post) => post.status === 'pending'),
    [allPosts],
  )

  const lostPosts = useMemo(
    () => allPosts.filter((post) => post.post_type === 'lost' && post.status === 'approved'),
    [allPosts],
  )

  const foundPosts = useMemo(
    () => allPosts.filter((post) => post.post_type === 'found' && post.status === 'approved'),
    [allPosts],
  )

  const filterPostCollection = (posts, { useStatusFilter = true } = {}) => {
    const query = postSearch.trim().toLowerCase()

    return posts.filter((post) => {
      const matchesStatus = !useStatusFilter || postStatusFilter === 'all' || post.status === postStatusFilter
      const matchesCategory = postCategoryFilter === 'all' || post.category?.name === postCategoryFilter
      const matchesSearch = !query || [
        post.title,
        post.content,
        post.user?.name,
        post.user?.email,
        post.category?.name,
        post.location,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))

      return matchesStatus && matchesCategory && matchesSearch
    })
  }

  const statCards = useMemo(() => {
    const stats = overview.stats ?? {}

    return [
      {
        label: 'Total Users',
        value: stats.total_users ?? 0,
        description: 'Registered community members.',
        icon: 'group',
      },
      {
        label: 'Pending Posts',
        value: stats.pending_posts ?? pendingPosts.length,
        description: 'Waiting for moderation.',
        icon: 'clock',
      },
      {
        label: 'Approved Lost Items',
        value: stats.lost_items ?? 0,
        description: 'Public lost reports.',
        icon: 'search',
      },
      {
        label: 'Approved Found Items',
        value: stats.found_items ?? 0,
        description: 'Public found reports.',
        icon: 'inventory',
      },
      {
        label: 'Active Claims',
        value: stats.active_claims ?? claims.filter((claim) => claim.status === 'pending').length,
        description: 'Users coordinating item returns.',
        icon: 'clipboard',
      },
      {
        label: 'Completed Returns',
        value: stats.completed_returns ?? claims.filter((claim) => claim.status === 'returned').length,
        description: 'Items recorded as returned.',
        icon: 'checkCircle',
      },
      {
        label: 'Unread Messages',
        value: stats.new_messages ?? 0,
        description: 'Support messages needing review.',
        icon: 'mail',
      },
    ]
  }, [claims, overview.stats, pendingPosts.length])

  const snapshotCards = useMemo(() => {
    const stats = overview.stats ?? {}

    return [
      {
        title: 'Recent Users',
        icon: 'group',
        body: `${overview.recent_users?.length ?? 0} recent member registrations are visible in the latest sync.`,
      },
      {
        title: 'Contact Queue',
        icon: 'mail',
        body: `${stats.new_messages ?? 0} unread contact messages are waiting for a response.`,
      },
      {
        title: 'Claim Activity',
        icon: 'clipboard',
        body: `${claims.filter((claim) => claim.status === 'pending').length} active claims and ${claims.filter((claim) => claim.status === 'returned').length} completed returns are visible.`,
      },
    ]
  }, [claims, overview.recent_users, overview.stats])

  const filteredContactMessages = useMemo(() => {
    const query = contactSearch.trim().toLowerCase()

    return contactMessages.filter((conversation) => {
      const latestMessage = conversation.latest_message?.message ?? ''
      const matchesSearch = !query || [
        conversation.user?.name,
        conversation.user?.email,
        latestMessage,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))

      return matchesSearch
    })
  }, [contactMessages, contactSearch])

  const sidebarCountMap = useMemo(() => ({
    pending: pendingPosts.length,
    lost: lostPosts.length,
    found: foundPosts.length,
    users: users.length,
    claims: claims.length,
    contact: contactMessages.filter((message) => message.status !== 'resolved').length,
    notifications: overview.recent_activity?.length ?? 0,
  }), [claims, contactMessages, foundPosts.length, lostPosts.length, overview.recent_activity, pendingPosts.length, users.length])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setAdminProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const hasOpenModal = selectedPost || selectedUser || messageDialog || banDialog || moderationDialog

    if (!hasOpenModal) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return

      setSelectedPost(null)
      setSelectedUser(null)
      setMessageDialog(null)
      setBanDialog(null)
      setModerationDialog(null)
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [banDialog, messageDialog, moderationDialog, selectedPost, selectedUser])

  useEffect(() => {
    if (activeSection !== 'settings' || !token) return undefined

    let ignore = false

    const loadWebhooks = async () => {
      setWebhookLoading(true)

      try {
        const payload = await apiRequest('/admin/webhooks', { token })

        if (ignore) return

        setWebhooks(payload.endpoints ?? [])
        setSupportedWebhookEvents(payload.supported_events ?? [])
      } catch (requestError) {
        if (!ignore) {
          setFeedback(requestError.payload?.message ?? 'Failed to load webhook settings.')
        }
      } finally {
        if (!ignore) {
          setWebhookLoading(false)
        }
      }
    }

    void loadWebhooks()

    return () => {
      ignore = true
    }
  }, [activeSection, token])

  const selectedContactMessage = useMemo(() => (
    filteredContactMessages.find((message) => message.id === selectedContactId)
    ?? filteredContactMessages[0]
    ?? null
  ), [filteredContactMessages, selectedContactId])

  useEffect(() => {
    if (!selectedContactMessage) {
      setSelectedContactId(null)
      return
    }

    if (selectedContactId !== selectedContactMessage.id) {
      setSelectedContactId(selectedContactMessage.id)
    }
  }, [selectedContactId, selectedContactMessage])

  useEffect(() => {
    if (activeSection !== 'contact' || !selectedContactMessage?.id || !token) {
      setSupportMessages([])
      return undefined
    }

    let ignore = false

    const loadSupportThread = async () => {
      setSupportLoading(true)
      setSupportError('')

      try {
        const payload = await apiRequest(`/admin/support-conversations/${selectedContactMessage.id}`, { token })

        if (ignore) return

        setContactMessages((current) =>
          current.map((conversation) => (
            conversation.id === payload.conversation.id ? payload.conversation : conversation
          )),
        )
        setSupportMessages(payload.messages ?? [])
      } catch (requestError) {
        if (!ignore) {
          setSupportError(requestError.payload?.message ?? 'Failed to load support chat.')
        }
      } finally {
        if (!ignore) {
          setSupportLoading(false)
        }
      }
    }

    void loadSupportThread()

    return () => {
      ignore = true
    }
  }, [activeSection, selectedContactMessage?.id, token])

  useEffect(() => {
    supportThreadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [supportMessages.length, supportLoading])

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
    const participantId = selectedContactMessage?.user?.id

    if (!echo || !user?.id || !participantId || activeSection !== 'contact') {
      supportChannelRef.current = null
      return undefined
    }

    const channelName = getConversationChannelName(user.id, participantId)
    const channel = echo.private(channelName)
    supportChannelRef.current = channel

    const handleTyping = (payload) => {
      const senderId = normalizeRealtimeUserId(payload.userId ?? payload.sender_id)
      if (!senderId || senderId === normalizeRealtimeUserId(user.id)) return

      if (payload.typing === false) {
        setTypingSupportUserId(null)
        return
      }

      setTypingSupportUserId(senderId)
      if (supportTypingTimerRef.current) {
        window.clearTimeout(supportTypingTimerRef.current)
      }
      supportTypingTimerRef.current = window.setTimeout(() => setTypingSupportUserId(null), 2500)
    }

    channel.listenForWhisper('typing', handleTyping)
    channel.listen('.message.typing', handleTyping)
    channel.listen('.message.typing.stopped', () => setTypingSupportUserId(null))
    channel.listen('.message.sent', (payload) => {
      const nextMessage = payload.message

      if (!nextMessage?.id || Number(nextMessage.support_conversation_id) !== Number(selectedContactMessage.id)) return

      setSupportMessages((current) => (
        current.some((message) => message.id === nextMessage.id)
          ? current
          : [...current, nextMessage]
      ))

      setContactMessages((current) =>
        current.map((conversation) => (
          conversation.id === selectedContactMessage.id
            ? { ...conversation, latest_message: nextMessage, unread_count: (conversation.unread_count ?? 0) + 1 }
            : conversation
        )),
      )
      setTypingSupportUserId(null)
    })
    channel.listen('.message.read', (payload) => {
      setSupportMessages((current) =>
        current.map((message) => (
          payload.message_ids?.includes(message.id)
            ? { ...message, is_read: true, read_at: payload.read_at ?? new Date().toISOString() }
            : message
        )),
      )
    })

    return () => {
      supportChannelRef.current = null
      echo.leave(channelName)
    }
  }, [activeSection, selectedContactMessage?.id, selectedContactMessage?.user?.id, token, user?.id])

  const openModerationDialog = (post, status) => {
    setModerationDialog({
      post,
      status,
      adminNote: '',
      error: '',
    })
  }

  const handlePostUpdate = async (postId, status, adminNote = '') => {
    setSavingPostId(postId)
    setFeedback('')

    try {
      const payload = await apiRequest(
        `/admin/community-posts/${postId}/${status === 'approved' ? 'approve' : 'reject'}`,
        {
          method: 'PUT',
          token,
          body: adminNote ? { admin_note: adminNote } : {},
        },
      )

      if (selectedPost?.id === postId) {
        setSelectedPost(payload.post ?? null)
      }

      await loadDashboard({ silent: true })
    } catch (requestError) {
      setFeedback(requestError.payload?.message ?? `Failed to ${status} post.`)
    } finally {
      setSavingPostId(null)
    }
  }

  const confirmModerationDialog = async () => {
    if (!moderationDialog?.post) return

    const note = moderationDialog.adminNote.trim()

    if (moderationDialog.status === 'rejected' && note.length < 3) {
      setModerationDialog((current) => current ? {
        ...current,
        error: 'Please add a short reason before rejecting this post.',
      } : current)
      return
    }

    await handlePostUpdate(moderationDialog.post.id, moderationDialog.status, note)
    setModerationDialog(null)
  }

  const handlePostStatusChange = async (postId, status) => {
    setSavingPostId(postId)
    setFeedback('')

    try {
      const payload = await apiRequest(`/admin/community-posts/${postId}`, {
        method: 'PATCH',
        token,
        body: { status },
      })

      if (selectedPost?.id === postId) {
        setSelectedPost(payload.post ?? null)
      }

      await loadDashboard({ silent: true })
    } catch (requestError) {
      setFeedback(requestError.payload?.message ?? `Failed to mark post as ${status}.`)
    } finally {
      setSavingPostId(null)
    }
  }

  const handleDeletePost = async (postId) => {
    const shouldDelete = window.confirm('Delete this post permanently?')

    if (!shouldDelete) {
      return
    }

    setSavingPostId(postId)
    setFeedback('')

    try {
      await apiRequest(`/community-posts/${postId}`, {
        method: 'DELETE',
        token,
      })

      setSelectedPost(null)
      await loadDashboard({ silent: true })
    } catch (requestError) {
      setFeedback(requestError.payload?.message ?? 'Failed to delete post.')
    } finally {
      setSavingPostId(null)
    }
  }

  const openMessageDialog = ({ recipient, post = null }) => {
    if (!recipient?.id) return

    setMessageDialog({
      recipient,
      post,
      message: '',
      error: '',
    })
  }

  const handleSendAdminMessage = async () => {
    if (!messageDialog?.recipient?.id) return

    const message = messageDialog.message.trim()

    if (!message) {
      setMessageDialog((current) => current ? {
        ...current,
        error: 'Please write a message before sending.',
      } : current)
      return
    }

    setSendingMessage(true)

    try {
      const payload = await apiRequest(`/admin/support-conversations/users/${messageDialog.recipient.id}/messages`, {
        method: 'POST',
        token,
        body: {
          message: messageDialog.post?.title
            ? `${message}\n\nContext: ${messageDialog.post.title}`
            : message,
        },
      })

      setContactMessages((current) => {
        const nextConversation = payload.conversation
        if (!nextConversation?.id) return current

        const others = current.filter((conversation) => conversation.id !== nextConversation.id)
        return [nextConversation, ...others]
      })
      setSelectedContactId(payload.conversation?.id ?? null)
      setMessageDialog(null)
      navigate('/admin/contact-messages')
    } catch (requestError) {
      setMessageDialog((current) => current ? {
        ...current,
        error: requestError.payload?.message ?? 'Failed to send message.',
      } : current)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleUserStatusUpdate = async (person, status, reason = '') => {
    if (!person?.id) return

    setSavingUserId(person.id)

    try {
      const payload = await apiRequest(`/admin/users/${person.id}`, {
        method: 'PATCH',
        token,
        body: {
          status,
          ban_reason: reason || null,
        },
      })

      const updatedUser = payload.user

      setUsers((current) => current.map((entry) => (
        entry.id === updatedUser.id ? updatedUser : entry
      )))
      setSelectedUser((current) => (
        current?.id === updatedUser.id ? updatedUser : current
      ))
      setBanDialog(null)
      await loadDashboard({ silent: true })
    } catch (requestError) {
      setBanDialog((current) => current ? {
        ...current,
        error: requestError.payload?.message ?? `Failed to update ${person.name}.`,
      } : current)
      setFeedback(requestError.payload?.message ?? `Failed to update ${person.name}.`)
    } finally {
      setSavingUserId(null)
    }
  }

  const confirmBanUser = async () => {
    if (!banDialog?.user) return

    await handleUserStatusUpdate(banDialog.user, 'banned', banDialog.reason.trim())
  }

  const handleSupportDraftChange = (event) => {
    const nextValue = event.target.value
    setSupportDraft(nextValue)

    if (!supportChannelRef.current?.whisper || !selectedContactMessage?.user?.id) return

    supportChannelRef.current.whisper('typing', {
      userId: user.id,
      receiverId: selectedContactMessage.user.id,
      conversationId: `support-${selectedContactMessage.id}`,
      typing: Boolean(nextValue.trim()),
      sentAt: new Date().toISOString(),
    })
  }

  const handleSupportReply = async (event) => {
    event.preventDefault()
    if (!selectedContactMessage?.id || !supportDraft.trim() || savingContactId) return

    setSavingContactId(selectedContactMessage.id)
    setSupportError('')

    try {
      const payload = await apiRequest(`/admin/support-conversations/${selectedContactMessage.id}/messages`, {
        method: 'POST',
        token,
        body: { message: supportDraft.trim() },
      })

      setSupportMessages((current) => (
        current.some((message) => message.id === payload.data.id)
          ? current
          : [...current, payload.data]
      ))
      setContactMessages((current) =>
        current.map((conversation) => (
          conversation.id === payload.conversation.id ? payload.conversation : conversation
        )),
      )
      setSupportDraft('')
      supportChannelRef.current?.whisper?.('typing', {
        userId: user.id,
        receiverId: selectedContactMessage.user?.id,
        conversationId: `support-${selectedContactMessage.id}`,
        typing: false,
        sentAt: new Date().toISOString(),
      })
    } catch (requestError) {
      setSupportError(requestError.payload?.message ?? 'Failed to send reply.')
    } finally {
      setSavingContactId(null)
    }
  }

  const renderEmpty = (message, icon = 'document') => (
    <div className="admin-dashboard-empty">
      <span className="admin-empty-icon">
        <Icon name={icon} />
      </span>
      <p>{message}</p>
    </div>
  )

  const renderPostRows = (posts, emptyMessage, { mode = 'approved' } = {}) => {
    const isPendingMode = mode === 'pending'
    const visiblePosts = filterPostCollection(posts, { useStatusFilter: !isPendingMode && mode !== 'approved' })

    if (!visiblePosts.length) {
      return renderEmpty(emptyMessage, 'document')
    }

    return (
      <div className="admin-pending-table">
        <div className="admin-table-toolbar">
          <label className="admin-table-search">
            <Icon name="search" />
            <input
              type="search"
              value={postSearch}
              onChange={(event) => setPostSearch(event.target.value)}
              placeholder="Search posts, users, category, or location..."
            />
          </label>
          {!isPendingMode && mode !== 'approved' ? (
            <select value={postStatusFilter} onChange={(event) => setPostStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="claimed">Claimed</option>
              <option value="returned">Returned</option>
            </select>
          ) : null}
          <select value={postCategoryFilter} onChange={(event) => setPostCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {Array.from(new Set(posts.map((post) => post.category?.name).filter(Boolean))).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className={`admin-pending-table-head ${isPendingMode ? 'is-pending' : 'is-approved'}`}>
          <span>Item</span>
          <span>User</span>
          {isPendingMode ? <span>Type</span> : null}
          <span>Category</span>
          <span>Date</span>
          {!isPendingMode ? <span>Status</span> : null}
          <span>Action</span>
        </div>

        {visiblePosts.map((post) => (
          <article className={`admin-pending-table-row ${isPendingMode ? 'is-pending' : 'is-approved'}`} key={post.id}>
            <div className="admin-row-item" data-label="Item">
              {post.image_url ? (
                <img className="admin-row-thumbnail" src={post.image_url} alt={post.title || 'Reported item'} />
              ) : (
                <span className="admin-row-thumbnail admin-row-thumbnail-empty">
                  <Icon name={post.post_type === 'lost' ? 'search' : 'inventory'} />
                </span>
              )}
              <div>
                <strong>{post.title || 'Untitled Post'}</strong>
                {isPendingMode ? (
                  <p title={post.content || ''}>{post.content || 'No description provided.'}</p>
                ) : null}
              </div>
            </div>

            <div className="admin-pending-user admin-row-user" data-label="User">
              <span className="profile-avatar profile-avatar-small">
                {post.user?.profile_image_url ? (
                  <img src={post.user.profile_image_url} alt={post.user.name} />
                ) : (
                  post.user?.name?.charAt(0).toUpperCase() || '?'
                )}
              </span>
              <div>
                <strong>{post.user?.name || 'Unknown user'}</strong>
                <p>{post.user?.email || 'No email available'}</p>
              </div>
            </div>

            {isPendingMode ? (
              <span className={`badge badge-type ${post.post_type === 'lost' ? 'badge-lost' : post.post_type === 'found' ? 'badge-found' : ''}`} data-label="Type">
                {post.post_type}
              </span>
            ) : null}
            <span className="admin-row-text" data-label="Category">{post.category?.name || 'General'}</span>
            <span className="admin-row-text" data-label="Date">{formatDate(post.item_date || post.created_at)}</span>
            {!isPendingMode ? (
              <span className={`badge badge-status admin-status-badge admin-status-${post.status}`} data-label="Status">
                {post.status}
              </span>
            ) : null}

            <div className="admin-pending-actions" data-label="Action">
              <AdminActionButton ariaLabel="View item details" onClick={() => setSelectedPost(post)}>
                {isPendingMode ? 'View' : 'View Details'}
              </AdminActionButton>

              {post.status === 'pending' ? (
                <>
                  <AdminActionButton
                    icon="checkCircle"
                    className="admin-action-approve"
                    ariaLabel="Approve post"
                    disabled={savingPostId === post.id}
                    onClick={() => openModerationDialog(post, 'approved')}
                  >
                    {savingPostId === post.id ? 'Saving...' : 'Approve'}
                  </AdminActionButton>
                  <AdminActionButton
                    icon="close"
                    className="admin-action-reject"
                    ariaLabel="Reject post"
                    disabled={savingPostId === post.id}
                    onClick={() => openModerationDialog(post, 'rejected')}
                  >
                    Reject
                  </AdminActionButton>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    )
  }

  const renderOverview = () => (
    <>
      <div className="admin-dashboard-stat-grid">
        {statCards.map((card) => (
          <article className="dashboard-stat-card admin-dashboard-stat-card" key={card.label}>
            <div className="dashboard-stat-icon admin-stat-icon">
              <Icon name={card.icon} />
            </div>
            <div className="admin-stat-copy">
              <strong>{card.value}</strong>
              <h3>{card.label}</h3>
              <p>{card.description}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="dashboard-panel admin-dashboard-panel">
        <div className="section-panel-heading">
          <h2>Pending Post Reviews</h2>
          <p>Review lost, found, and community submissions before wider visibility.</p>
        </div>
        {renderPostRows(pendingPosts, 'No pending post reviews right now.', { mode: 'pending' })}
      </section>

      <div className="admin-dashboard-lower-grid">
        <section className="dashboard-panel admin-dashboard-panel">
          <div className="section-panel-heading">
            <h2>Recent Activity</h2>
            <p>Latest system events across users, posts, claims, and messages.</p>
          </div>

          {overview.recent_activity?.length ? (
            <div className="admin-activity-list">
              {overview.recent_activity.slice(0, 7).map((activity) => (
                <article className="admin-activity-item" key={activity.id}>
                  <span className="admin-activity-icon">
                    <Icon name={activity.icon || 'document'} />
                  </span>
                  <div className="admin-activity-copy">
                    <strong>{activity.title}</strong>
                    <p>{activity.detail}</p>
                  </div>
                  <span className="admin-activity-time">
                    {activity.time ? formatDate(activity.time, { month: 'short', day: 'numeric' }) : 'Not available'}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            renderEmpty('No recent activity yet.', 'clock')
          )}
        </section>

        <section className="dashboard-panel admin-dashboard-panel">
          <div className="section-panel-heading">
            <h2>System Snapshot</h2>
            <p>Quick visibility into current moderation and support queues.</p>
          </div>

          <div className="admin-snapshot-grid">
            {snapshotCards.map((card) => (
              <article className="admin-snapshot-card" key={card.title}>
                <span className="admin-snapshot-icon">
                  <Icon name={card.icon} />
                </span>
                <strong>{card.title}</strong>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  )

  const renderUsers = () => (
    <section className="dashboard-panel admin-dashboard-panel">
      {users.length ? (
        <div className="admin-users-table">
          <div className="admin-users-table-head">
            <span>User</span>
            <span>Contact</span>
            <span>Status</span>
            <span>Joined</span>
            <span>Action</span>
          </div>
          {users.map((person) => {
            const isBanned = person.status === 'banned'
            const isMenuOpen = userActionMenuId === person.id

            return (
            <article className="admin-user-row" key={person.id}>
              <div className="admin-user-cell">
                <span className="profile-avatar profile-avatar-small">
                  {person.profile_image_url ? <img src={person.profile_image_url} alt={person.name} /> : person.name?.charAt(0).toUpperCase()}
                </span>
                <div>
                  <strong>{person.name}</strong>
                  <p>{person.email}</p>
                </div>
              </div>

              <span className="admin-row-text" data-label="Contact">{person.phone || 'No phone'}</span>
              <span className={`badge badge-status ${person.status === 'active' ? 'badge-approved' : 'badge-rejected'}`} data-label="Status">
                {person.status === 'banned' ? 'Banned' : 'Active'}
              </span>
              <span className="admin-row-text" data-label="Joined">{formatDate(person.created_at)}</span>
              <div className="admin-pending-actions" data-label="Action">
                <AdminActionButton ariaLabel="View user details" onClick={() => setSelectedUser(person)} />
                <div className="admin-row-menu-wrap">
                  <button
                    type="button"
                    className="admin-row-menu-button"
                    aria-label={`More actions for ${person.name}`}
                    aria-expanded={isMenuOpen}
                    onClick={() => setUserActionMenuId((current) => (current === person.id ? null : person.id))}
                  >
                    <span aria-hidden="true">⋯</span>
                  </button>
                  {isMenuOpen ? (
                    <div className="admin-row-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserActionMenuId(null)
                          openMessageDialog({ recipient: person })
                        }}
                      >
                        <Icon name="chat" />
                        <span>Message User</span>
                      </button>
                      {isBanned ? (
                        <button
                          type="button"
                          role="menuitem"
                          disabled={savingUserId === person.id}
                          onClick={() => {
                            setUserActionMenuId(null)
                            void handleUserStatusUpdate(person, 'active')
                          }}
                        >
                          <Icon name="checkCircle" />
                          <span>Activate User</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          role="menuitem"
                          className="is-danger"
                          disabled={savingUserId === person.id}
                          onClick={() => {
                            setUserActionMenuId(null)
                            setBanDialog({ user: person, reason: '', error: '' })
                          }}
                        >
                          <Icon name="close" />
                          <span>Ban User</span>
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
            )
          })}
        </div>
      ) : (
        renderEmpty('No users found.', 'group')
      )}
    </section>
  )

  const renderClaims = () => (
    <section className="dashboard-panel admin-dashboard-panel">
      {claims.length ? (
        <div className="admin-claims-table">
          {claims.map((claim) => (
            <article className="admin-claim-row" key={claim.id}>
              <div className="admin-row-item">
                {claim.item?.image_url ? (
                  <img className="admin-row-thumbnail" src={claim.item.image_url} alt={claim.item.title || 'Claimed item'} />
                ) : (
                  <span className="admin-row-thumbnail admin-row-thumbnail-empty">
                    <Icon name={claim.item?.type === 'lost' ? 'search' : 'inventory'} />
                  </span>
                )}
                <div>
                  <strong>{claim.item?.title || 'Claimed item'}</strong>
                  <p>{claim.item?.type || 'item'} • {claim.item?.category?.name || 'General'}</p>
                </div>
              </div>

              <div className="admin-claim-meta">
                <span>Claimant: <strong>{claim.user?.name || 'Unknown user'}</strong></span>
                <span>Owner: <strong>{claim.item?.user?.name || 'Unavailable'}</strong></span>
                <span>{formatDate(claim.created_at)}</span>
              </div>

              <div className="admin-claim-statuses">
                <span className={`badge badge-status admin-status-badge admin-status-${claim.status}`}>
                  Claim: {claim.status}
                </span>
                <span className={`badge badge-status admin-status-badge admin-status-${claim.item?.status || 'pending'}`}>
                  Item: {claim.item?.status || 'unknown'}
                </span>
              </div>

              <div className="admin-pending-actions">
                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={() => claim.item ? setSelectedPost({
                    ...claim.item,
                    post_type: claim.item.type,
                    content: claim.item.content || claim.proof_description,
                    claims: [claim],
                  }) : null}
                >
                  View
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        renderEmpty('No claims yet.', 'clipboard')
      )}
    </section>
  )

  const renderContactMessages = () => (
    <section className="dashboard-panel admin-dashboard-panel admin-contact-inbox-panel">
      <div className="admin-contact-inbox">
        <aside className="admin-contact-list-pane">
          <div className="admin-contact-controls">
            <label className="admin-contact-search">
              <Icon name="search" />
              <input
                type="search"
                value={contactSearch}
                onChange={(event) => setContactSearch(event.target.value)}
                placeholder="Search messages..."
              />
            </label>
          </div>

          <div className="admin-contact-list">
            {filteredContactMessages.length > 0 ? (
              filteredContactMessages.map((conversation) => (
                <button
                  type="button"
                  key={conversation.id}
                  className={`admin-contact-list-item${selectedContactMessage?.id === conversation.id ? ' is-active' : ''}`}
                  onClick={() => setSelectedContactId(conversation.id)}
                >
                  <span className="profile-avatar profile-avatar-small">
                    {conversation.user?.profile_image_url
                      ? <img src={conversation.user.profile_image_url} alt={conversation.user.name} />
                      : conversation.user?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                  <span className="admin-contact-list-copy">
                    <strong>{conversation.user?.name ?? 'Community Member'}</strong>
                    <small>{conversation.user?.email}</small>
                    <span>{conversation.latest_message?.message ?? 'No messages yet.'}</span>
                  </span>
                  <span className="admin-contact-meta">
                    {conversation.unread_count ? <b>{conversation.unread_count}</b> : null}
                    <small>{formatDate(conversation.updated_at, { month: 'short', day: 'numeric' })}</small>
                  </span>
                </button>
              ))
            ) : (
              renderEmpty('No support conversations match your filters.', 'mail')
            )}
          </div>
        </aside>

        <section className="admin-contact-detail-pane">
          {selectedContactMessage ? (
            <>
              <div className="admin-support-chat-header">
                <span className="profile-avatar">
                  {selectedContactMessage.user?.profile_image_url
                    ? <img src={selectedContactMessage.user.profile_image_url} alt={selectedContactMessage.user.name} />
                    : selectedContactMessage.user?.name?.charAt(0).toUpperCase() || '?'}
                </span>
                <div>
                  <h3>{selectedContactMessage.user?.name ?? 'Community Member'}</h3>
                  <p>
                    {normalizePresenceIds(onlineUserIds).includes(normalizeRealtimeUserId(selectedContactMessage.user?.id))
                      ? 'Online'
                      : 'Offline'}
                    {typingSupportUserId ? ' · typing...' : ''}
                  </p>
                </div>
              </div>

              {supportError ? <p className="settings-feedback is-error">{supportError}</p> : null}

              <div className="admin-support-thread">
                {supportLoading ? (
                  <div className="admin-support-empty">Loading conversation...</div>
                ) : supportMessages.length > 0 ? (
                  supportMessages.map((message) => {
                    const isOwn = normalizeRealtimeUserId(message.sender?.id) === normalizeRealtimeUserId(user.id)

                    return (
                      <article key={message.id} className={`admin-support-bubble ${isOwn ? 'is-own' : 'is-user'}`}>
                        <p>{message.message}</p>
                        <span>
                          {formatDate(message.created_at, { hour: 'numeric', minute: '2-digit' })}
                          {isOwn ? ` · ${message.is_read ? 'Read' : 'Sent'}` : ''}
                        </span>
                      </article>
                    )
                  })
                ) : (
                  <div className="admin-support-empty">No messages in this support thread yet.</div>
                )}
                <span ref={supportThreadEndRef} />
              </div>

              <form className="admin-support-composer" onSubmit={handleSupportReply}>
                <textarea
                  rows="1"
                  value={supportDraft}
                  onChange={handleSupportDraftChange}
                  placeholder={`Reply to ${selectedContactMessage.user?.name ?? 'member'}...`}
                />
                <button
                  type="submit"
                  className="quick-action-button"
                  disabled={savingContactId === selectedContactMessage.id || !supportDraft.trim()}
                >
                  <Icon name="send" />
                  <span>{savingContactId === selectedContactMessage.id ? 'Sending...' : 'Reply'}</span>
                </button>
              </form>
            </>
          ) : (
            renderEmpty('Select a support conversation to start chatting.', 'mail')
          )}
        </section>
      </div>
    </section>
  )

  const renderNotifications = () => (
    <section className="dashboard-panel admin-dashboard-panel">
      {overview.recent_activity?.length ? (
        <div className="admin-activity-list">
          {overview.recent_activity.map((activity) => (
            <article className="admin-activity-item" key={`notification-${activity.id}`}>
              <span className="admin-activity-icon">
                <Icon name={activity.icon || 'bell'} />
              </span>
              <div className="admin-activity-copy">
                <strong>{activity.title}</strong>
                <p>{activity.detail}</p>
              </div>
              <span className="admin-activity-time">{formatDate(activity.time)}</span>
            </article>
          ))}
        </div>
      ) : (
        renderEmpty('No notifications available yet.', 'bell')
      )}
    </section>
  )

  const handleWebhookTest = async (webhookId) => {
    setFeedback('')

    try {
      await apiRequest(`/admin/webhooks/${webhookId}/test`, {
        method: 'POST',
        token,
      })
    } catch (requestError) {
      setFeedback(requestError.payload?.message ?? 'Failed to send test webhook.')
    }
  }

  const renderSettings = () => (
    <section className="dashboard-panel admin-dashboard-panel">
      <div className="admin-settings-grid">
        <article className="admin-settings-card">
          <span className="admin-snapshot-icon">
            <Icon name="shield" />
          </span>
          <div>
            <strong>Admin Access</strong>
            <p>Admin routes and APIs are protected by Sanctum authentication and admin middleware.</p>
          </div>
        </article>

        <article className="admin-settings-card">
          <span className="admin-snapshot-icon">
            <Icon name="settings" />
          </span>
          <div>
            <strong>Webhook Events</strong>
            <p>{supportedWebhookEvents.length ? `${supportedWebhookEvents.length} supported outbound events configured.` : 'Webhook events load from the backend settings API.'}</p>
          </div>
        </article>
      </div>

      <div className="admin-webhook-panel">
        <div className="section-panel-heading">
          <h3>Webhook Endpoints</h3>
          <p>Advanced integration endpoints. Secrets are managed by the backend and should be shared carefully.</p>
        </div>

        {webhookLoading ? (
          renderEmpty('Loading webhook settings...', 'clock')
        ) : webhooks.length ? (
          <div className="admin-list">
            {webhooks.map((webhook) => (
              <article className="admin-list-item admin-webhook-row" key={webhook.id}>
                <div>
                  <strong>{webhook.name}</strong>
                  <p>{webhook.url}</p>
                  <p>{webhook.events?.join(', ') || 'No events selected'}</p>
                </div>
                <div className="admin-list-meta">
                  <span className={`badge badge-status ${webhook.status === 'active' ? 'badge-approved' : 'badge-rejected'}`}>
                    {webhook.status}
                  </span>
                  <span>{webhook.deliveries?.length ?? 0} recent deliveries</span>
                  <button
                    type="button"
                    className="secondary-action-button"
                    onClick={() => void handleWebhookTest(webhook.id)}
                  >
                    Send Test
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          renderEmpty('No webhook endpoints configured yet.', 'settings')
        )}
      </div>
    </section>
  )

  const renderSelectedPost = () => {
    if (!selectedPost) return null

    return (
      <div className="admin-detail-modal-overlay" role="presentation" onMouseDown={() => setSelectedPost(null)}>
        <section
          className="admin-detail-modal"
          aria-label="Post details"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="admin-post-detail">
            <div className="admin-detail-modal-header">
              <div>
                <h3>{selectedPost.title || 'Untitled Post'}</h3>
                <div className="admin-modal-badges">
                  <span className={`badge badge-type ${selectedPost.post_type === 'lost' ? 'badge-lost' : selectedPost.post_type === 'found' ? 'badge-found' : ''}`}>
                    {selectedPost.post_type}
                  </span>
                  <span className={`badge badge-status admin-status-badge admin-status-${selectedPost.status}`}>
                    {selectedPost.status}
                  </span>
                </div>
              </div>
              <button type="button" className="modal-icon-button" aria-label="Close item details" onClick={() => setSelectedPost(null)}>
                <Icon name="close" />
              </button>
            </div>

            <div className="admin-detail-modal-body">
              {selectedPost.image_url ? (
                <img className="admin-item-image" src={selectedPost.image_url} alt={selectedPost.title || selectedPost.post_type} />
              ) : (
                <div className="admin-item-image admin-item-image-placeholder">
                  <Icon name={selectedPost.post_type === 'lost' ? 'search' : 'inventory'} />
                </div>
              )}

              <div className="admin-drawer-description">
                <strong>Description</strong>
                <p>{selectedPost.content || 'No description provided.'}</p>
              </div>

              <div className="admin-post-meta-grid">
                <div>
                  <strong>Owner</strong>
                  <p>{selectedPost.user?.name || 'Unknown user'}</p>
                </div>
                <div>
                  <strong>Email</strong>
                  <p>{selectedPost.user?.email || 'No email'}</p>
                </div>
                <div>
                  <strong>Category</strong>
                  <p>{selectedPost.category?.name || 'General'}</p>
                </div>
                <div>
                  <strong>Location</strong>
                  <p>{selectedPost.location || 'Not provided'}</p>
                </div>
                <div>
                  <strong>Item Date</strong>
                  <p>{formatDate(selectedPost.item_date || selectedPost.created_at)}</p>
                </div>
                <div>
                  <strong>Submitted</strong>
                  <p>{formatDate(selectedPost.created_at)}</p>
                </div>
                <div>
                  <strong>Current Status</strong>
                  <p>{selectedPost.status}</p>
                </div>
                <div>
                  <strong>Admin Note</strong>
                  <p>{selectedPost.admin_note || 'No admin note yet.'}</p>
                </div>
              </div>

              <AdminMapPreview post={selectedPost} />

              <div className="admin-drawer-description">
                <strong>Claim Information</strong>
                {selectedPost.claims?.length ? (
                  <div className="admin-drawer-claims">
                    {selectedPost.claims.map((claim) => (
                      <article key={claim.id}>
                        <span className={`badge badge-status admin-status-badge admin-status-${claim.status}`}>
                          {claim.status}
                        </span>
                        <p>{claim.user?.name || 'Unknown claimant'} • {formatDate(claim.created_at)}</p>
                        <small>{claim.claim_message || claim.proof_description || 'No claim message provided.'}</small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p>No claims connected to this post yet.</p>
                )}
              </div>
            </div>

            <div className="admin-actions admin-drawer-actions">
              <button
                type="button"
                className="secondary-action-button admin-inline-button"
                onClick={() => openMessageDialog({ recipient: selectedPost.user, post: selectedPost })}
              >
                Message User
              </button>
              {selectedPost.status === 'pending' ? (
                <>
                <button
                  type="button"
                  className="quick-action-button admin-inline-button"
                  disabled={savingPostId === selectedPost.id}
                  onClick={() => openModerationDialog(selectedPost, 'approved')}
                >
                  {savingPostId === selectedPost.id ? 'Saving...' : 'Approve Post'}
                </button>
                <button
                  type="button"
                  className="secondary-action-button admin-inline-button admin-reject-button"
                  disabled={savingPostId === selectedPost.id}
                  onClick={() => openModerationDialog(selectedPost, 'rejected')}
                >
                  Reject Post
                </button>
                </>
              ) : null}
              {selectedPost.status === 'claimed' ? (
                <button
                  type="button"
                  className="secondary-action-button admin-inline-button"
                  disabled={savingPostId === selectedPost.id}
                  onClick={() => void handlePostStatusChange(selectedPost.id, 'returned')}
                >
                  Mark Returned
                </button>
              ) : null}
              <button
                type="button"
                className="secondary-action-button admin-inline-button admin-reject-button"
                disabled={savingPostId === selectedPost.id}
                onClick={() => void handleDeletePost(selectedPost.id)}
              >
                Delete Post
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const renderModerationDialog = () => {
    if (!moderationDialog) return null

    const isRejecting = moderationDialog.status === 'rejected'
    const title = isRejecting ? 'Reject this post?' : 'Approve this post?'
    const actionLabel = isRejecting ? 'Reject' : 'Approve'

    return (
      <div className="admin-confirm-overlay" role="presentation" onMouseDown={() => setModerationDialog(null)}>
        <div
          className="admin-confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="admin-confirm-heading">
            <span className={`admin-confirm-icon ${isRejecting ? 'is-danger' : 'is-success'}`}>
              <Icon name={isRejecting ? 'close' : 'checkCircle'} />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{moderationDialog.post?.title || 'Untitled post'}</p>
            </div>
          </div>

          <label className="admin-confirm-field">
            <span>{isRejecting ? 'Reason / feedback' : 'Admin note / feedback'}</span>
            <textarea
              value={moderationDialog.adminNote}
              onChange={(event) => setModerationDialog((current) => current ? {
                ...current,
                adminNote: event.target.value,
                error: '',
              } : current)}
              placeholder={isRejecting ? 'Example: Please provide a clearer item photo.' : 'Optional note for the user.'}
              rows={4}
            />
          </label>

          {moderationDialog.error ? <p className="admin-confirm-error">{moderationDialog.error}</p> : null}

          <div className="admin-confirm-actions">
            <button type="button" className="secondary-action-button" onClick={() => setModerationDialog(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={`quick-action-button ${isRejecting ? 'admin-danger-action' : ''}`}
              disabled={savingPostId === moderationDialog.post?.id}
              onClick={() => void confirmModerationDialog()}
            >
              {savingPostId === moderationDialog.post?.id ? 'Saving...' : actionLabel}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderSelectedUser = () => {
    if (!selectedUser) return null

    const isBanned = selectedUser.status === 'banned'

    return (
      <div className="admin-detail-modal-overlay" role="presentation" onMouseDown={() => setSelectedUser(null)}>
        <section
          className="admin-detail-modal admin-user-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedUser.name} details`}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="admin-detail-modal-header">
            <div className="admin-user-detail-head">
              <span className="profile-avatar">
                {selectedUser.profile_image_url ? <img src={selectedUser.profile_image_url} alt={selectedUser.name} /> : selectedUser.name?.charAt(0).toUpperCase()}
              </span>
              <div>
                <h3>{selectedUser.name}</h3>
                <p>{selectedUser.email}</p>
              </div>
            </div>
            <button type="button" className="modal-icon-button" aria-label="Close user details" onClick={() => setSelectedUser(null)}>
              <Icon name="close" />
            </button>
          </div>

          <div className="admin-detail-modal-body">
            <div className="admin-post-meta-grid">
              <div>
                <strong>Full Name</strong>
                <p>{selectedUser.name}</p>
              </div>
              <div>
                <strong>Email</strong>
                <p>{selectedUser.email}</p>
              </div>
              <div>
                <strong>Phone</strong>
                <p>{selectedUser.phone || 'No phone'}</p>
              </div>
              <div>
                <strong>Joined</strong>
                <p>{formatDate(selectedUser.created_at)}</p>
              </div>
              <div>
                <strong>Status</strong>
                <p>{isBanned ? 'Banned' : 'Active'}</p>
              </div>
              <div>
                <strong>Lost Posts</strong>
                <p>{selectedUser.lost_posts_count ?? 0}</p>
              </div>
              <div>
                <strong>Found Posts</strong>
                <p>{selectedUser.found_posts_count ?? 0}</p>
              </div>
              <div>
                <strong>Claims</strong>
                <p>{selectedUser.claims_count ?? 0}</p>
              </div>
              <div>
                <strong>Completed Returns</strong>
                <p>{selectedUser.completed_returns_count ?? 0}</p>
              </div>
              <div>
                <strong>Ban Reason</strong>
                <p>{selectedUser.ban_reason || 'No ban reason.'}</p>
              </div>
            </div>
          </div>

          <div className="admin-actions admin-drawer-actions">
            <button
              type="button"
              className="secondary-action-button admin-inline-button"
              onClick={() => openMessageDialog({ recipient: selectedUser })}
            >
              Message User
            </button>
            {isBanned ? (
              <button
                type="button"
                className="quick-action-button admin-inline-button"
                disabled={savingUserId === selectedUser.id}
                onClick={() => void handleUserStatusUpdate(selectedUser, 'active')}
              >
                {savingUserId === selectedUser.id ? 'Saving...' : 'Activate User'}
              </button>
            ) : (
              <button
                type="button"
                className="secondary-action-button admin-inline-button admin-reject-button"
                disabled={savingUserId === selectedUser.id}
                onClick={() => setBanDialog({ user: selectedUser, reason: '', error: '' })}
              >
                Ban User
              </button>
            )}
          </div>
        </section>
      </div>
    )
  }

  const renderMessageDialog = () => {
    if (!messageDialog) return null

    return (
      <div className="admin-confirm-overlay" role="presentation" onMouseDown={() => setMessageDialog(null)}>
        <div
          className="admin-confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Message user"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="admin-confirm-heading">
            <span className="admin-confirm-icon">
              <Icon name="chat" />
            </span>
            <div>
              <h3>Message User</h3>
              <p>To: {messageDialog.recipient?.name}</p>
              {messageDialog.post ? <p>Context: {messageDialog.post.title || 'Item post'}</p> : null}
            </div>
          </div>

          <label className="admin-confirm-field">
            <span>Message</span>
            <textarea
              value={messageDialog.message}
              onChange={(event) => setMessageDialog((current) => current ? {
                ...current,
                message: event.target.value,
                error: '',
              } : current)}
              placeholder="Write a clear admin message..."
              rows={5}
            />
          </label>

          {messageDialog.error ? <p className="admin-confirm-error">{messageDialog.error}</p> : null}

          <div className="admin-confirm-actions">
            <button type="button" className="secondary-action-button" onClick={() => setMessageDialog(null)}>
              Cancel
            </button>
            <button type="button" className="quick-action-button" disabled={sendingMessage} onClick={() => void handleSendAdminMessage()}>
              {sendingMessage ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderBanDialog = () => {
    if (!banDialog) return null

    return (
      <div className="admin-confirm-overlay" role="presentation" onMouseDown={() => setBanDialog(null)}>
        <div
          className="admin-confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Ban user"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="admin-confirm-heading">
            <span className="admin-confirm-icon is-danger">
              <Icon name="close" />
            </span>
            <div>
              <h3>Ban this user?</h3>
              <p>{banDialog.user?.name} will be blocked from login and protected actions.</p>
            </div>
          </div>

          <label className="admin-confirm-field">
            <span>Reason</span>
            <textarea
              value={banDialog.reason}
              onChange={(event) => setBanDialog((current) => current ? {
                ...current,
                reason: event.target.value,
                error: '',
              } : current)}
              placeholder="Optional reason shown on next login attempt..."
              rows={4}
            />
          </label>

          {banDialog.error ? <p className="admin-confirm-error">{banDialog.error}</p> : null}

          <div className="admin-confirm-actions">
            <button type="button" className="secondary-action-button" onClick={() => setBanDialog(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="quick-action-button admin-danger-action"
              disabled={savingUserId === banDialog.user?.id}
              onClick={() => void confirmBanUser()}
            >
              {savingUserId === banDialog.user?.id ? 'Saving...' : 'Ban User'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'pending':
        return (
          <section className="dashboard-panel admin-dashboard-panel">
            <div className="section-panel-heading admin-section-heading-compact">
              <h2>Pending Posts</h2>
              <p>Review submissions waiting for moderation.</p>
            </div>
            {renderPostRows(pendingPosts, 'No pending post reviews right now.', { mode: 'pending' })}
          </section>
        )
      case 'lost':
        return (
          <section className="dashboard-panel admin-dashboard-panel">
            <div className="section-panel-heading admin-section-heading-compact">
              <h2>Lost Items</h2>
              <p>Approved lost-item posts visible to the community.</p>
            </div>
            {renderPostRows(lostPosts, 'No approved lost-item posts found yet.', { mode: 'approved' })}
          </section>
        )
      case 'found':
        return (
          <section className="dashboard-panel admin-dashboard-panel">
            <div className="section-panel-heading admin-section-heading-compact">
              <h2>Found Items</h2>
              <p>Approved found-item posts visible to the community.</p>
            </div>
            {renderPostRows(foundPosts, 'No approved found-item posts found yet.', { mode: 'approved' })}
          </section>
        )
      case 'users':
        return renderUsers()
      case 'claims':
        return renderClaims()
      case 'contact':
        return renderContactMessages()
      case 'notifications':
        return renderNotifications()
      case 'settings':
        return renderSettings()
      case 'overview':
      default:
        return renderOverview()
    }
  }

  return (
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-topbar">
        <div className="container admin-dashboard-topbar-inner">
          <div className="admin-dashboard-brand">
            <BrandMark />
            <div>
              <strong>FindIt Admin</strong>
              <span>Control Center</span>
            </div>
          </div>

          <div className="admin-dashboard-topbar-actions">
            <button type="button" className="admin-icon-button" aria-label="Admin notifications" onClick={() => navigate('/admin/notifications')}>
              <Icon name="bell" />
              {sidebarCountMap.notifications ? <span>{sidebarCountMap.notifications}</span> : null}
            </button>

            <div className="admin-profile-menu" ref={profileMenuRef}>
              <button
                type="button"
                className="admin-dashboard-profile"
                onClick={() => setAdminProfileOpen((current) => !current)}
              >
                <span className="profile-avatar">
                  {user?.profile_image_url ? (
                    <img src={user.profile_image_url} alt={user.name} />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'A'
                  )}
                </span>
                <div>
                  <strong>{user?.name}</strong>
                  <small>Administrator</small>
                </div>
                <Icon name="chevronDown" />
              </button>

              {adminProfileOpen ? (
                <div className="admin-profile-dropdown">
                  <div className="admin-profile-dropdown-head">
                    <strong>{user?.name || 'Admin'}</strong>
                    <span>Administrator</span>
                  </div>
                  <button type="button" onClick={() => { setAdminProfileOpen(false); navigate('/admin/settings') }}>
                    <Icon name="settings" />
                    Settings
                  </button>
                  <button type="button" onClick={onLogout}>
                    <Icon name="logout" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="admin-dashboard-main">
        <div className="container admin-dashboard-layout">
          <aside className="admin-dashboard-sidebar">
            <div className="dashboard-panel admin-sidebar-card">
              <h2>Admin Menu</h2>
              <nav className="admin-sidebar-nav" aria-label="Admin sections">
                {sidebarGroups.map((group) => (
                  <div className="admin-sidebar-group" key={group.label}>
                    <p>{group.label}</p>
                    {group.items.map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        className={`admin-sidebar-link${activeSection === item.key ? ' is-active' : ''}`}
                        onClick={() => {
                          const nextPath = sectionRouteMap[item.key] ?? '/admin'
                          if (nextPath !== location.pathname) {
                            navigate(nextPath)
                          }
                        }}
                      >
                        <span className="admin-sidebar-link-icon">
                          <Icon name={item.icon} />
                        </span>
                        <span>{item.label}</span>
                        {sidebarCountMap[item.key] ? (
                          <small>{sidebarCountMap[item.key]}</small>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          <section className="admin-dashboard-content">
            {error ? (
              <section className="dashboard-panel admin-dashboard-panel admin-error-card">
                <div className="section-panel-heading">
                  <h2>Unable to load admin data</h2>
                  <p>{error}</p>
                </div>
                <button type="button" className="quick-action-button" onClick={() => void loadDashboard()}>
                  Retry
                </button>
              </section>
            ) : null}

            {feedback ? (
              <p className={`settings-feedback ${feedback.toLowerCase().includes('failed') ? 'is-error' : 'is-success'}`}>
                {feedback}
              </p>
            ) : null}

            {loading ? (
              <section className="dashboard-panel admin-dashboard-panel">
                {renderEmpty('Loading admin dashboard data...', 'clock')}
              </section>
            ) : (
              <>
                {renderSection()}
              </>
            )}
          </section>
        </div>
      </main>
      {renderSelectedPost()}
      {renderSelectedUser()}
      {renderModerationDialog()}
      {renderMessageDialog()}
      {renderBanDialog()}
    </div>
  )
}

export default AdminDashboard
