import { useEffect, useMemo, useRef, useState } from 'react'
import DashboardNavbar from '../components/DashboardNavbar'
import Icon from '../components/Icon'
import CommunityPage from './CommunityPage'
import PostDetailModal from '../components/PostDetailModal'
import {
  adminDashboardMenuItems,
  adminProfileDropdownItems,
  dashboardMenuItems,
  profileDropdownItems,
} from '../utils/constants'
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

function ItemsPage({ type, items, user, onStartMessage }) {
  const [selectedPost, setSelectedPost] = useState(null)
  const filtered = items.filter((item) => (item.post_type ?? item.type)?.toLowerCase() === type)

  return (
    <>
      <PageShell
        title={type === 'lost' ? 'Lost Items' : 'Found Items'}
        subtitle={`Showing approved ${type} item listings visible to users.`}
      >
        <div className="recent-items-grid">
          {filtered.map((item) => (
            <article
              className="recent-item-card recent-item-card-interactive"
              key={`${item.id}-${item.title}`}
              onClick={() => setSelectedPost(item)}
            >
              <div className="recent-item-image-wrap">
                {item.image_url || item.image ? (
                  <img src={item.image_url || item.image} alt={item.title} />
                ) : (
                  <div className="recent-item-image-placeholder">
                    <Icon name={type === 'lost' ? 'search' : 'inventory'} />
                  </div>
                )}
                <div className="recent-item-hover">
                  <span className="quick-action-button recent-item-hover-button">View Details</span>
                </div>
              </div>
              <div className="recent-item-body">
                <div className="recent-item-badges">
                  <span className={`badge badge-type ${type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                    {(item.post_type ?? item.type).charAt(0).toUpperCase() + (item.post_type ?? item.type).slice(1)}
                  </span>
                  <span className={`badge badge-status badge-${item.status.toLowerCase()}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p className="recent-item-copy">{item.content ?? item.description}</p>
                <p className="recent-item-meta">
                  <Icon name="pin" />
                  <span>{item.location}</span>
                </p>
                <p className="recent-item-date">{formatDate(item.item_date || item.date)}</p>
                <p className="recent-item-submeta">
                  {item.category?.name || 'General'} · Posted by {item.user?.name || 'Unknown user'}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageShell>

      <PostDetailModal
        post={selectedPost}
        user={user}
        onClose={() => setSelectedPost(null)}
        onStartMessage={(targetUser, relatedPost) => {
          setSelectedPost(null)
          onStartMessage?.(targetUser, relatedPost)
        }}
      />
    </>
  )
}

function ReportItemsPage({ token, categories, myItems, onItemSubmitted }) {
  const [selectedType, setSelectedType] = useState('lost')
  const [values, setValues] = useState({
    category_id: '',
    title: '',
    location: '',
    item_date: '',
    description: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cards = [
    {
      type: 'lost',
      title: 'Report Lost Item',
      description:
        'Use this if you lost something and want the community to help find it.',
      button: 'Start Lost Report',
      icon: 'search',
    },
    {
      type: 'found',
      title: 'Report Found Item',
      description:
        'Use this if you found something and want to return it to the owner.',
      button: 'Start Found Report',
      icon: 'inventory',
    },
  ]

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('type', selectedType)
    formData.append('category_id', values.category_id)
    formData.append('title', values.title)
    formData.append('location', values.location)
    formData.append('item_date', values.item_date)
    formData.append('description', values.description)

    if (imageFile) {
      formData.append('image', imageFile)
    }

    try {
      const payload = await apiRequest('/items', {
        method: 'POST',
        token,
        body: formData,
      })

      onItemSubmitted(payload.item)
      setSuccess(payload.message)
      setValues({
        category_id: '',
        title: '',
        location: '',
        item_date: '',
        description: '',
      })
      setImageFile(null)
    } catch (requestError) {
      setError(requestError.payload?.message ?? 'Failed to submit item report.')
    } finally {
      setSubmitting(false)
    }
  }

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
            <button
              type="button"
              className="quick-action-button"
              onClick={() => {
                setSelectedType(card.type)
                setSuccess('')
                setError('')
              }}
            >
              {card.button}
            </button>
          </article>
        ))}
      </div>

      <section className="dashboard-panel report-form-panel">
        <div className="section-panel-heading">
          <h2>{selectedType === 'lost' ? 'Lost Item Form' : 'Found Item Form'}</h2>
          <p>Complete the details below. Your submission will appear in the admin control panel for review.</p>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            <label className="profile-form-field">
              <span>Category</span>
              <select name="category_id" value={values.category_id} onChange={handleChange}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="profile-form-field">
              <span>Item Title</span>
              <input name="title" value={values.title} onChange={handleChange} />
            </label>
            <label className="profile-form-field">
              <span>Location</span>
              <input name="location" value={values.location} onChange={handleChange} />
            </label>
            <label className="profile-form-field">
              <span>Date</span>
              <input name="item_date" type="date" value={values.item_date} onChange={handleChange} />
            </label>
            <label className="profile-form-field profile-form-field-full">
              <span>Description</span>
              <textarea
                name="description"
                rows="5"
                value={values.description}
                onChange={handleChange}
              />
            </label>
            <label className="profile-form-field profile-form-field-full">
              <span>Image</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {error ? <p className="settings-feedback is-error">{error}</p> : null}
          {success ? <p className="settings-feedback is-success">{success}</p> : null}

          <div className="profile-form-actions">
            <button type="submit" className="quick-action-button" disabled={submitting}>
              {submitting ? 'Submitting...' : selectedType === 'lost' ? 'Submit Lost Item' : 'Submit Found Item'}
            </button>
          </div>
        </form>
      </section>

      <section className="dashboard-panel">
        <div className="section-panel-heading">
          <h2>My Recent Reports</h2>
          <p>Your latest submitted items and their review status.</p>
        </div>
        <div className="admin-list">
          {myItems.length > 0 ? (
            myItems.slice(0, 5).map((item) => (
              <article className="admin-list-item" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.location}</p>
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
            ))
          ) : (
            <div className="settings-note">No reports submitted yet.</div>
          )}
        </div>
      </section>
    </PageShell>
  )
}

