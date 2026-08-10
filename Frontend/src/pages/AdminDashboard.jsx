import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import CommunityMap from '../components/CommunityMap'
import Icon from '../components/Icon'
import { apiRequest } from '../services/api'
import { formatDate } from '../utils/formatDate'

const sidebarItems = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'pending', label: 'Pending Posts', icon: 'clock' },
  { key: 'lost', label: 'Lost Items', icon: 'search' },
  { key: 'found', label: 'Found Items', icon: 'inventory' },
  { key: 'users', label: 'Users', icon: 'group' },
  { key: 'claims', label: 'Claims', icon: 'clipboard' },
  { key: 'contact', label: 'Contact Messages', icon: 'mail' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
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
  const [savingClaimId, setSavingClaimId] = useState(null)
  const [savingContactId, setSavingContactId] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedContactId, setSelectedContactId] = useState(null)
  const [contactSearch, setContactSearch] = useState('')
  const [contactStatusFilter, setContactStatusFilter] = useState('all')

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
        label: 'Approved Posts',
        value: stats.approved_posts ?? 0,
        description: 'Currently visible in the system.',
        icon: 'shield',
      },
      {
        label: 'Rejected Posts',
        value: stats.rejected_posts ?? 0,
        description: 'Held back after moderation.',
        icon: 'close',
      },
      {
        label: 'Lost Items',
        value: stats.lost_items ?? 0,
        description: 'Total lost item reports submitted.',
        icon: 'search',
      },
      {
        label: 'Found Items',
        value: stats.found_items ?? 0,
        description: 'Total found item reports submitted.',
        icon: 'inventory',
      },
      {
        label: 'Claims',
        value: stats.claims ?? 0,
        description: 'Ownership claims from members.',
        icon: 'clipboard',
      },
      {
        label: 'Contact Messages',
        value: stats.contact_messages ?? 0,
        description: 'Messages received from the site.',
        icon: 'mail',
      },
    ]
  }, [overview.stats])

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
        title: 'Claims Queue',
        icon: 'clipboard',
        body: `${claims.filter((claim) => claim.status === 'pending').length} claims are currently pending review.`,
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

  const handleClaimUpdate = async (claimId, status) => {
    setSavingClaimId(claimId)
    setFeedback('')

    const note =
      status === 'rejected' || status === 'returned'
        ? window.prompt(
            status === 'returned'
              ? 'Add an admin note for marking this item as returned (optional):'
              : 'Add an admin note for this claim rejection (optional):',
            '',
          ) ?? ''
        : ''

    try {
      const actionMap = {
        approved: 'approve',
        rejected: 'reject',
        returned: 'return',
      }

      const payload = await apiRequest(
        `/admin/claims/${claimId}/${actionMap[status] ?? 'approve'}`,
        {
          method: 'PUT',
          token,
          body: note ? { admin_note: note } : {},
        },
      )

      setFeedback(payload.message ?? `Claim ${status} successfully.`)
      await loadDashboard({ silent: true })
    } catch (requestError) {
      setFeedback(requestError.payload?.message ?? `Failed to ${status} claim.`)
    } finally {
      setSavingClaimId(null)
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

  const renderPostRows = (posts, emptyMessage) => {
    if (!posts.length) {
      return renderEmpty(emptyMessage, 'document')
    }

    return (
      <div className="admin-pending-table">
        <div className="admin-pending-table-head">
          <span>User</span>
          <span>Post Title</span>
          <span>Type</span>
          <span>Category</span>
          <span>Location</span>
          <span>Date</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {posts.map((post) => (
          <article className="admin-pending-table-row" key={post.id}>
            <div className="admin-pending-user">
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

            <div>
              <strong>{post.title || 'Untitled Post'}</strong>
              <p>{post.content || 'No description provided.'}</p>
            </div>

            <span className={`badge badge-type ${post.post_type === 'lost' ? 'badge-lost' : post.post_type === 'found' ? 'badge-found' : ''}`}>
              {post.post_type}
            </span>
            <span>{post.category?.name || 'General'}</span>
            <span>{post.location || 'Not provided'}</span>
            <span>{formatDate(post.item_date || post.created_at)}</span>
            <span className={`badge badge-status admin-status-badge admin-status-${post.status}`}>
              {post.status}
            </span>

            <div className="admin-pending-actions">
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
            <strong>{card.value}</strong>
            <h3>{card.label}</h3>
            <p>{card.description}</p>
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
              {overview.recent_activity.map((activity) => (
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
      <div className="section-panel-heading">
        <h2>Users</h2>
        <p>Registered members in the FindIt community.</p>
      </div>

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
      <div className="section-panel-heading">
        <h2>Claims</h2>
        <p>Ownership requests submitted by community members.</p>
      </div>

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
                <span>{claim.item?.user?.name ? `Owner: ${claim.item.user.name}` : 'Owner unavailable'}</span>
                {claim.status === 'pending' ? (
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="quick-action-button admin-inline-button"
                      disabled={savingClaimId === claim.id}
                      onClick={() => void handleClaimUpdate(claim.id, 'approved')}
                    >
                      {savingClaimId === claim.id ? 'Saving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="secondary-action-button admin-inline-button admin-reject-button"
                      disabled={savingClaimId === claim.id}
                      onClick={() => void handleClaimUpdate(claim.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
                {claim.status === 'approved' ? (
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="quick-action-button admin-inline-button"
                      disabled={savingClaimId === claim.id}
                      onClick={() => void handleClaimUpdate(claim.id, 'returned')}
                    >
                      {savingClaimId === claim.id ? 'Saving...' : 'Mark Returned'}
                    </button>
                  </div>
                ) : null}
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
      <div className="section-panel-heading">
        <h2>Contact Messages</h2>
        <p>Review support requests, triage their status, and resolve completed conversations.</p>
      </div>

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
      <div className="section-panel-heading">
        <h2>Notifications</h2>
        <p>Latest admin-facing updates from across the platform.</p>
      </div>

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
            <div className="section-panel-heading">
              <h2>Pending Posts</h2>
              <p>Only submissions waiting for moderation appear here.</p>
            </div>
            {renderPostRows(pendingPosts, 'No pending post reviews right now.')}
          </section>
        )
      case 'lost':
        return (
          <section className="dashboard-panel admin-dashboard-panel">
            <div className="section-panel-heading">
              <h2>Lost Items</h2>
              <p>All lost-item posts submitted by the community.</p>
            </div>
            {renderPostRows(lostPosts, 'No lost-item posts found yet.')}
          </section>
        )
      case 'found':
        return (
          <section className="dashboard-panel admin-dashboard-panel">
            <div className="section-panel-heading">
              <h2>Found Items</h2>
              <p>All found-item posts submitted by the community.</p>
            </div>
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
            <div className="admin-dashboard-profile">
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
            </div>

            <button type="button" className="quick-action-button admin-logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-dashboard-main">
        <div className="container admin-dashboard-layout">
          <aside className="admin-dashboard-sidebar">
            <div className="dashboard-panel admin-sidebar-card">
              <h2>Admin Menu</h2>
              <nav className="admin-sidebar-nav" aria-label="Admin sections">
                {sidebarItems.map((item) => (
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
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <section className="admin-dashboard-content">
            <div className="page-header-card admin-dashboard-hero">
              <div>
                <p className="admin-dashboard-eyebrow">Admin Dashboard</p>
                <h1>Admin Dashboard</h1>
                <p>Manage posts, users, claims, and system activity.</p>
              </div>
              <div className="admin-dashboard-hero-badge">
                <Icon name="shield" />
                <span>{loading ? 'Loading data...' : 'Live backend data'}</span>
              </div>
            </div>

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
