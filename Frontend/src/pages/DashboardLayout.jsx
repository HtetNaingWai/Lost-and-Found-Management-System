import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar'
import Icon from '../components/Icon'
import CommunityPage from './CommunityPage'
import CommunityMap from '../components/CommunityMap'
import LocationPicker from '../components/LocationPicker'
import PostDetailModal from '../components/PostDetailModal'
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

const ITEM_FILTER_CATEGORIES = [
  'Documents',
  'Electronics',
  'Clothing',
  'Bags',
  'Keys',
  'Accessories',
  'Others',
]

function normalizeItemValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function ItemsPage({ type, items, user, onStartMessage, myClaims = [], onSubmitClaim, submittingClaim }) {
  const [selectedPost, setSelectedPost] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const [draftFilters, setDraftFilters] = useState({
    itemType: type,
    category: '',
    location: '',
    date: '',
  })
  const [activeFilters, setActiveFilters] = useState({
    category: '',
    location: '',
    date: '',
  })
  const filterRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    setDraftFilters((current) => ({ ...current, itemType: type }))
  }, [type])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!filterRef.current?.contains(event.target)) {
        setFiltersOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const baseItems = useMemo(
    () => items.filter((item) => normalizeItemValue(item.post_type ?? item.type) === type),
    [items, type],
  )

  const filtered = useMemo(() => {
    const query = normalizeItemValue(searchValue)
    const category = normalizeItemValue(activeFilters.category)
    const location = normalizeItemValue(activeFilters.location)
    const date = activeFilters.date

    return baseItems.filter((item) => {
      const title = normalizeItemValue(item.title)
      const description = normalizeItemValue(item.content ?? item.description)
      const categoryName = normalizeItemValue(item.category?.name)
      const itemLocation = normalizeItemValue(item.location)
      const itemDate = String(item.item_date || item.date || '')

      const matchesSearch = !query || title.includes(query) || description.includes(query)
      const matchesCategory = !category || categoryName === category
      const matchesLocation = !location || itemLocation.includes(location)
      const matchesDate = !date || itemDate === date

      return matchesSearch && matchesCategory && matchesLocation && matchesDate
    })
  }, [activeFilters, baseItems, searchValue])

  const activeFilterCount = [
    activeFilters.category,
    activeFilters.location,
    activeFilters.date,
  ].filter(Boolean).length

  const handleDraftChange = (event) => {
    const { name, value } = event.target
    setDraftFilters((current) => ({ ...current, [name]: value }))
  }

  const handleApplyFilters = () => {
    setActiveFilters({
      category: draftFilters.category,
      location: draftFilters.location,
      date: draftFilters.date,
    })
    setFiltersOpen(false)

    if (draftFilters.itemType !== type) {
      navigate(draftFilters.itemType === 'lost' ? '/lost-items' : '/found-items')
    }
  }

  const handleClearFilters = () => {
    const resetFilters = {
      itemType: type,
      category: '',
      location: '',
      date: '',
    }

    setSearchValue('')
    setDraftFilters(resetFilters)
    setActiveFilters({
      category: '',
      location: '',
      date: '',
    })
    setFiltersOpen(false)
  }

  return (
    <>
      <PageShell
        title={type === 'lost' ? 'Lost Items' : 'Found Items'}
        subtitle={`Showing approved ${type} item listings visible to users.`}
      >
        <section className="items-discovery-panel" aria-label={`${type} item search and filters`}>
          <div className="items-search-row">
            <label className="items-search-box">
              <Icon name="search" />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search lost or found items..."
                aria-label="Search lost or found items"
              />
            </label>

            <div className="items-filter-wrap" ref={filterRef}>
              <button
                type="button"
                className={`items-filter-button${filtersOpen ? ' is-active' : ''}`}
                onClick={() => setFiltersOpen((current) => !current)}
                aria-expanded={filtersOpen}
              >
                <Icon name="sliders" />
                <span>Filters</span>
                {activeFilterCount > 0 ? <small>{activeFilterCount}</small> : null}
              </button>

              {filtersOpen ? (
                <div className="items-filter-popover">
                  <div className="items-filter-popover-heading">
                    <strong>Filter Items</strong>
                    <p>Refine listings and map markers.</p>
                  </div>

                  <div className="items-filter-grid">
                    <label className="items-filter-field">
                      <span>Item Type</span>
                      <select name="itemType" value={draftFilters.itemType} onChange={handleDraftChange}>
                        <option value="lost">Lost</option>
                        <option value="found">Found</option>
                      </select>
                    </label>

                    <label className="items-filter-field">
                      <span>Category</span>
                      <select name="category" value={draftFilters.category} onChange={handleDraftChange}>
                        <option value="">All categories</option>
                        {ITEM_FILTER_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="items-filter-field">
                      <span>Location</span>
                      <input
                        name="location"
                        value={draftFilters.location}
                        onChange={handleDraftChange}
                        placeholder="City, street, or area"
                      />
                    </label>

                    <label className="items-filter-field">
                      <span>Date</span>
                      <input name="date" type="date" value={draftFilters.date} onChange={handleDraftChange} />
                    </label>
                  </div>

                  <div className="items-filter-actions">
                    <button type="button" className="secondary-action-button" onClick={handleClearFilters}>
                      Clear Filters
                    </button>
                    <button type="button" className="quick-action-button" onClick={handleApplyFilters}>
                      Apply Filters
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="items-results-summary">
            <span className="items-results-count">
              <strong>{filtered.length}</strong>
              <span>{filtered.length === 1 ? 'result' : 'results'} found</span>
            </span>

            <div className="items-view-toggle" role="group" aria-label="Choose list or map view">
              <button
                type="button"
                className={`items-view-toggle-button${viewMode === 'list' ? ' is-active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
              >
                <Icon name="grid" />
                <span>List</span>
              </button>
              <button
                type="button"
                className={`items-view-toggle-button${viewMode === 'map' ? ' is-active' : ''}`}
                onClick={() => setViewMode('map')}
                aria-pressed={viewMode === 'map'}
              >
                <Icon name="pin" />
                <span>Map</span>
              </button>
            </div>
          </div>
        </section>

        {viewMode === 'map' ? (
          <CommunityMap
            posts={filtered}
            onViewDetails={setSelectedPost}
            showControls={false}
            compact
            eyebrow={`${type === 'lost' ? 'Lost' : 'Found'} item locations`}
            title={`${type === 'lost' ? 'Lost' : 'Found'} Items Map`}
            subtitle="Map markers update with your search and filters."
          />
        ) : (
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
        )}

        {filtered.length === 0 ? (
          <div className="items-empty-state">
            <strong>No matching items found.</strong>
            <p>Try adjusting your search keyword, category, location, or date filter.</p>
          </div>
        ) : null}
      </PageShell>

      <PostDetailModal
        post={selectedPost}
        user={user}
        onClose={() => setSelectedPost(null)}
        onStartMessage={(targetUser, relatedPost) => {
          setSelectedPost(null)
          onStartMessage?.(targetUser, relatedPost)
        }}
        existingClaim={myClaims.find((claim) => claim.community_post?.id === selectedPost?.id)}
        onSubmitClaim={onSubmitClaim}
        submittingClaim={submittingClaim}
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
    latitude: '',
    longitude: '',
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

    if (!values.location.trim() || !values.latitude || !values.longitude) {
      setError('Please select the item location on the map.')
      setSubmitting(false)
      return
    }

    const formData = new FormData()
    formData.append('post_type', selectedType)
    formData.append('category_id', values.category_id)
    formData.append('title', values.title)
    formData.append('location', values.location)
    formData.append('latitude', values.latitude)
    formData.append('longitude', values.longitude)
    formData.append('item_date', values.item_date)
    formData.append('content', values.description)

    if (imageFile) {
      formData.append('image', imageFile)
    }

    try {
      const payload = await apiRequest('/community-posts', {
        method: 'POST',
        token,
        body: formData,
      })

      onItemSubmitted(payload.post)
      setSuccess(payload.message)
      setValues({
        category_id: '',
        title: '',
        location: '',
        latitude: '',
        longitude: '',
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
            <LocationPicker
              value={{
                location: values.location,
                latitude: values.latitude,
                longitude: values.longitude,
              }}
              onChange={(nextLocation) => {
                setValues((current) => ({ ...current, ...nextLocation }))
                setError('')
                setSuccess('')
              }}
            />
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
    <PageShell
      title="Messages"
      subtitle="Contact other community members and continue your item conversations."
    >
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
    </PageShell>
  )
}

function ConversationList({
  conversations,
  totalConversations,
  searchValue,
  onSearchChange,
  activeParticipantId,
  onlineUserIds,
  onOpenConversation,
}) {
  return (
    <section className="messages-conversation-panel">
      <div className="messages-panel-heading">
        <div>
          <h2>Messages</h2>
          <p>
            {searchValue
              ? `${conversations.length} of ${totalConversations} conversations`
              : `${totalConversations} recent ${totalConversations === 1 ? 'conversation' : 'conversations'}`}
          </p>
        </div>
      </div>

      <label className="messages-search-box">
        <Icon name="search" />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search conversations..."
        />
        {searchValue ? (
          <button type="button" className="messages-search-clear" onClick={() => onSearchChange('')}>
            <Icon name="close" />
          </button>
        ) : null}
      </label>

      <div className="messages-conversation-list">
        {conversations.length > 0 ? (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.participant?.id}
              conversation={conversation}
              isActive={activeParticipantId === conversation.participant?.id}
              isOnline={onlineUserIds.includes(conversation.participant?.id)}
              onClick={() => onOpenConversation(conversation.participant)}
            />
          ))
        ) : (
          <div className="messages-empty-card">
            <strong>No conversations found</strong>
            <span>{searchValue ? 'Try another name or message keyword.' : 'Messages from item owners and claimants will appear here.'}</span>
          </div>
        )}
      </div>
    </section>
  )
}

function ConversationItem({ conversation, isActive, isOnline, onClick }) {
  const participant = conversation.participant
  const latestMessage = conversation.latest_message

  if (!participant) return null

  return (
    <button
      type="button"
      className={`messages-conversation-item${isActive ? ' is-active' : ''}`}
      onClick={onClick}
    >
      <UserAvatar user={participant} isOnline={isOnline} />
      <span className="messages-conversation-copy">
        <span className="messages-conversation-topline">
          <strong>{participant.name}</strong>
          <small>{latestMessage?.created_at ? formatDate(latestMessage.created_at, { hour: 'numeric', minute: '2-digit' }) : 'New'}</small>
        </span>
        <span className="messages-preview">{latestMessage?.message || 'Start a new conversation'}</span>
        <span className={`messages-presence-text${isOnline ? ' is-online' : ''}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </span>
      {conversation.unread_count > 0 ? (
        <span className="messages-unread-chip">{conversation.unread_count}</span>
      ) : null}
    </button>
  )
}

function ChatWindow({
  user,
  activeConversation,
  messages,
  draftMessage,
  onDraftChange,
  onSubmit,
  onBack,
  sendingMessage,
  loadingConversation,
  messageError,
  onlineUserIds,
  typingParticipantId,
  relatedItem,
  threadEndRef,
}) {
  if (!activeConversation) {
    return (
      <section className="messages-chat-panel">
        <div className="messages-empty-thread">
          <span className="messages-empty-icon">
            <Icon name="chat" />
          </span>
          <h2>Select a conversation</h2>
          <p>Choose a recent conversation to continue talking about a lost or found item.</p>
        </div>
      </section>
    )
  }

  const participant = activeConversation.participant
  const isOnline = onlineUserIds.includes(participant.id)

  return (
    <section className="messages-chat-panel">
      <ChatHeader
        participant={participant}
        isOnline={isOnline}
        relatedItem={relatedItem}
        onBack={onBack}
      />

      {messageError ? <p className="settings-feedback is-error messages-error">{messageError}</p> : null}

      <div className="messages-thread-list">
        {loadingConversation ? (
          <MessagesSkeleton />
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender?.id === user.id}
            />
          ))
        ) : (
          <div className="messages-empty-card">
            <strong>No messages yet</strong>
            <span>Send the first message and keep the item details clear.</span>
          </div>
        )}
        {typingParticipantId === participant.id ? (
          <div className="messages-typing-indicator">Typing...</div>
        ) : null}
        <span ref={threadEndRef} aria-hidden="true" />
      </div>

      <MessageComposer
        participantName={participant.name}
        draftMessage={draftMessage}
        onDraftChange={onDraftChange}
        onSubmit={onSubmit}
        sendingMessage={sendingMessage}
      />
    </section>
  )
}

function ChatHeader({ participant, isOnline, relatedItem, onBack }) {
  const itemType = relatedItem?.post_type ?? relatedItem?.type

  return (
    <div className="messages-thread-header">
      <button type="button" className="messages-mobile-back" onClick={onBack}>
        <Icon name="arrowLeft" />
      </button>
      <UserAvatar user={participant} isOnline={isOnline} />
      <div className="messages-thread-title">
        <strong>{participant.name}</strong>
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
      <div className="messages-header-item">
        <span>{itemType ? `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Item` : 'Item context'}</span>
        <strong>{relatedItem?.title || 'No item linked yet'}</strong>
      </div>
    </div>
  )
}

function MessageBubble({ message, isOwn }) {
  return (
    <article className={`message-bubble${isOwn ? ' is-own' : ''}`}>
      <p>{message.message}</p>
      <span>{formatDate(message.created_at, { hour: 'numeric', minute: '2-digit' })}</span>
    </article>
  )
}

function MessageComposer({
  participantName,
  draftMessage,
  onDraftChange,
  onSubmit,
  sendingMessage,
}) {
  return (
    <form className="messages-composer" onSubmit={onSubmit}>
      <button type="button" className="messages-attachment-button" aria-label="Add attachment">
        <Icon name="paperclip" />
      </button>
      <textarea
        rows="1"
        placeholder={`Type your message to ${participantName}...`}
        value={draftMessage}
        onChange={onDraftChange}
      />
      <button type="submit" className="messages-send-button" disabled={sendingMessage || !draftMessage.trim()}>
        <Icon name="send" />
        <span>{sendingMessage ? 'Sending' : 'Send'}</span>
      </button>
    </form>
  )
}

function ItemDetailsSidebar({ relatedItem }) {
  const itemType = relatedItem?.post_type ?? relatedItem?.type
  const imageUrl = relatedItem?.image_url ?? relatedItem?.image

  return (
    <aside className="messages-item-panel">
      <div className="messages-panel-heading">
        <div>
          <h2>Item Details</h2>
          <p>Conversation context</p>
        </div>
      </div>

      {relatedItem ? (
        <>
          <div className="messages-item-image">
            {imageUrl ? (
              <img src={imageUrl} alt={relatedItem.title} />
            ) : (
              <Icon name={itemType === 'lost' ? 'search' : 'inventory'} />
            )}
          </div>

          <div className="messages-item-summary">
            <span className={`badge badge-type ${itemType === 'lost' ? 'badge-lost' : 'badge-found'}`}>
              {itemType || 'item'}
            </span>
            <h3>{relatedItem.title || 'Untitled item'}</h3>
            <p>{relatedItem.content ?? relatedItem.description ?? 'No item description available.'}</p>
          </div>

          <div className="messages-item-facts">
            <ItemFact label="Category" value={relatedItem.category?.name || 'General'} />
            <ItemFact label="Location" value={relatedItem.location || 'Not provided'} />
            <ItemFact label="Date" value={relatedItem.item_date ? formatDate(relatedItem.item_date) : 'Not provided'} />
            <ItemFact label="Status" value={relatedItem.status || 'Pending'} />
          </div>

          <div className="messages-item-actions">
            <button type="button" className="quick-action-button messages-sidebar-action">View Item</button>
            <button type="button" className="secondary-action-button messages-sidebar-action">Mark as Returned</button>
            <button type="button" className="secondary-action-button messages-sidebar-action">Report User</button>
          </div>
        </>
      ) : (
        <div className="messages-empty-card">
          <strong>No item linked</strong>
          <span>Open a conversation from an item post to show context here.</span>
        </div>
      )}
    </aside>
  )
}

function ItemFact({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function UserAvatar({ user, isOnline }) {
  return (
    <span className={`messages-avatar${isOnline ? ' is-online' : ''}`}>
      {user.profile_image_url ? (
        <img src={user.profile_image_url} alt={user.name} />
      ) : (
        user.name?.charAt(0).toUpperCase()
      )}
    </span>
  )
}

function MessagesSkeleton() {
  return (
    <div className="messages-skeleton-list">
      {[0, 1, 2, 3].map((item) => (
        <span className={`messages-skeleton-row${item % 2 ? ' is-own' : ''}`} key={item} />
      ))}
    </div>
  )
}

function ContactPage({ user, token }) {
  return (
    <PageShell
      title="Contact Us"
      subtitle="Send a support request to the FindIt team and track it through the admin support inbox."
    >
      <div className="contact-support-layout">
        <section className="contact-support-card">
          <span className="contact-support-icon">
            <Icon name="mail" />
          </span>
          <h2>Community Support</h2>
          <p>Use this channel for account issues, item reports, claims, and safety concerns.</p>
          <div className="contact-support-details">
            <div>
              <strong>Email</strong>
              <span>support@findit.local</span>
            </div>
            <div>
              <strong>Phone</strong>
              <span>+95 9 123 456 789</span>
            </div>
            <div>
              <strong>Office Hours</strong>
              <span>Mon to Fri, 9:00 AM to 5:00 PM</span>
            </div>
          </div>
        </section>

        <ContactForm user={user} token={token} />
      </div>
    </PageShell>
  )
}

function ContactForm({ user, token }) {
  const [values, setValues] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSuccess('')
  }

  const validate = () => {
    const nextErrors = {}

    if (!values.name.trim()) nextErrors.name = 'Name is required.'
    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!values.subject.trim()) nextErrors.subject = 'Subject is required.'
    if (!values.message.trim()) nextErrors.message = 'Message is required.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccess('')

    if (!validate()) return

    setSubmitting(true)

    try {
      const payload = await apiRequest('/contact-messages', {
        method: 'POST',
        token,
        body: {
          name: values.name.trim(),
          email: values.email.trim(),
          subject: values.subject.trim(),
          message: values.message.trim(),
        },
      })

      setSuccess(payload.message ?? 'Your support message was submitted successfully.')
      setValues((current) => ({
        ...current,
        subject: '',
        message: '',
      }))
    } catch (error) {
      setErrors({
        form: error.payload?.message ?? 'Failed to submit your support message.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="contact-form-card">
      <div className="section-panel-heading">
        <h2>Send a Support Message</h2>
        <p>The admin team will receive your request in the Contact Messages inbox.</p>
      </div>

      <form className="profile-form contact-form" onSubmit={handleSubmit}>
        <div className="profile-form-grid">
          <label className="profile-form-field">
            <span>Name</span>
            <input name="name" value={values.name} onChange={handleChange} />
            {errors.name ? <small className="field-error">{errors.name}</small> : null}
          </label>

          <label className="profile-form-field">
            <span>Email</span>
            <input name="email" type="email" value={values.email} onChange={handleChange} />
            {errors.email ? <small className="field-error">{errors.email}</small> : null}
          </label>

          <label className="profile-form-field profile-form-field-full">
            <span>Subject</span>
            <input name="subject" value={values.subject} onChange={handleChange} />
            {errors.subject ? <small className="field-error">{errors.subject}</small> : null}
          </label>

          <label className="profile-form-field profile-form-field-full">
            <span>Message</span>
            <textarea
              name="message"
              rows="7"
              value={values.message}
              onChange={handleChange}
              placeholder="Describe what happened and include any item, claim, or account details that can help."
            />
            {errors.message ? <small className="field-error">{errors.message}</small> : null}
          </label>
        </div>

        {errors.form ? <p className="settings-feedback is-error">{errors.form}</p> : null}
        {success ? <p className="settings-feedback is-success">{success}</p> : null}

        <div className="profile-form-actions">
          <button type="submit" className="quick-action-button" disabled={submitting}>
            {submitting ? 'Sending...' : 'Submit Message'}
          </button>
        </div>
      </form>
    </section>
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
    </div>
  )
}

export default DashboardLayout