function MessagesPage({
  user,
  conversations,
  activeConversation,
  messages,
  contactUsers,
  onOpenConversation,
  onSendMessage,
  sendingMessage,
  loadingConversation,
  messageError,
}) {
  const [draftMessage, setDraftMessage] = useState('')

  useEffect(() => {
    setDraftMessage('')
  }, [activeConversation?.participant?.id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!activeConversation?.participant?.id || !draftMessage.trim()) return

    await onSendMessage(activeConversation.participant.id, draftMessage.trim())
    setDraftMessage('')
  }

  return (
    <PageShell
      title="Messages"
      subtitle="Contact other community members and continue your item conversations."
    >
      <div className="messages-layout">
        <section className="dashboard-panel messages-sidebar">
          <div className="section-panel-heading">
            <h2>Inbox</h2>
            <p>Your direct conversations with other users.</p>
          </div>

          <div className="messages-conversation-list">
            {conversations.length > 0 ? (
              conversations.map((conversation) => {
                const participant = conversation.participant
                const latestMessage = conversation.latest_message
                return (
                  <button
                    type="button"
                    key={participant.id}
                    className={`messages-conversation-item${activeConversation?.participant?.id === participant.id ? ' is-active' : ''}`}
                    onClick={() => onOpenConversation(participant)}
                  >
                    <span className="profile-avatar">
                      {participant.profile_image_url ? (
                        <img src={participant.profile_image_url} alt={participant.name} />
                      ) : (
                        participant.name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="messages-conversation-copy">
                      <strong>{participant.name}</strong>
                      <small>{latestMessage?.message || 'Start a new conversation'}</small>
                    </span>
                    <span className="messages-conversation-meta">
                      <span>
                        {latestMessage?.created_at
                          ? formatDate(latestMessage.created_at, { month: 'short', day: 'numeric' })
                          : 'New'}
                      </span>
                      {conversation.unread_count > 0 ? (
                        <span className="messages-unread-chip">{conversation.unread_count}</span>
                      ) : null}
                    </span>
                  </button>
                )
              })
            ) : (
              <div className="settings-note">No conversations yet. Start by messaging a community member.</div>
            )}
          </div>

          <div className="section-panel-heading messages-suggested-heading">
            <h2>People to Contact</h2>
            <p>Start a conversation with members from the community feed.</p>
          </div>
          <div className="messages-contact-grid">
            {contactUsers.map((contact) => (
              <button
                type="button"
                key={contact.id}
                className="messages-contact-card"
                onClick={() => onOpenConversation(contact)}
              >
                <span className="profile-avatar">
                  {contact.profile_image_url ? (
                    <img src={contact.profile_image_url} alt={contact.name} />
                  ) : (
                    contact.name.charAt(0).toUpperCase()
                  )}
                </span>
                <strong>{contact.name}</strong>
                <small>{contact.email}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-panel messages-thread-panel">
          {activeConversation ? (
            <>
              <div className="messages-thread-header">
                <div className="messages-thread-user">
                  <span className="profile-avatar">
                    {activeConversation.participant.profile_image_url ? (
                      <img src={activeConversation.participant.profile_image_url} alt={activeConversation.participant.name} />
                    ) : (
                      activeConversation.participant.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div>
                    <strong>{activeConversation.participant.name}</strong>
                    <p>{activeConversation.participant.email}</p>
                  </div>
                </div>
              </div>

              {messageError ? <p className="settings-feedback is-error">{messageError}</p> : null}

              <div className="messages-thread-list">
                {loadingConversation ? (
                  <div className="settings-note">Loading conversation...</div>
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const isOwn = message.sender?.id === user.id
                    return (
                      <article
                        className={`message-bubble${isOwn ? ' is-own' : ''}`}
                        key={message.id}
                      >
                        <p>{message.message}</p>
                        <span>{formatDate(message.created_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      </article>
                    )
                  })
                ) : (
                  <div className="settings-note">No messages yet. Say hello to start the conversation.</div>
                )}
              </div>

              <form className="messages-composer" onSubmit={handleSubmit}>
                <textarea
                  rows="3"
                  placeholder={`Write a message to ${activeConversation.participant.name}...`}
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                />
                <div className="messages-composer-actions">
                  <button type="submit" className="quick-action-button" disabled={sendingMessage || !draftMessage.trim()}>
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="messages-empty-thread">
              <h2>Select a conversation</h2>
              <p>Choose a conversation from the inbox or start one with a community member.</p>
            </div>
          )}
        </section>
      </div>
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

function ProfilePage({ user, token, onUserUpdate }) {
  const [profileValues, setProfileValues] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    nrc_no: user.nrc_no || '',
  })
  const [passwordValues, setPasswordValues] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [photoSuccess, setPhotoSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current_password: false,
    password: false,
    password_confirmation: false,
  })
  const photoInputRef = useRef(null)

  useEffect(() => {
    setProfileValues({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      nrc_no: user.nrc_no || '',
    })
  }, [user])

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfileValues((current) => ({ ...current, [name]: value }))
    setProfileError('')
    setProfileSuccess('')
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordValues((current) => ({ ...current, [name]: value }))
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setSavingInfo(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      const payload = await apiRequest('/profile', {
        method: 'PATCH',
        token,
        body: profileValues,
      })

      onUserUpdate(payload.user)
      setProfileSuccess(payload.message)
    } catch (error) {
      setProfileError(error.payload?.message ?? 'Failed to update profile information.')
    } finally {
      setSavingInfo(false)
    }
  }

  const handlePhotoPick = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const formData = new FormData()
    formData.append('profile_image', file)

    setSavingPhoto(true)
    setPhotoError('')
    setPhotoSuccess('')

    try {
      const payload = await apiRequest('/profile/photo', {
        method: 'POST',
        token,
        body: formData,
      })

      onUserUpdate(payload.user)
      setPhotoSuccess(payload.message)
    } catch (error) {
      setPhotoError(error.payload?.errors?.profile_image?.[0] ?? error.payload?.message ?? 'Failed to update profile image.')
    } finally {
      setSavingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    setSavingPhoto(true)
    setPhotoError('')
    setPhotoSuccess('')

    try {
      const payload = await apiRequest('/profile/photo', {
        method: 'DELETE',
        token,
      })

      onUserUpdate(payload.user)
      setPhotoSuccess(payload.message)
    } catch (error) {
      setPhotoError(error.payload?.message ?? 'Failed to remove profile image.')
    } finally {
      setSavingPhoto(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setSavingPassword(true)
    setPasswordError('')
    setPasswordSuccess('')

    try {
      const payload = await apiRequest('/profile/password', {
        method: 'PATCH',
        token,
        body: passwordValues,
      })

      setPasswordSuccess(payload.message)
      setPasswordValues({
        current_password: '',
        password: '',
        password_confirmation: '',
      })
    } catch (error) {
      const errors = error.payload?.errors ?? {}
      setPasswordError(
        errors.current_password?.[0]
          ?? errors.password?.[0]
          ?? error.payload?.message
          ?? 'Failed to update password.',
      )
    } finally {
      setSavingPassword(false)
    }
  }

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
              <input
                ref={photoInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                hidden
                onChange={handlePhotoPick}
              />
              <button
                type="button"
                className="quick-action-button"
                onClick={() => photoInputRef.current?.click()}
                disabled={savingPhoto}
              >
                {savingPhoto ? 'Saving...' : 'Upload / Change Image'}
              </button>
              <button
                type="button"
                className="secondary-action-button"
                onClick={handleRemovePhoto}
                disabled={savingPhoto || !user.profile_image_url}
              >
                Remove Image
              </button>
            </div>
          </div>
          {photoError ? <p className="settings-feedback is-error">{photoError}</p> : null}
          {photoSuccess ? <p className="settings-feedback is-success">{photoSuccess}</p> : null}
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Personal Information</h2>
            <p>Review and update your account details.</p>
          </div>
          <form className="profile-form" onSubmit={handleSaveProfile}>
            <div className="profile-form-grid">
              <label className="profile-form-field">
                <span>Name</span>
                <input
                  name="name"
                  value={profileValues.name}
                  onChange={handleProfileChange}
                />
              </label>
              <label className="profile-form-field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  value={profileValues.email}
                  onChange={handleProfileChange}
                />
              </label>
              <label className="profile-form-field">
                <span>Phone</span>
                <input
                  name="phone"
                  value={profileValues.phone}
                  onChange={handleProfileChange}
                />
              </label>
              <label className="profile-form-field">
                <span>NRC Number</span>
                <input
                  name="nrc_no"
                  value={profileValues.nrc_no}
                  onChange={handleProfileChange}
                />
              </label>
            </div>

            {profileError ? <p className="settings-feedback is-error">{profileError}</p> : null}
            {profileSuccess ? <p className="settings-feedback is-success">{profileSuccess}</p> : null}

            <div className="profile-form-actions">
              <button type="submit" className="quick-action-button" disabled={savingInfo}>
                {savingInfo ? 'Saving...' : 'Save Information'}
              </button>
            </div>
          </form>
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>NRC Photos</h2>
            <p>Your registered identity photos for account verification.</p>
          </div>
          <div className="nrc-photo-grid">
            <div className="nrc-photo-card">
              <strong>NRC Front</strong>
              {user.nrc_front_photo_url ? (
                <img src={user.nrc_front_photo_url} alt="NRC front" className="nrc-photo-image" />
              ) : (
                <div className="nrc-photo-empty">No front photo uploaded.</div>
              )}
            </div>
            <div className="nrc-photo-card">
              <strong>NRC Back</strong>
              {user.nrc_back_photo_url ? (
                <img src={user.nrc_back_photo_url} alt="NRC back" className="nrc-photo-image" />
              ) : (
                <div className="nrc-photo-empty">No back photo uploaded.</div>
              )}
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Security / Change Password</h2>
            <p>Keep your FindIt account secure.</p>
          </div>
          <form className="profile-form" onSubmit={handlePasswordSubmit}>
            <div className="profile-form-grid">
              <label className="profile-form-field">
                <span>Old Password</span>
                <div className="profile-password-shell">
                  <input
                    name="current_password"
                    type={showPasswords.current_password ? 'text' : 'password'}
                    value={passwordValues.current_password}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() =>
                      setShowPasswords((current) => ({
                        ...current,
                        current_password: !current.current_password,
                      }))}
                  >
                    <Icon name={showPasswords.current_password ? 'eyeOff' : 'eye'} />
                  </button>
                </div>
              </label>
              <label className="profile-form-field">
                <span>New Password</span>
                <div className="profile-password-shell">
                  <input
                    name="password"
                    type={showPasswords.password ? 'text' : 'password'}
                    value={passwordValues.password}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() =>
                      setShowPasswords((current) => ({
                        ...current,
                        password: !current.password,
                      }))}
                  >
                    <Icon name={showPasswords.password ? 'eyeOff' : 'eye'} />
                  </button>
                </div>
              </label>
              <label className="profile-form-field">
                <span>Confirm New Password</span>
                <div className="profile-password-shell">
                  <input
                    name="password_confirmation"
                    type={showPasswords.password_confirmation ? 'text' : 'password'}
                    value={passwordValues.password_confirmation}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() =>
                      setShowPasswords((current) => ({
                        ...current,
                        password_confirmation: !current.password_confirmation,
                      }))}
                  >
                    <Icon name={showPasswords.password_confirmation ? 'eyeOff' : 'eye'} />
                  </button>
                </div>
              </label>
            </div>

            {passwordError ? <p className="settings-feedback is-error">{passwordError}</p> : null}
            {passwordSuccess ? <p className="settings-feedback is-success">{passwordSuccess}</p> : null}

            <div className="profile-form-actions">
              <button type="submit" className="quick-action-button" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
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
              <button type="button" className="quick-action-button" onClick={() => onNavigate('admin-lost-items')}>
                Moderate Lost Items
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

function AdminItemsPage({ title, subtitle, items, onUpdateItem, savingItemId }) {
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
      title={title}
      subtitle={subtitle}
    >
      <div className="admin-card-grid">
        {items.length === 0 ? <div className="settings-note">No submitted items found in this section yet.</div> : null}
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
  token,
  onUserUpdate,
  categories,
  communityPosts,
  approvedItems,
  myItems,
  onItemSubmitted,
  notifications,
  messageConversations,
  activeConversation,
  activeConversationMessages,
  contactUsers,
  onOpenConversation,
  onSendMessage,
  sendingMessage,
  loadingConversation,
  messageError,
  onStartMessage,
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
      case 'admin-lost-items':
        return (
          <AdminItemsPage
            title="Lost Item Moderation"
            subtitle="Review and manage lost item reports submitted by the community."
            items={adminItems.filter((item) => item.type === 'lost')}
            onUpdateItem={onUpdateAdminItem}
            savingItemId={savingItemId}
          />
        )
      case 'admin-found-items':
        return (
          <AdminItemsPage
            title="Found Item Moderation"
            subtitle="Review and manage found item reports submitted by the community."
            items={adminItems.filter((item) => item.type === 'found')}
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
        return <ProfilePage user={user} token={token} onUserUpdate={onUserUpdate} />
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
          onStartMessage={onStartMessage}
        />
      )
    case 'lost-items':
      return <ItemsPage type="lost" items={approvedItems} user={user} onStartMessage={onStartMessage} />
    case 'found-items':
      return <ItemsPage type="found" items={approvedItems} user={user} onStartMessage={onStartMessage} />
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
          contactUsers={contactUsers}
          onOpenConversation={onOpenConversation}
          onSendMessage={onSendMessage}
          sendingMessage={sendingMessage}
          loadingConversation={loadingConversation}
          messageError={messageError}
        />
      )
    case 'contact':
      return <ContactPage />
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
  const [activePage, setActivePage] = useState(user.role === 'admin' ? 'dashboard' : 'community')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [communityPosts, setCommunityPosts] = useState([])
  const [approvedItems, setApprovedItems] = useState([])
  const [myItems, setMyItems] = useState([])
  const [messageConversations, setMessageConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [activeConversationMessages, setActiveConversationMessages] = useState([])
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageError, setMessageError] = useState('')
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
  const notificationRef = useRef(null)
  const isAdmin = user.role === 'admin'

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
      try {
        const [categoriesPayload, communityPayload, myPostsPayload, lostPayload, foundPayload, messagesPayload] = await Promise.all([
          apiRequest('/categories', { token }),
          apiRequest('/community-posts', { token }),
          apiRequest('/my-posts', { token }),
          apiRequest('/lost-items', { token }),
          apiRequest('/found-items', { token }),
          apiRequest('/messages', { token }),
        ])

        if (ignore) return

        setCategories(categoriesPayload.categories ?? [])
        setCommunityPosts(communityPayload.posts ?? [])
        setMyItems(myPostsPayload.posts ?? [])
        setApprovedItems([...(lostPayload.posts ?? []), ...(foundPayload.posts ?? [])])
        setMessageConversations(messagesPayload.conversations ?? [])
      } catch {
        if (!ignore) {
          setCategories([])
          setCommunityPosts([])
          setApprovedItems([])
          setMyItems([])
          setMessageConversations([])
        }
      }
    }

    void loadUserData()

    return () => {
      ignore = true
    }
  }, [token])

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
          apiRequest('/admin/community-posts', { token }),
          apiRequest('/admin/contact-messages', { token }),
        ])

        if (ignore) return

        setAdminOverview(overviewPayload)
        setAdminUsers(usersPayload.users ?? [])
        setAdminItems(itemsPayload.posts ?? [])
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
    setNotificationOpen(false)
    setMobileMenuOpen(false)
  }

  const handleOpenConversation = async (participant) => {
    setActivePage('messages')
    setActiveConversation({ participant })
    setLoadingConversation(true)
    setMessageError('')

    try {
      const payload = await apiRequest(`/messages/${participant.id}`, { token })
      setActiveConversation({ participant: payload.participant })
      setActiveConversationMessages(payload.messages ?? [])
      setMessageConversations((current) => {
        const exists = current.some((conversation) => conversation.participant?.id === payload.participant.id)

        if (exists) {
          return current.map((conversation) =>
            conversation.participant?.id === payload.participant.id
              ? {
                  ...conversation,
                  participant: payload.participant,
                  unread_count: 0,
                }
              : conversation,
          )
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

      setActiveConversationMessages((current) => [...current, payload.data])

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
    } catch (error) {
      setMessageError(error.payload?.message ?? 'Failed to send the message.')
      throw error
    } finally {
      setSendingMessage(false)
    }
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
      const payload = await apiRequest(`/admin/community-posts/${itemId}`, {
        method: 'PATCH',
        body: updates,
        token,
      })

      setAdminItems((current) =>
        current.map((item) => (item.id === itemId ? payload.post : item)),
      )
      setAdminOverview((current) =>
        current
          ? {
              ...current,
              recent_items: current.recent_items?.map((item) =>
                item.id === itemId ? payload.post : item,
              ),
            }
          : current,
      )
      setCommunityPosts((current) =>
        current.map((item) => (item.id === itemId ? payload.post : item)),
      )
      setMyItems((current) =>
        current.map((item) => (item.id === itemId ? payload.post : item)),
      )
      setApprovedItems((current) => {
        const nextItems = current.filter((item) => item.id !== itemId)

        if (payload.post.status === 'approved') {
          return [payload.post, ...nextItems]
        }

        return nextItems
      })
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

  const handleItemSubmitted = (item) => {
    setCommunityPosts((current) => [item, ...current])
    setMyItems((current) => [item, ...current])

    if (item.status === 'approved' && ['lost', 'found'].includes(item.post_type ?? item.type)) {
      setApprovedItems((current) => [item, ...current.filter((currentItem) => currentItem.id !== item.id)])
    }
  }

  const menuItems = isAdmin ? adminDashboardMenuItems : dashboardMenuItems
  const dropdownItems = isAdmin ? adminProfileDropdownItems : profileDropdownItems
  const roleLabel = isAdmin ? 'Administrator' : 'Community Member'
  const notifications = useMemo(() => {
    if (isAdmin) {
      return [
        { id: 'admin-review', title: 'New item awaiting review', detail: 'A lost item post is waiting for admin approval.', time: 'Just now' },
        { id: 'admin-message', title: 'Contact message received', detail: 'A resident submitted a new contact form message.', time: '1h ago' },
      ]
    }

    const postNotifications = myItems.slice(0, 2).map((item) => ({
      id: `post-${item.id}`,
      title: item.status === 'approved' ? 'Your post was approved' : item.status === 'rejected' ? 'Your post was rejected' : 'Your post is pending',
      detail: item.title || 'Community post update',
      time: formatDate(item.created_at, { month: 'short', day: 'numeric' }),
    }))

    return [
      ...postNotifications,
      { id: 'message', title: 'Someone sent you a message', detail: 'Check your inbox for the latest community reply.', time: 'Today' },
      { id: 'claim', title: 'Your claim request is pending', detail: 'We will notify you once the review is complete.', time: 'Yesterday' },
    ]
  }, [isAdmin, myItems])
  const unreadNotifications = notifications.length
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

  return (
    <div className="dashboard-page">
      <DashboardNavbar
        user={user}
        activePage={activePage}
        onNavigate={handleNavigate}
        menuItems={menuItems}
        homePageKey={isAdmin ? 'dashboard' : 'community'}
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen((current) => !current)}
        onLogout={onLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
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
          token={token}
          onUserUpdate={onUserUpdate}
          categories={categories}
          communityPosts={communityPosts}
          approvedItems={approvedItems}
          myItems={myItems}
          onItemSubmitted={handleItemSubmitted}
          notifications={notifications}
          messageConversations={messageConversations}
          activeConversation={activeConversation}
          activeConversationMessages={activeConversationMessages}
          contactUsers={contactUsers}
          onOpenConversation={handleOpenConversation}
          onSendMessage={handleSendMessage}
          sendingMessage={sendingMessage}
          loadingConversation={loadingConversation}
          messageError={messageError}
          onStartMessage={handleStartMessage}
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
