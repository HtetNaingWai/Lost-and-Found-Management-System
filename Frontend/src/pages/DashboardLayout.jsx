import { useEffect, useMemo, useRef, useState } from 'react'
import DashboardNavbar from '../components/DashboardNavbar'
import Icon from '../components/Icon'
import {
  adminDashboardMenuItems,
  adminProfileDropdownItems,
  dashboardMenuItems,
  profileDropdownItems,
  recentItems,
  statCards,
} from '../utils/constants'
import { MessagesPreview, MyRecentItems, RecentActivity, StatCard } from '../components/DashboardWidgets'
import { apiRequest } from '../services/api'
import { formatDate } from '../utils/formatDate'

function PageShell({ title, subtitle, children }) {
  return (
    <section className="dashboard-section">
      <div className="container">
        <div className="page-header-card">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

function UserDashboard({ user, onNavigate }) {
  return (
    <>
      <section className="dashboard-hero">
        <div className="container dashboard-hero-grid">
          <div className="dashboard-hero-copy">
            <p className="dashboard-kicker">User Dashboard</p>
            <h1>Welcome back, {user.name}</h1>
            <p>Manage your lost and found activities in one place.</p>
          </div>

          <div className="quick-actions-card">
            <h2>Quick Actions</h2>
            <div className="quick-actions-grid">
              <button type="button" className="quick-action-button" onClick={() => onNavigate('report-items')}>
                Report Lost Item
              </button>
              <button type="button" className="quick-action-button" onClick={() => onNavigate('report-items')}>
                Report Found Item
              </button>
              <button type="button" className="quick-action-button" onClick={() => onNavigate('lost-items')}>
                View Lost Items
              </button>
              <button type="button" className="quick-action-button" onClick={() => onNavigate('found-items')}>
                View Found Items
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="container dashboard-stat-grid">
          {statCards.map((card) => (
            <StatCard card={card} key={card.label} />
          ))}
        </div>
      </section>

      <section className="dashboard-section dashboard-section-panels">
        <div className="container dashboard-panels-grid">
          <RecentActivity />
          <MessagesPreview />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="container">
          <MyRecentItems />
        </div>
      </section>
    </>
  )
}

function CommunityPage() {
  const posts = [
    ['Community Notice', 'Please double-check reports before submitting so admins can review them faster.'],
    ['Neighborhood Update', 'Township volunteers will assist with verified claim handovers this weekend.'],
    ['Safety Reminder', 'Never share sensitive ownership details publicly in post descriptions.'],
  ]

  return (
    <PageShell
      title="Community"
      subtitle="Township announcements, updates, and community recovery posts."
    >
      <div className="simple-card-grid">
        {posts.map(([title, content]) => (
          <article className="simple-info-card" key={title}>
            <h2>{title}</h2>
            <p>{content}</p>
          </article>
        ))}
      </div>
    </PageShell>
  )
}

function ItemsPage({ type }) {
  const filtered = recentItems.filter((item) => item.type.toLowerCase() === type)

  return (
    <PageShell
      title={type === 'lost' ? 'Lost Items' : 'Found Items'}
      subtitle={`Showing approved ${type} item listings visible to users.`}
    >
      <div className="recent-items-grid">
        {filtered.map((item) => (
          <article className="recent-item-card" key={`${item.title}-${item.date}`}>
            <img src={item.image} alt={item.title} />
            <div className="recent-item-body">
              <div className="recent-item-badges">
                <span className={`badge badge-type ${type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                  {item.type}
                </span>
                <span className={`badge badge-status badge-${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>
              <h3>{item.title}</h3>
              <p className="recent-item-meta">
                <Icon name="pin" />
                <span>{item.location}</span>
              </p>
              <p className="recent-item-date">{item.date}</p>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  )
}

function ReportItemsPage() {
  const cards = [
    {
      title: 'Report Lost Item',
      description:
        'Use this if you lost something and want the community to help find it.',
      button: 'Start Lost Report',
      icon: 'search',
    },
    {
      title: 'Report Found Item',
      description:
        'Use this if you found something and want to return it to the owner.',
      button: 'Start Found Report',
      icon: 'inventory',
    },
  ]

  return (
    <PageShell
      title="Report Items"
      subtitle="Choose the correct report type to keep the community informed."
    >
      <div className="report-choice-grid">
        {cards.map((card) => (
          <article className="report-choice-card" key={card.title}>
            <span className="report-choice-icon">
              <Icon name={card.icon} />
            </span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <button type="button" className="quick-action-button">
              {card.button}
            </button>
          </article>
        ))}
      </div>
    </PageShell>
  )
}

function MessagesPage() {
  return (
    <PageShell
      title="Messages"
      subtitle="Your message inbox with the latest community conversations."
    >
      <MessagesPreview />
    </PageShell>
  )
}

function ContactPage() {
  return (
    <PageShell
      title="Contact Us"
      subtitle="Reach out to the FindIt team or submit a township support message."
    >
      <div className="contact-panel">
        <div className="simple-info-card">
          <h2>Community Support</h2>
          <p>Email: support@findit.local</p>
          <p>Phone: +95 9 123 456 789</p>
          <p>Office Hours: Mon to Fri, 9:00 AM to 5:00 PM</p>
        </div>
        <div className="simple-info-card">
          <h2>Contact Form</h2>
          <p>
            This page is ready for the next step where we connect the real contact
            form to the backend `contact_messages` table.
          </p>
        </div>
      </div>
    </PageShell>
  )
}

function ProfilePage({ user }) {
  return (
    <PageShell
      title="User Profile & Settings"
      subtitle="Manage your personal information, profile photo, and account security."
    >
      <div className="profile-settings-grid">
        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Profile Photo</h2>
            <p>Upload or change your profile image.</p>
          </div>
          <div className="profile-photo-panel">
            <div className="profile-photo-large">
              {user.profile_image_url ? (
                <img src={user.profile_image_url} alt={user.name} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="profile-photo-actions">
              <button type="button" className="quick-action-button">
                Upload / Change Image
              </button>
              <button type="button" className="secondary-action-button">
                Remove Image
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Personal Information</h2>
            <p>Review and update your account details.</p>
          </div>
          <div className="settings-list">
            <div>
              <strong>Name</strong>
              <span>{user.name}</span>
            </div>
            <div>
              <strong>Email</strong>
              <span>{user.email}</span>
            </div>
            <div>
              <strong>Phone</strong>
              <span>{user.phone || 'Not set'}</span>
            </div>
            <div>
              <strong>NRC Number</strong>
              <span>{user.nrc_no || 'Not set'}</span>
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Security / Change Password</h2>
            <p>Keep your FindIt account secure.</p>
          </div>
          <div className="settings-note">
            Password change UI can be connected next to a protected backend endpoint.
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Account Status</h2>
            <p>Your current account access status.</p>
          </div>
          <div className="status-chip">Active User Account</div>
        </section>
      </div>
    </PageShell>
  )
}

function AdminDashboardHome({ user, overview, onNavigate }) {
  const adminStats = useMemo(
    () => [
      {
        label: 'Registered Users',
        value: overview?.stats?.total_users ?? 0,
        description: 'Normal community members currently on the platform.',
        icon: 'group',
      },
      {
        label: 'Active Users',
        value: overview?.stats?.active_users ?? 0,
        description: 'Users who can access FindIt right now.',
        icon: 'checkCircle',
      },
      {
        label: 'Pending Items',
        value: overview?.stats?.pending_items ?? 0,
        description: 'Item reports waiting for admin review.',
        icon: 'clock',
      },
      {
        label: 'Approved Items',
        value: overview?.stats?.approved_items ?? 0,
        description: 'Items currently visible to the community.',
        icon: 'shield',
      },
      {
        label: 'Contact Messages',
        value: overview?.stats?.contact_messages ?? 0,
        description: 'Support and contact submissions received.',
        icon: 'mail',
      },
      {
        label: 'New Messages',
        value: overview?.stats?.new_messages ?? 0,
        description: 'Contact messages still awaiting a response.',
        icon: 'chat',
      },
    ],
    [overview],
  )

  return (
    <>
      <section className="dashboard-hero admin-hero">
        <div className="container dashboard-hero-grid">
          <div className="dashboard-hero-copy">
            <p className="dashboard-kicker">Admin Control Center</p>
            <h1>Welcome back, {user.name}</h1>
            <p>
              Review users, moderate submitted items, and manage community contact messages.
            </p>
          </div>

          <div className="quick-actions-card">
            <h2>Admin Actions</h2>
            <div className="quick-actions-grid">
              <button type="button" className="quick-action-button" onClick={() => onNavigate('users')}>
                Review Users
              </button>
              <button type="button" className="quick-action-button" onClick={() => onNavigate('items')}>
                Moderate Items
              </button>
              <button
                type="button"
                className="quick-action-button"
                onClick={() => onNavigate('contact-messages')}
              >
                Open Inbox
              </button>
              <button type="button" className="quick-action-button" onClick={() => onNavigate('profile')}>
                Admin Profile
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="container dashboard-stat-grid">
          {adminStats.map((card) => (
            <StatCard card={card} key={card.label} />
          ))}
        </div>
      </section>

      <section className="dashboard-section dashboard-section-panels">
        <div className="container dashboard-panels-grid admin-overview-grid">
          <section className="dashboard-panel">
            <div className="section-panel-heading">
              <h2>Recent Users</h2>
              <p>Newest accounts that may need review or follow-up.</p>
            </div>
            <div className="admin-list">
              {(overview?.recent_users ?? []).map((recentUser) => (
                <article className="admin-list-item" key={recentUser.id}>
                  <div>
                    <strong>{recentUser.name}</strong>
                    <p>{recentUser.email}</p>
                  </div>
                  <div className="admin-list-meta">
                    <span className={`badge badge-status badge-${recentUser.status?.toLowerCase()}`}>
                      {recentUser.status}
                    </span>
                    <span>{formatDate(recentUser.created_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="section-panel-heading">
              <h2>Latest Contact Messages</h2>
              <p>Recent support requests and community questions.</p>
            </div>
            <div className="admin-list">
              {(overview?.recent_contact_messages ?? []).map((message) => (
                <article className="admin-list-item" key={message.id}>
                  <div>
                    <strong>{message.subject || 'General support request'}</strong>
                    <p>
                      {message.name} · {message.email}
                    </p>
                  </div>
                  <div className="admin-list-meta">
                    <span className={`badge badge-status badge-${message.status?.toLowerCase()}`}>
                      {message.status}
                    </span>
                    <span>{formatDate(message.created_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="container">
          <section className="dashboard-panel">
            <div className="section-panel-heading">
              <h2>Recently Submitted Items</h2>
              <p>Newest community reports requiring monitoring.</p>
            </div>
            <div className="admin-list">
              {(overview?.recent_items ?? []).map((item) => (
                <article className="admin-list-item" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.user?.name || 'Unknown user'} · {item.location}
                    </p>
                  </div>
                  <div className="admin-list-meta">
                    <span className={`badge badge-type ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                      {item.type}
                    </span>
                    <span className={`badge badge-status badge-${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  )
}

function AdminUsersPage({ users, onUpdateUser, savingUserId }) {
  return (
    <PageShell
      title="User Management"
      subtitle="Control user roles, review details, and enable or disable community access."
    >
      <section className="dashboard-panel">
        <div className="admin-table">
          <div className="admin-table-head admin-table-row">
            <span>User</span>
            <span>Contact</span>
            <span>Role</span>
            <span>Status</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>

          {users.map((managedUser) => (
            <div className="admin-table-row" key={managedUser.id}>
              <div className="admin-user-cell">
                <span className="profile-avatar profile-avatar-small">
                  {managedUser.profile_image_url ? (
                    <img src={managedUser.profile_image_url} alt={managedUser.name} />
                  ) : (
                    managedUser.name.charAt(0).toUpperCase()
                  )}
                </span>
                <div>
                  <strong>{managedUser.name}</strong>
                  <p>{managedUser.nrc_no || 'No NRC number'}</p>
                </div>
              </div>
              <div>
                <strong>{managedUser.email}</strong>
                <p>{managedUser.phone || 'No phone number'}</p>
              </div>
              <div>
                <span className={`badge badge-type ${managedUser.role === 'admin' ? 'badge-found' : 'badge-lost'}`}>
                  {managedUser.role}
                </span>
              </div>
              <div>
                <span className={`badge badge-status badge-${managedUser.status?.toLowerCase()}`}>
                  {managedUser.status}
                </span>
              </div>
              <div>{formatDate(managedUser.created_at)}</div>
              <div className="admin-actions">
                {managedUser.role !== 'admin' ? (
                  <button
                    type="button"
                    className="secondary-action-button"
                    onClick={() =>
                      onUpdateUser(managedUser.id, {
                        status: managedUser.status === 'active' ? 'disabled' : 'active',
                      })}
                    disabled={savingUserId === managedUser.id}
                  >
                    {managedUser.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="quick-action-button admin-inline-button"
                  onClick={() =>
                    onUpdateUser(managedUser.id, {
                      role: managedUser.role === 'admin' ? 'user' : 'admin',
                    })}
                  disabled={savingUserId === managedUser.id}
                >
                  {managedUser.role === 'admin' ? 'Make User' : 'Make Admin'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}

function AdminItemsPage({ items, onUpdateItem, savingItemId }) {
  const [drafts, setDrafts] = useState({})

  const updateDraft = (itemId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        status: current[itemId]?.status ?? items.find((item) => item.id === itemId)?.status ?? 'pending',
        admin_note: current[itemId]?.admin_note ?? items.find((item) => item.id === itemId)?.admin_note ?? '',
        [field]: value,
      },
    }))
  }

  return (
    <PageShell
      title="Item Moderation"
      subtitle="Approve, reject, or update item reports submitted by the community."
    >
      <div className="admin-card-grid">
        {items.map((item) => {
          const draft = drafts[item.id] ?? {
            status: item.status,
            admin_note: item.admin_note ?? '',
          }

          return (
            <article className="dashboard-panel admin-item-card" key={item.id}>
              <div className="admin-item-top">
                <div>
                  <div className="recent-item-badges">
                    <span className={`badge badge-type ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                      {item.type}
                    </span>
                    <span className={`badge badge-status badge-${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>
                  <h2>{item.title}</h2>
                  <p>
                    {item.user?.name || 'Unknown user'} · {item.location}
                  </p>
                </div>
                {item.image_url ? <img src={item.image_url} alt={item.title} className="admin-item-image" /> : null}
              </div>

              <p className="admin-item-description">{item.description}</p>

              <div className="settings-list admin-item-meta">
                <div>
                  <strong>Date</strong>
                  <span>{formatDate(item.item_date)}</span>
                </div>
                <div>
                  <strong>Category</strong>
                  <span>{item.category?.name || 'Uncategorized'}</span>
                </div>
                <div>
                  <strong>Approved By</strong>
                  <span>{item.approved_by?.name || 'Not yet approved'}</span>
                </div>
              </div>

              <div className="admin-form-grid">
                <label className="auth-field">
                  <span className="auth-label">Status</span>
                  <span className="admin-select-shell">
                    <select
                      value={draft.status}
                      onChange={(event) => updateDraft(item.id, 'status', event.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="claimed">Claimed</option>
                      <option value="returned">Returned</option>
                    </select>
                  </span>
                </label>

                <label className="auth-field">
                  <span className="auth-label">Admin Note</span>
                  <textarea
                    className="admin-note-input"
                    rows="4"
                    value={draft.admin_note}
                    onChange={(event) => updateDraft(item.id, 'admin_note', event.target.value)}
                  />
                </label>
              </div>

              <div className="admin-actions admin-actions-end">
                <button
                  type="button"
                  className="quick-action-button"
                  onClick={() => onUpdateItem(item.id, draft)}
                  disabled={savingItemId === item.id}
                >
                  {savingItemId === item.id ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </PageShell>
  )
}

function AdminContactMessagesPage({ messages, onUpdateMessage, savingMessageId }) {
  return (
    <PageShell
      title="Contact Messages"
      subtitle="Track community inquiries and update their support status."
    >
      <div className="admin-card-grid">
        {messages.map((message) => (
          <article className="dashboard-panel admin-message-card" key={message.id}>
            <div className="section-panel-heading">
              <h2>{message.subject || 'General support request'}</h2>
              <p>
                {message.name} · {message.email}
                {message.phone ? ` · ${message.phone}` : ''}
              </p>
            </div>

            <p className="admin-message-body">{message.message}</p>

            <div className="admin-message-footer">
              <span className={`badge badge-status badge-${message.status?.toLowerCase()}`}>
                {message.status}
              </span>
              <span>
                {formatDate(message.created_at, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="admin-actions">
              <button
                type="button"
                className="secondary-action-button"
                onClick={() => onUpdateMessage(message.id, { status: 'read' })}
                disabled={savingMessageId === message.id}
              >
                Mark Read
              </button>
              <button
                type="button"
                className="quick-action-button admin-inline-button"
                onClick={() => onUpdateMessage(message.id, { status: 'replied' })}
                disabled={savingMessageId === message.id}
              >
                Mark Replied
              </button>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  )
}

function DashboardContent({
  activePage,
  user,
  onNavigate,
  adminOverview,
  adminUsers,
  adminItems,
  adminMessages,
  onUpdateAdminUser,
  onUpdateAdminItem,
  onUpdateAdminMessage,
  savingUserId,
  savingItemId,
  savingMessageId,
}) {
  if (user.role === 'admin') {
    switch (activePage) {
      case 'users':
        return (
          <AdminUsersPage
            users={adminUsers}
            onUpdateUser={onUpdateAdminUser}
            savingUserId={savingUserId}
          />
        )
      case 'items':
        return (
          <AdminItemsPage
            items={adminItems}
            onUpdateItem={onUpdateAdminItem}
            savingItemId={savingItemId}
          />
        )
      case 'contact-messages':
        return (
          <AdminContactMessagesPage
            messages={adminMessages}
            onUpdateMessage={onUpdateAdminMessage}
            savingMessageId={savingMessageId}
          />
        )
      case 'profile':
        return <ProfilePage user={user} />
      default:
        return (
          <AdminDashboardHome
            user={user}
            overview={adminOverview}
            onNavigate={onNavigate}
          />
        )
    }
  }

  switch (activePage) {
    case 'community':
      return <CommunityPage />
    case 'lost-items':
      return <ItemsPage type="lost" />
    case 'found-items':
      return <ItemsPage type="found" />
    case 'report-items':
      return <ReportItemsPage />
    case 'messages':
      return <MessagesPage />
    case 'contact':
      return <ContactPage />
    case 'profile':
      return <ProfilePage user={user} />
    default:
      return <UserDashboard user={user} onNavigate={onNavigate} />
  }
}

function DashboardLayout({ user, token, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminOverview, setAdminOverview] = useState(null)
  const [adminUsers, setAdminUsers] = useState([])
  const [adminItems, setAdminItems] = useState([])
  const [adminMessages, setAdminMessages] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [savingUserId, setSavingUserId] = useState(null)
  const [savingItemId, setSavingItemId] = useState(null)
  const [savingMessageId, setSavingMessageId] = useState(null)
  const profileRef = useRef(null)
  const isAdmin = user.role === 'admin'

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isAdmin) return undefined

    let ignore = false

    const loadAdminData = async () => {
      setAdminLoading(true)
      setAdminError('')

      try {
        const [overviewPayload, usersPayload, itemsPayload, messagesPayload] = await Promise.all([
          apiRequest('/admin/overview', { token }),
          apiRequest('/admin/users', { token }),
          apiRequest('/admin/items', { token }),
          apiRequest('/admin/contact-messages', { token }),
        ])

        if (ignore) return

        setAdminOverview(overviewPayload)
        setAdminUsers(usersPayload.users ?? [])
        setAdminItems(itemsPayload.items ?? [])
        setAdminMessages(messagesPayload.messages ?? [])
      } catch (error) {
        if (!ignore) {
          setAdminError(error.payload?.message ?? 'Failed to load admin dashboard data.')
        }
      } finally {
        if (!ignore) {
          setAdminLoading(false)
        }
      }
    }

    void loadAdminData()

    return () => {
      ignore = true
    }
  }, [isAdmin, token])

  const handleNavigate = (page) => {
    setActivePage(page)
    setProfileOpen(false)
    setMobileMenuOpen(false)
  }

  const handleUpdateAdminUser = async (userId, updates) => {
    setSavingUserId(userId)

    try {
      const payload = await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: updates,
        token,
      })

      setAdminUsers((current) =>
        current.map((managedUser) => (managedUser.id === userId ? payload.user : managedUser)),
      )
      setAdminOverview((current) =>
        current
          ? {
              ...current,
              recent_users: current.recent_users?.map((managedUser) =>
                managedUser.id === userId ? payload.user : managedUser,
              ),
            }
          : current,
      )
    } finally {
      setSavingUserId(null)
    }
  }

  const handleUpdateAdminItem = async (itemId, updates) => {
    setSavingItemId(itemId)

    try {
      const payload = await apiRequest(`/admin/items/${itemId}`, {
        method: 'PATCH',
        body: updates,
        token,
      })

      setAdminItems((current) =>
        current.map((item) => (item.id === itemId ? payload.item : item)),
      )
      setAdminOverview((current) =>
        current
          ? {
              ...current,
              recent_items: current.recent_items?.map((item) =>
                item.id === itemId ? payload.item : item,
              ),
            }
          : current,
      )
    } finally {
      setSavingItemId(null)
    }
  }

  const handleUpdateAdminMessage = async (messageId, updates) => {
    setSavingMessageId(messageId)

    try {
      const payload = await apiRequest(`/admin/contact-messages/${messageId}`, {
        method: 'PATCH',
        body: updates,
        token,
      })

      setAdminMessages((current) =>
        current.map((message) =>
          message.id === messageId ? payload.contact_message : message,
        ),
      )
      setAdminOverview((current) =>
        current
          ? {
              ...current,
              recent_contact_messages: current.recent_contact_messages?.map((message) =>
                message.id === messageId ? payload.contact_message : message,
              ),
            }
          : current,
      )
    } finally {
      setSavingMessageId(null)
    }
  }

  const menuItems = isAdmin ? adminDashboardMenuItems : dashboardMenuItems
  const dropdownItems = isAdmin ? adminProfileDropdownItems : profileDropdownItems
  const roleLabel = isAdmin ? 'Administrator' : 'Community Member'

  return (
    <div className="dashboard-page">
      <DashboardNavbar
        user={user}
        activePage={activePage}
        onNavigate={handleNavigate}
        menuItems={menuItems}
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen((current) => !current)}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
        profileRef={profileRef}
        dropdownItems={dropdownItems}
        roleLabel={roleLabel}
      />
      <main className="dashboard-main">
        {isAdmin && adminLoading ? (
          <section className="dashboard-section">
            <div className="container">
              <div className="page-header-card">Loading admin dashboard...</div>
            </div>
          </section>
        ) : null}
        {isAdmin && adminError ? (
          <section className="dashboard-section">
            <div className="container">
              <div className="page-header-card admin-error-card">{adminError}</div>
            </div>
          </section>
        ) : null}
        <DashboardContent
          activePage={activePage}
          user={user}
          onNavigate={handleNavigate}
          adminOverview={adminOverview}
          adminUsers={adminUsers}
          adminItems={adminItems}
          adminMessages={adminMessages}
          onUpdateAdminUser={handleUpdateAdminUser}
          onUpdateAdminItem={handleUpdateAdminItem}
          onUpdateAdminMessage={handleUpdateAdminMessage}
          savingUserId={savingUserId}
          savingItemId={savingItemId}
          savingMessageId={savingMessageId}
        />
      </main>
    </div>
  )
}

export default DashboardLayout
