import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import CommunityMap from '../components/CommunityMap'
import Icon from '../components/Icon'
import { apiRequest } from '../services/api'
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
      { key: 'contact', label: 'Contact Messages', icon: 'mail' },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'notifications', label: 'Notifications', icon: 'bell' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
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

const contactStatusOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

const contactStatusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
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

const sectionHeadingMap = {
  overview: {
    title: 'Overview',
    subtitle: 'Monitor FindIt activity and moderation.',
  },
  pending: {
    title: 'Pending Posts',
    subtitle: 'Review submissions waiting for moderation.',
  },
  lost: {
    title: 'Lost Items',
    subtitle: 'All lost-item posts submitted by the community.',
  },
  found: {
    title: 'Found Items',
    subtitle: 'All found-item posts submitted by the community.',
  },
  users: {
    title: 'Users',
    subtitle: 'Registered members in the FindIt community.',
  },
  claims: {
    title: 'Claims',
    subtitle: 'Monitor user-to-user claims and completed returns.',
  },
  contact: {
    title: 'Contact Messages',
    subtitle: 'Review support requests and resolve completed conversations.',
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Latest admin-facing updates from across the platform.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Advanced admin configuration and outbound webhook integrations.',
  },
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
  const [selectedContactId, setSelectedContactId] = useState(null)
  const [contactSearch, setContactSearch] = useState('')
  const [contactStatusFilter, setContactStatusFilter] = useState('all')
  const [adminProfileOpen, setAdminProfileOpen] = useState(false)
  const [postSearch, setPostSearch] = useState('')
  const [postStatusFilter, setPostStatusFilter] = useState('all')
  const [webhooks, setWebhooks] = useState([])
  const [supportedWebhookEvents, setSupportedWebhookEvents] = useState([])
  const [webhookLoading, setWebhookLoading] = useState(false)
  const profileMenuRef = useRef(null)

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
        apiRequest('/admin/contact-messages', { token }),
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
      setContactMessages(contactPayload?.messages ?? [])
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
          apiRequest('/admin/contact-messages', { token }),
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
        setContactMessages(contactPayload?.messages ?? [])
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
    () => overview.pending_posts ?? allPosts.filter((post) => post.status === 'pending'),
    [allPosts, overview.pending_posts],
  )

  const lostPosts = useMemo(
    () => allPosts.filter((post) => post.post_type === 'lost'),
    [allPosts],
  )

  const foundPosts = useMemo(
    () => allPosts.filter((post) => post.post_type === 'found'),
    [allPosts],
  )

  const filterPostCollection = (posts) => {
    const query = postSearch.trim().toLowerCase()

    return posts.filter((post) => {
      const matchesStatus = postStatusFilter === 'all' || post.status === postStatusFilter
      const matchesSearch = !query || [
        post.title,
        post.content,
        post.user?.name,
        post.user?.email,
        post.category?.name,
        post.location,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))

      return matchesStatus && matchesSearch
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
        value: stats.pending_posts ?? 0,
        description: 'Waiting for admin review.',
        icon: 'clock',
      },
      {
        label: 'Total Lost Items',
        value: stats.lost_items ?? 0,
        description: 'Lost item reports submitted.',
        icon: 'search',
      },
      {
        label: 'Total Found Items',
        value: stats.found_items ?? 0,
        description: 'Found item reports submitted.',
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
        label: 'Unread Support',
        value: stats.new_messages ?? 0,
        description: 'Support messages needing attention.',
        icon: 'mail',
      },
    ]
  }, [claims, overview.stats])

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

    return contactMessages.filter((message) => {
      const matchesStatus = contactStatusFilter === 'all' || message.status === contactStatusFilter
      const matchesSearch = !query || [
        message.name,
        message.email,
        message.subject,
        message.message,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))

      return matchesStatus && matchesSearch
    })
  }, [contactMessages, contactSearch, contactStatusFilter])

  const sidebarCountMap = useMemo(() => ({
    pending: pendingPosts.length,
    lost: lostPosts.length,
    found: foundPosts.length,
    users: users.length,
    claims: claims.length,
    contact: contactMessages.filter((message) => message.status !== 'resolved').length,
    notifications: overview.recent_activity?.length ?? 0,
    settings: webhooks.length,
  }), [claims, contactMessages, foundPosts.length, lostPosts.length, overview.recent_activity, pendingPosts.length, users.length, webhooks.length])

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

  const handlePostUpdate = async (postId, status) => {
    setSavingPostId(postId)
    setFeedback('')

    const note =
      status === 'rejected'
        ? window.prompt('Add an admin note for this rejection (optional):', '') ?? ''
        : ''

    try {
      const payload = await apiRequest(
        `/admin/community-posts/${postId}/${status === 'approved' ? 'approve' : 'reject'}`,
        {
          method: 'PUT',
          token,
          body: note ? { admin_note: note } : {},
        },
      )

      setFeedback(payload.message ?? `Post ${status} successfully.`)

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

  const handleContactMessageUpdate = async (messageId, status) => {
    setSavingContactId(messageId)
    setFeedback('')

    try {
      const payload = await apiRequest(`/admin/contact-messages/${messageId}`, {
        method: 'PATCH',
        token,
        body: { status },
      })

      const updatedMessage = payload.contact_message
      setContactMessages((current) =>
        current.map((message) => (
          message.id === messageId ? updatedMessage : message
        )),
      )
      setSelectedContactId(messageId)
      setFeedback(payload.message ?? 'Contact message updated successfully.')
      await loadDashboard({ silent: true })
    } catch (requestError) {
      setFeedback(requestError.payload?.message ?? 'Failed to update contact message.')
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

  const renderPageHeading = () => {
    const heading = sectionHeadingMap[activeSection] ?? sectionHeadingMap.overview

    return (
      <div className="admin-compact-heading">
        <div>
          <h1>{heading.title}</h1>
          <p>{heading.subtitle}</p>
        </div>
        {activeSection === 'overview' ? (
          <span className="admin-compact-heading-badge">
            <Icon name="shield" />
            {loading ? 'Loading data...' : 'Live backend data'}
          </span>
        ) : null}
      </div>
    )
  }

  const renderPostRows = (posts, emptyMessage) => {
    const visiblePosts = filterPostCollection(posts)

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
          <select value={postStatusFilter} onChange={(event) => setPostStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="claimed">Claimed</option>
            <option value="returned">Returned</option>
          </select>
        </div>

        <div className="admin-pending-table-head">
          <span>User</span>
          <span>Item / Post</span>
          <span>Details</span>
          <span>Action</span>
        </div>

        {visiblePosts.map((post) => (
          <article className="admin-pending-table-row" key={post.id}>
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

            <div className="admin-row-post" data-label="Post">
              <strong>{post.title || 'Untitled Post'}</strong>
              <p>{post.content || 'No description provided.'}</p>
            </div>

            <div className="admin-row-meta" data-label="Details">
              <span className={`badge badge-type ${post.post_type === 'lost' ? 'badge-lost' : post.post_type === 'found' ? 'badge-found' : ''}`}>
                {post.post_type}
              </span>
              <span>{post.category?.name || 'General'}</span>
              <span>{post.location || 'Not provided'}</span>
              <span>{formatDate(post.item_date || post.created_at)}</span>
              <span className={`badge badge-status admin-status-badge admin-status-${post.status}`}>
                {post.status}
              </span>
            </div>

            <div className="admin-pending-actions" data-label="Action">
              <button
                type="button"
                className="secondary-action-button"
                onClick={() => setSelectedPost(post)}
              >
                View
              </button>

              {post.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    className="quick-action-button"
                    disabled={savingPostId === post.id}
                    onClick={() => void handlePostUpdate(post.id, 'approved')}
                  >
                    {savingPostId === post.id ? 'Saving...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className="secondary-action-button admin-reject-button"
                    disabled={savingPostId === post.id}
                    onClick={() => void handlePostUpdate(post.id, 'rejected')}
                  >
                    Reject
                  </button>
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
        {renderPostRows(pendingPosts, 'No pending post reviews right now.')}
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
        <div className="admin-list">
          {users.map((person) => (
            <article className="admin-list-item" key={person.id}>
              <div className="admin-user-cell">
                <span className="profile-avatar profile-avatar-small">
                  {person.profile_image_url ? <img src={person.profile_image_url} alt={person.name} /> : person.name?.charAt(0).toUpperCase()}
                </span>
                <div>
                  <strong>{person.name}</strong>
                  <p>{person.email}</p>
                </div>
              </div>

              <div className="admin-list-meta">
                <span className={`badge badge-status ${person.status === 'active' ? 'badge-approved' : 'badge-rejected'}`}>
                  {person.status}
                </span>
                <span>{person.phone || 'No phone'}</span>
                <span>Joined {formatDate(person.created_at)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        renderEmpty('No users found.', 'group')
      )}
    </section>
  )

  const renderClaims = () => (
    <section className="dashboard-panel admin-dashboard-panel">
      {claims.length ? (
        <div className="admin-card-grid">
          {claims.map((claim) => (
            <article className="admin-list-item" key={claim.id}>
              <div>
                <strong>{claim.item?.title || 'Claimed item'}</strong>
                <p>{claim.proof_description || 'No proof description provided.'}</p>
                <p>{claim.item?.location || 'No location'} • {claim.contact_phone || 'No phone'}</p>
                {claim.admin_note ? <p>Admin note: {claim.admin_note}</p> : null}
              </div>

              <div className="admin-list-meta">
                <span>{claim.user?.name || 'Unknown user'}</span>
                <span className={`badge badge-status admin-status-badge admin-status-${claim.status}`}>
                  {claim.status}
                </span>
                <span>{formatDate(claim.created_at)}</span>
                <span>{claim.item?.user?.name ? `Finder: ${claim.item.user.name}` : 'Finder unavailable'}</span>
                {claim.returned_at ? <span>Returned {formatDate(claim.returned_at)}</span> : null}
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
            <select value={contactStatusFilter} onChange={(event) => setContactStatusFilter(event.target.value)}>
              {contactStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="admin-contact-list">
            {filteredContactMessages.length > 0 ? (
              filteredContactMessages.map((message) => (
                <button
                  type="button"
                  key={message.id}
                  className={`admin-contact-list-item${selectedContactMessage?.id === message.id ? ' is-active' : ''}`}
                  onClick={() => setSelectedContactId(message.id)}
                >
                  <span className={`admin-contact-status-dot admin-contact-status-${message.status}`} />
                  <span className="admin-contact-list-copy">
                    <strong>{message.subject || 'General support request'}</strong>
                    <small>{message.name} • {message.email}</small>
                    <span>{message.message}</span>
                  </span>
                  <small>{formatDate(message.created_at, { month: 'short', day: 'numeric' })}</small>
                </button>
              ))
            ) : (
              renderEmpty('No contact messages match your filters.', 'mail')
            )}
          </div>
        </aside>

        <section className="admin-contact-detail-pane">
          {selectedContactMessage ? (
            <>
              <div className="admin-contact-detail-top">
                <div>
                  <span className={`badge badge-status admin-status-badge admin-status-${selectedContactMessage.status}`}>
                    {contactStatusLabels[selectedContactMessage.status] ?? selectedContactMessage.status}
                  </span>
                  <h3>{selectedContactMessage.subject || 'General support request'}</h3>
                  <p>{formatDate(selectedContactMessage.created_at, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}</p>
                </div>
              </div>

              <div className="admin-contact-user-card">
                <span className="profile-avatar profile-avatar-small">
                  {selectedContactMessage.name?.charAt(0).toUpperCase() || '?'}
                </span>
                <div>
                  <strong>{selectedContactMessage.name}</strong>
                  <p>{selectedContactMessage.email}</p>
                </div>
              </div>

              <div className="admin-contact-message-body">
                <strong>Message</strong>
                <p>{selectedContactMessage.message}</p>
              </div>

              <div className="admin-contact-actions">
                <label>
                  <span>Status</span>
                  <select
                    value={selectedContactMessage.status}
                    disabled={savingContactId === selectedContactMessage.id}
                    onChange={(event) => void handleContactMessageUpdate(selectedContactMessage.id, event.target.value)}
                  >
                    {contactStatusOptions.filter((option) => option.value !== 'all').map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="quick-action-button"
                  disabled={savingContactId === selectedContactMessage.id || selectedContactMessage.status === 'resolved'}
                  onClick={() => void handleContactMessageUpdate(selectedContactMessage.id, 'resolved')}
                >
                  {savingContactId === selectedContactMessage.id ? 'Saving...' : 'Mark as Resolved'}
                </button>
              </div>
            </>
          ) : (
            renderEmpty('Select a message to view details.', 'mail')
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
      const payload = await apiRequest(`/admin/webhooks/${webhookId}/test`, {
        method: 'POST',
        token,
      })

      setFeedback(payload.message ?? 'Test webhook queued successfully.')
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
      <section className="dashboard-panel admin-dashboard-panel">
        <div className="section-panel-heading">
          <h2>Post Details</h2>
          <p>Review the selected submission before taking action.</p>
        </div>

        <div className="admin-post-detail">
          {selectedPost.image_url ? (
            <img className="admin-item-image" src={selectedPost.image_url} alt={selectedPost.title || selectedPost.post_type} />
          ) : null}

          <div className="admin-post-detail-copy">
            <div className="admin-post-detail-top">
              <div>
                <h3>{selectedPost.title || 'Untitled Post'}</h3>
                <p>{selectedPost.content || 'No description provided.'}</p>
              </div>
              <button type="button" className="secondary-action-button" onClick={() => setSelectedPost(null)}>
                Close
              </button>
            </div>

            <div className="admin-post-meta-grid">
              <div>
                <strong>User</strong>
                <p>{selectedPost.user?.name || 'Unknown user'}</p>
              </div>
              <div>
                <strong>Email</strong>
                <p>{selectedPost.user?.email || 'No email'}</p>
              </div>
              <div>
                <strong>Type</strong>
                <p>{selectedPost.post_type}</p>
              </div>
              <div>
                <strong>Status</strong>
                <p>{selectedPost.status}</p>
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
                <strong>Admin Note</strong>
                <p>{selectedPost.admin_note || 'No admin note yet.'}</p>
              </div>
            </div>

            {selectedPost.latitude !== null && selectedPost.longitude !== null ? (
              <CommunityMap
                posts={[selectedPost]}
                onViewDetails={() => {}}
                title="Saved Item Location"
                subtitle={selectedPost.location || 'Selected map position'}
                eyebrow="Map preview"
                showControls={false}
                compact
                approvedOnly={false}
              />
            ) : null}

            {selectedPost.status === 'pending' ? (
              <div className="admin-actions">
                <button
                  type="button"
                  className="quick-action-button admin-inline-button"
                  disabled={savingPostId === selectedPost.id}
                  onClick={() => void handlePostUpdate(selectedPost.id, 'approved')}
                >
                  {savingPostId === selectedPost.id ? 'Saving...' : 'Approve Post'}
                </button>
                <button
                  type="button"
                  className="secondary-action-button admin-inline-button admin-reject-button"
                  disabled={savingPostId === selectedPost.id}
                  onClick={() => void handlePostUpdate(selectedPost.id, 'rejected')}
                >
                  Reject Post
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'pending':
        return (
          <section className="dashboard-panel admin-dashboard-panel">
            {renderPostRows(pendingPosts, 'No pending post reviews right now.')}
          </section>
        )
      case 'lost':
        return (
          <section className="dashboard-panel admin-dashboard-panel">
            {renderPostRows(lostPosts, 'No lost-item posts found yet.')}
          </section>
        )
      case 'found':
        return (
          <section className="dashboard-panel admin-dashboard-panel">
            {renderPostRows(foundPosts, 'No found-item posts found yet.')}
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
            {renderPageHeading()}

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
                {renderSelectedPost()}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
