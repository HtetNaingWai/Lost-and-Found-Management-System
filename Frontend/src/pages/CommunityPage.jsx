import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CreatePostModal from '../components/CreatePostModal'
import CommunityMap from '../components/CommunityMap'
import CommunityPostCard from '../components/CommunityPostCard'
import PostDetailModal from '../components/PostDetailModal'
import Icon from '../components/Icon'
import RatingModal from '../components/ratings/RatingModal'
import { formatDate } from '../utils/formatDate'
import { resolveImageUrl } from '../utils/imageUrl'
import {
  formatNotificationAbsoluteTime,
  getNotificationCategory,
  getNotificationGroup,
  getNotificationIcon,
  getNotificationMeta,
} from '../utils/notifications'

const communityMenuItems = [
  { key: 'create-post', label: 'Create Post', icon: 'plusCircle' },
  { key: 'my-returns', label: 'My Returns', icon: 'rotateCcw' },
  { key: 'saved-posts', label: 'Saved Posts', icon: 'bookmark' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
]

const reportTabs = [
  { key: 'my-lost', label: 'Lost Reports', icon: 'clipboardList' },
  { key: 'my-found', label: 'Found Reports', icon: 'packageCheck' },
]

const INITIAL_REPORT_COUNT = 5
const notificationTypeFilters = [
  ['all', 'All types'],
  ['messages', 'Messages'],
  ['returns', 'Returns'],
  ['ratings', 'Ratings'],
  ['system', 'System'],
]

function getPostTimestamp(post) {
  return new Date(post.created_at ?? post.createdAt ?? 0).getTime()
}

function normalizeCommunitySection(section) {
  if (section === 'my-posts') return 'my-lost'
  if (section === 'my-claims') return 'my-returns'
  return section || 'feed'
}

function getClaimPost(claim) {
  return claim?.community_post ?? {}
}

function getItemTypeLabel(post) {
  return post?.post_type === 'lost' ? 'Lost Item' : 'Found Item'
}

function getReturnRoleLabels(claim) {
  const post = getClaimPost(claim)
  const isLost = post.post_type === 'lost'

  return {
    itemTypeLabel: getItemTypeLabel(post),
    viewerRoleLabel: isLost ? 'You found this item' : 'You claimed this item',
    creatorRoleLabel: isLost ? 'Owner' : 'Finder',
    participantRoleLabel: isLost ? 'Helper' : 'Owner',
    counterpartRoleLabel: isLost ? 'Owner' : 'Finder',
    counterpartUser: post.user ?? null,
    evidenceLabel: isLost ? 'Return Details' : 'Ownership Evidence',
    messageAction: isLost ? 'Message Owner' : 'Message Finder',
    ratingAction: isLost ? 'Rate Owner' : 'Rate Finder',
  }
}

function ImagePreviewModal({ preview, onClose }) {
  if (!preview) return null

  return (
    <div className="community-image-modal-root" onClick={onClose}>
      <div className="community-image-modal-overlay" />
      <div className="community-image-modal-shell" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-button community-image-close" onClick={onClose}>
          <Icon name="close" />
        </button>
        <img className="community-image-modal-image" src={preview.src} alt={preview.alt} />
      </div>
    </div>
  )
}

function CommunityMenuCard({
  activeSection,
  onSelectSection,
  onOpenCreatePost,
  notifications,
  savedCount,
}) {
  const createPostItem = communityMenuItems.find((item) => item.key === 'create-post')
  const secondaryMenuItems = communityMenuItems.filter((item) => item.key !== 'create-post')

  return (
    <aside className="community-side-card">
      <div className="community-side-header">
        <h2>Community Menu</h2>
      </div>
      <div className="community-side-list">
        {createPostItem ? (
          <button
            type="button"
            className={`community-side-item${activeSection === createPostItem.key ? ' is-active' : ''}`}
            onClick={onOpenCreatePost}
          >
            <span className="community-side-item-icon">
              <Icon name={createPostItem.icon} />
            </span>
            <span>{createPostItem.label}</span>
          </button>
        ) : null}
        <div className={`community-side-report-group${['my-lost', 'my-found'].includes(activeSection) ? ' is-active' : ''}`}>
          <button
            type="button"
            className={`community-side-item community-side-report-trigger${['my-lost', 'my-found'].includes(activeSection) ? ' is-active' : ''}`}
            onClick={() => onSelectSection('my-lost')}
          >
            <span className="community-side-item-icon">
              <Icon name="clipboardList" />
            </span>
            <span>My Reports</span>
          </button>
          <div className="community-side-tabs" aria-label="My Reports tabs">
            {reportTabs.map((tab) => (
              <button
                type="button"
                key={tab.key}
                className={`community-side-tab${activeSection === tab.key ? ' is-active' : ''}`}
                onClick={() => onSelectSection(tab.key)}
              >
                <Icon name={tab.icon} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {secondaryMenuItems.map((item) => {
          const isActive = activeSection === item.key

          return (
            <button
              type="button"
              key={item.key}
              className={`community-side-item${isActive ? ' is-active' : ''}`}
              onClick={() => {
                if (item.key === 'create-post') {
                  onOpenCreatePost()
                  return
                }

                onSelectSection(item.key)
              }}
            >
              <span className="community-side-item-icon">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
              {item.key === 'saved-posts' ? <small>{savedCount}</small> : null}
              {item.key === 'notifications' && notifications.length > 0 ? <small>{notifications.length}</small> : null}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function ContentPanel({ title, subtitle, children }) {
  return (
    <section className="community-panel">
      <div className="community-panel-heading">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

function PlaceholderPanel({ title, subtitle, children }) {
  return (
    <ContentPanel title={title} subtitle={subtitle}>
      <div className="community-placeholder-card">{children}</div>
    </ContentPanel>
  )
}

function ClaimItemImage({ post }) {
  const imageUrl = resolveImageUrl(post?.image_url ?? post?.imageUrl ?? post?.image)

  return (
    <div className="claim-card-image">
      {imageUrl ? (
        <img src={imageUrl} alt={post?.title || 'Claim item'} />
      ) : (
        <Icon name="inventory" />
      )}
    </div>
  )
}

function ClaimTimeline({ claim }) {
  const isFound = claim?.community_post?.post_type === 'found'
  const steps = [
    [isFound ? 'Claim submitted' : 'Request sent', Boolean(claim.created_at)],
    ['Arranging return', ['pending', 'approved', 'returned'].includes(claim.status)],
    ['Returned', claim.status === 'returned'],
  ]

  return (
    <div className="claim-timeline">
      {steps.map(([label, active]) => (
        <span key={label} className={`claim-timeline-step${active ? ' is-active' : ''}`}>
          <i />
          {label}
        </span>
      ))}
    </div>
  )
}

function ClaimDetailModal({ claim, user, onClose, onEdit, onStartMessage }) {
  if (!claim) return null

  const post = getClaimPost(claim)
  const role = getReturnRoleLabels(claim)
  const counterpart = role.counterpartUser ?? {}
  const participant = claim.user ?? user ?? {}
  const canEdit = claim.status === 'pending'
  const canMessageCounterpart = ['pending', 'approved', 'returned'].includes(claim.status)
    && counterpart.id
    && counterpart.id !== user?.id

  return (
    <div className="community-modal-root" onClick={onClose}>
      <div className="community-modal-overlay" />
      <div className="community-modal-shell">
        <section className="community-modal-card claim-detail-modal" onClick={(event) => event.stopPropagation()}>
          <div className="community-modal-top">
            <div>
              <h2>Claim / Return Details</h2>
              <p>Review the item, people involved, and current return status.</p>
            </div>
            <button type="button" className="modal-close-button" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>

          <div className="claim-detail-layout">
            <ClaimItemImage post={post} />
            <div className="claim-detail-copy">
              <span className={`badge badge-type ${post.post_type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                {role.itemTypeLabel}
              </span>
              <h3>{post.title || 'Claimed item'}</h3>
              <p>{post.content || 'No item description provided.'}</p>
              <div className="claim-detail-meta">
                <span>{post.category?.name || 'General'}</span>
                <span>{post.location || 'No location provided'}</span>
                <span>{role.creatorRoleLabel}: {counterpart.name || 'Unknown user'}</span>
              </div>
            </div>
          </div>

          <div className="claim-people-grid">
            <div className="claim-person-card">
              <strong>{role.creatorRoleLabel}</strong>
              <span>{counterpart.name || 'Unknown user'}</span>
            </div>
            <div className="claim-person-card">
              <strong>{role.participantRoleLabel}</strong>
              <span>{participant.name || 'You'}</span>
            </div>
          </div>

          <div className="claim-info-grid">
            <div className="post-detail-meta-card claim-info-wide">
              <strong>{role.evidenceLabel}</strong>
              <span>{claim.proof_description}</span>
            </div>
            <div className="post-detail-meta-card">
              <strong>Submitted</strong>
              <span>{formatDate(claim.created_at)}</span>
            </div>
            <div className="post-detail-meta-card">
              <strong>Status</strong>
              <span className={`badge badge-status badge-${claim.status}`}>{claim.status}</span>
            </div>
          </div>

          <ClaimTimeline claim={claim} />

          {claim.reviewed_at ? <p className="settings-note">Reviewed {formatDate(claim.reviewed_at)}</p> : null}
          {claim.returned_at ? <p className="settings-note">Returned {formatDate(claim.returned_at)}</p> : null}
          {claim.admin_note ? <p className="settings-note"><strong>Admin Note:</strong> {claim.admin_note}</p> : null}

          <div className="community-modal-actions">
            <button type="button" className="secondary-action-button" onClick={onClose}>
              Close
            </button>
            {canEdit ? (
              <button type="button" className="quick-action-button" onClick={() => onEdit(claim)}>
                Edit Return
              </button>
            ) : null}
            {canMessageCounterpart ? (
              <button type="button" className="quick-action-button" onClick={() => onStartMessage?.(counterpart, post)}>
                {role.messageAction}
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

function ConfirmReturnModal({ claim, onClose, onConfirm, saving }) {
  if (!claim) return null

  const title = claim.community_post?.title || 'this item'

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
                await onConfirm(claim)
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

function ClaimEditModal({ claim, onClose, onSubmit, saving }) {
  const [values, setValues] = useState({
    proof_description: claim?.proof_description ?? '',
    contact_phone: claim?.contact_phone ?? '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    setValues({
      proof_description: claim?.proof_description ?? '',
      contact_phone: claim?.contact_phone ?? '',
    })
    setError('')
  }, [claim])

  if (!claim) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!values.proof_description.trim() || !values.contact_phone.trim()) {
      setError('Please provide claim details and a contact phone.')
      return
    }

    try {
      await onSubmit(claim.id, {
        proof_description: values.proof_description.trim(),
        contact_phone: values.contact_phone.trim(),
      })
      onClose()
    } catch (requestError) {
      setError(requestError.payload?.message ?? 'Failed to update claim.')
    }
  }

  return (
    <div className="community-modal-root" onClick={onClose}>
      <div className="community-modal-overlay" />
      <div className="community-modal-shell">
        <section className="community-modal-card claim-detail-modal" onClick={(event) => event.stopPropagation()}>
          <div className="community-modal-top">
            <div>
              <h2>Edit Return</h2>
              <p>Update your details while this return is still pending.</p>
            </div>
            <button type="button" className="modal-close-button" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-form-grid">
              <label className="profile-form-field profile-form-field-full">
                <span>Ownership Evidence / Identifying Details</span>
                <textarea
                  rows="5"
                  value={values.proof_description}
                  onChange={(event) => setValues((current) => ({ ...current, proof_description: event.target.value }))}
                />
              </label>
              <label className="profile-form-field profile-form-field-full">
                <span>Contact Phone</span>
                <input
                  value={values.contact_phone}
                  onChange={(event) => setValues((current) => ({ ...current, contact_phone: event.target.value }))}
                />
              </label>
            </div>
            {error ? <p className="settings-feedback is-error">{error}</p> : null}
            <div className="community-modal-actions">
              <button type="button" className="secondary-action-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="quick-action-button" disabled={saving}>
                {saving ? 'Saving...' : 'Save Return'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

function WithdrawClaimModal({ claim, onClose, onConfirm, saving }) {
  if (!claim) return null

  return (
    <div className="community-modal-root" onClick={onClose}>
      <div className="community-modal-overlay" />
      <div className="community-modal-shell">
        <section className="community-modal-card claim-confirm-modal" onClick={(event) => event.stopPropagation()}>
          <div className="community-modal-top">
            <div>
              <h2>Withdraw Return?</h2>
              <p>This will remove your pending return request before the item handoff is completed.</p>
            </div>
            <button type="button" className="modal-close-button" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
          <div className="community-modal-actions">
            <button type="button" className="secondary-action-button" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="quick-action-button claim-danger-button"
              disabled={saving}
              onClick={async () => {
                await onConfirm(claim)
                onClose()
              }}
            >
              {saving ? 'Withdrawing...' : 'Withdraw Return'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function CommunityPage({
  user,
  token,
  categories,
  posts,
  myPosts,
  myClaims = [],
  onCreatePost,
  onNavigate,
  notifications,
  onNotificationClick,
  onStartMessage,
  onSubmitClaim,
  onUpdateClaim,
  onWithdrawClaim,
  onMarkClaimReturned,
  savingClaimId = null,
  submittingClaim = false,
  savedPostsState,
  onDeletePost,
  onUpdatePost,
  deletingPostId = null,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [createPostType, setCreatePostType] = useState('lost')
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [editingClaim, setEditingClaim] = useState(null)
  const [withdrawingClaim, setWithdrawingClaim] = useState(null)
  const [returningClaim, setReturningClaim] = useState(null)
  const [ratingClaim, setRatingClaim] = useState(null)
  const [ratedClaimIds, setRatedClaimIds] = useState(() => new Set())
  const [imagePreview, setImagePreview] = useState(null)
  const [reportsExpanded, setReportsExpanded] = useState(false)
  const [notificationStatusFilter, setNotificationStatusFilter] = useState('all')
  const [notificationTypeFilter, setNotificationTypeFilter] = useState('all')
  const [activeSection, setActiveSection] = useState(normalizeCommunitySection(searchParams.get('section')))
  const reportsRef = useRef(null)
  const mapRef = useRef(null)
  const navigate = useNavigate()
  const {
    savedPosts = [],
    isSaved = () => false,
    toggleSaved = () => {},
    loadingSavedPosts = false,
    savingPostId = null,
    savedFeedback = '',
    savedError = '',
  } = savedPostsState ?? {}

  const hasSubmittedRating = (claim) => Boolean(claim?.rating_submitted || ratedClaimIds.has(claim?.id))
  const canRateClaim = (claim) => (
    claim?.status === 'returned'
    && !hasSubmittedRating(claim)
    && (claim?.can_rate ?? true)
  )

  useEffect(() => {
    setActiveSection(normalizeCommunitySection(searchParams.get('section')))
  }, [searchParams])

  const orderedPosts = useMemo(
    () =>
      [...posts].sort(
        (left, right) =>
          getPostTimestamp(right) - getPostTimestamp(left),
      ),
    [posts],
  )

  const publicReportPosts = useMemo(
    () =>
      orderedPosts.filter((post) => {
        const postType = post.post_type ?? post.type
        const status = post.status ?? 'pending'

        return ['lost', 'found'].includes(postType)
          && !['rejected', 'returned', 'completed'].includes(status)
      }),
    [orderedPosts],
  )

  const [homeSearchQuery] = useState('')

  const searchedPublicReportPosts = useMemo(() => {
    const query = homeSearchQuery.trim().toLowerCase()

    if (!query) return publicReportPosts

    return publicReportPosts.filter((post) => (
      [
        post.title,
        post.content,
        post.description,
        post.location,
        post.category?.name,
        post.user?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    ))
  }, [homeSearchQuery, publicReportPosts])

  const visibleReportPosts = useMemo(
    () =>
      reportsExpanded
        ? searchedPublicReportPosts
        : searchedPublicReportPosts.slice(0, INITIAL_REPORT_COUNT),
    [reportsExpanded, searchedPublicReportPosts],
  )

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const statusMatches = notificationStatusFilter === 'all' || !notification.read
      const typeMatches = notificationTypeFilter === 'all'
        || getNotificationCategory(notification) === notificationTypeFilter

      return statusMatches && typeMatches
    })
  }, [notificationStatusFilter, notificationTypeFilter, notifications])

  const groupedNotifications = useMemo(() => {
    return filteredNotifications.reduce((groups, notification) => {
      const group = getNotificationGroup(notification)
      groups[group] = [...(groups[group] ?? []), notification]
      return groups
    }, {})
  }, [filteredNotifications])

  const orderedMyPosts = useMemo(
    () =>
      [...myPosts].sort(
        (left, right) =>
          getPostTimestamp(right) - getPostTimestamp(left),
      ),
    [myPosts],
  )

  const myFoundPosts = useMemo(
    () => orderedMyPosts.filter((post) => (post.post_type ?? post.type) === 'found'),
    [orderedMyPosts],
  )

  const myLostPosts = useMemo(
    () => orderedMyPosts.filter((post) => (post.post_type ?? post.type) === 'lost'),
    [orderedMyPosts],
  )

  const closePostModal = () => {
    setIsModalOpen(false)
    setEditingPost(null)
    setCreatePostType('lost')
  }

  const openCreatePost = (postType = 'lost') => {
    setEditingPost(null)
    setCreatePostType(postType)
    setIsModalOpen(true)
  }

  const openPublicProfile = (profileUser) => {
    if (!profileUser?.id) return
    navigate(`/users/${profileUser.id}`)
  }

  const renderFeed = (feedPosts, { allowDelete = false, allowEdit = false } = {}) => (
    <div className="community-feed">
      {feedPosts.length > 0 ? (
        feedPosts.map((post) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            isSaved={isSaved(post.id)}
            onToggleSave={toggleSaved}
            savingSave={savingPostId === post.id}
            canEdit={allowEdit && post.user?.id === user?.id}
            onEdit={(editablePost) => {
              setEditingPost(editablePost)
              setIsModalOpen(true)
            }}
            canDelete={allowDelete && post.user?.id === user?.id}
            onDelete={onDeletePost}
            deleting={deletingPostId === post.id}
            onClick={() => setSelectedPost(post)}
            onImageClick={(src, alt) => setImagePreview({ src, alt })}
            onUserProfileClick={openPublicProfile}
          />
        ))
      ) : (
        <div className="community-empty-state">
          <strong>No posts to show yet.</strong>
          <p>Create a post or switch to another section.</p>
        </div>
      )}
    </div>
  )

  const renderPublicReports = () => (
    <div ref={reportsRef} className="community-reports-section">
      <div className="community-reports-heading">
        <h2>Community Reports</h2>
        <p>Latest lost and found activity from members.</p>
      </div>
      {renderFeed(visibleReportPosts)}
      {searchedPublicReportPosts.length > INITIAL_REPORT_COUNT ? (
        <div className="community-view-all-row">
          <button
            type="button"
            className="community-view-all-button"
            onClick={() => {
              setReportsExpanded((current) => {
                const next = !current

                if (!next) {
                  window.requestAnimationFrame(() => {
                    reportsRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  })
                }

                return next
              })
            }}
          >
            <span>{reportsExpanded ? 'Show Less' : 'View All Reports'}</span>
            <Icon name={reportsExpanded ? 'chevronUp' : 'chevronDown'} />
          </button>
        </div>
      ) : null}
    </div>
  )

  const renderCommunityHome = () => (
    <div className="community-home-page">
      <div ref={mapRef}>
        <CommunityMap
          posts={searchedPublicReportPosts}
          onViewDetails={(post) => setSelectedPost(post)}
          eyebrow="Community Map"
          title="Interactive Lost & Found Map"
          subtitle="Find lost and found items by location."
          showControls
        />
      </div>

      {renderPublicReports()}
    </div>
  )

  const renderClaimActions = (claim) => {
    const isPending = claim.status === 'pending'
    const role = getReturnRoleLabels(claim)
    const counterpart = role.counterpartUser

    return (
      <div className="claim-card-actions">
        <button type="button" className="secondary-action-button" onClick={() => setSelectedClaim(claim)}>
          View Details
        </button>
        {isPending ? (
          <button type="button" className="secondary-action-button" onClick={() => setEditingClaim(claim)}>
            Edit
          </button>
        ) : null}
        {isPending ? (
          <button
            type="button"
            className="secondary-action-button community-delete-action"
            onClick={() => setWithdrawingClaim(claim)}
          >
            Withdraw Return
          </button>
        ) : null}
        {['pending', 'approved', 'returned'].includes(claim.status) && counterpart?.id ? (
          <button
            type="button"
            className="secondary-action-button"
            onClick={() => onStartMessage?.(counterpart, claim.community_post)}
          >
            {role.messageAction}
          </button>
        ) : null}
        {claim.status === 'returned' && hasSubmittedRating(claim) ? (
          <button type="button" className="secondary-action-button" disabled>
            Review submitted
          </button>
        ) : canRateClaim(claim) ? (
          <button
            type="button"
            className="secondary-action-button"
            onClick={() => setRatingClaim(claim)}
          >
            {role.ratingAction}
          </button>
        ) : null}
      </div>
    )
  }

  const renderClaimCard = (claim) => {
    const post = getClaimPost(claim)
    const role = getReturnRoleLabels(claim)

    return (
      <article className="claim-card" key={claim.id}>
        <ClaimItemImage post={post} />
        <div className="claim-card-copy">
          <div className="claim-card-heading">
            <div>
              <h3>{post.title || 'Claimed item'}</h3>
              <p>{role.itemTypeLabel} • {role.viewerRoleLabel}</p>
            </div>
            <span className={`badge badge-status badge-${claim.status}`}>
              {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
            </span>
          </div>
          <p className="claim-card-evidence">
            {role.counterpartRoleLabel}: {role.counterpartUser?.name || 'Unknown user'}
          </p>
          <p className="claim-card-evidence">{claim.proof_description}</p>
          <div className="claim-card-meta">
            <span>{post.category?.name || 'General'}</span>
            <span>{post.location || 'No location provided'}</span>
            <span>Submitted {formatDate(claim.created_at)}</span>
            {claim.reviewed_at ? <span>Reviewed {formatDate(claim.reviewed_at)}</span> : null}
            {claim.returned_at ? <span>Returned {formatDate(claim.returned_at)}</span> : null}
          </div>
          {claim.admin_note ? <p className="settings-note"><strong>Admin Note:</strong> {claim.admin_note}</p> : null}
          {renderClaimActions(claim)}
        </div>
      </article>
    )
  }

  const renderMyFoundCard = (post) => {
    const claims = Array.isArray(post.claims) ? post.claims : []
    const canManagePost = post.status !== 'returned' && post.user?.id === user?.id

    return (
      <div className="my-found-history-card" key={post.id}>
        <CommunityPostCard
          post={post}
          isSaved={isSaved(post.id)}
          onToggleSave={toggleSaved}
          savingSave={savingPostId === post.id}
          canEdit={canManagePost}
          onEdit={(editablePost) => {
            setEditingPost(editablePost)
            setCreatePostType('found')
            setIsModalOpen(true)
          }}
          canDelete={canManagePost}
          onDelete={onDeletePost}
          deleting={deletingPostId === post.id}
          onClick={() => setSelectedPost(post)}
          onImageClick={(src, alt) => setImagePreview({ src, alt })}
          onUserProfileClick={openPublicProfile}
        />

        <div className="my-found-claim-summary">
          <strong>
            {claims.length > 0
              ? `${claims.length} incoming claim${claims.length === 1 ? '' : 's'}`
              : 'No claims received yet'}
          </strong>
          <span>
            {claims.length > 0
              ? 'Review claimant details and coordinate the return safely.'
              : 'Claims from possible owners will appear here.'}
          </span>
        </div>

        {claims.length > 0 ? (
          <div className="my-found-claims">
            {claims.map((claim) => (
              <article className="my-found-claim-row" key={claim.id}>
                <div>
                  {claim.user?.id ? (
                    <button
                      type="button"
                      className="inline-profile-link my-found-claim-name"
                      onClick={() => openPublicProfile(claim.user)}
                    >
                      {claim.user.name || 'Unknown claimant'}
                    </button>
                  ) : (
                    <strong>{claim.user?.name || 'Unknown claimant'}</strong>
                  )}
                  <p>{claim.proof_description || 'No evidence provided.'}</p>
                  <small>{claim.contact_phone || 'No phone'} • {formatDate(claim.created_at)}</small>
                </div>
                <div className="my-found-claim-actions">
                  <span className={`badge badge-status badge-${claim.status}`}>
                    {claim.status}
                  </span>
                  {claim.user?.id ? (
                    <button
                      type="button"
                      className="secondary-action-button"
                      onClick={() => onStartMessage?.(claim.user, post)}
                    >
                      Message
                    </button>
                  ) : null}
                  {['pending', 'approved'].includes(claim.status) ? (
                    <button
                      type="button"
                      className="quick-action-button admin-inline-button"
                      disabled={savingClaimId === claim.id}
                      onClick={() => setReturningClaim({ ...claim, community_post: post })}
                    >
                      {savingClaimId === claim.id ? 'Saving...' : 'Mark as Returned'}
                    </button>
                  ) : null}
                  {claim.status === 'returned' && hasSubmittedRating(claim) ? (
                    <button type="button" className="secondary-action-button" disabled>
                      Review submitted
                    </button>
                  ) : canRateClaim(claim) ? (
                    <button
                      type="button"
                      className="secondary-action-button"
                      onClick={() => setRatingClaim({ ...claim, community_post: post })}
                    >
                      Rate Owner
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  const renderMyLostCard = (post) => {
    const returnedClaim = Array.isArray(post.claims)
      ? post.claims.find((claim) => claim.status === 'returned')
      : null

    return (
      <div className="my-lost-history-card" key={post.id}>
        <CommunityPostCard
          post={post}
          isSaved={isSaved(post.id)}
          onToggleSave={toggleSaved}
          savingSave={savingPostId === post.id}
          canEdit={post.status !== 'returned' && post.user?.id === user?.id}
          onEdit={(editablePost) => {
            setEditingPost(editablePost)
            setIsModalOpen(true)
          }}
          canDelete={post.status !== 'returned' && post.user?.id === user?.id}
          onDelete={onDeletePost}
          deleting={deletingPostId === post.id}
          onClick={() => setSelectedPost(post)}
          onImageClick={(src, alt) => setImagePreview({ src, alt })}
          onUserProfileClick={openPublicProfile}
        />
        {post.status === 'returned' && returnedClaim ? (
          <div className="claim-card-actions my-lost-return-actions">
            <span className="badge badge-status badge-returned">
              Returned{returnedClaim.returned_at ? ` ${formatDate(returnedClaim.returned_at)}` : ''}
            </span>
            {hasSubmittedRating(returnedClaim) ? (
              <button type="button" className="secondary-action-button" disabled>
                Review submitted
              </button>
            ) : canRateClaim(returnedClaim) ? (
              <button
                type="button"
                className="secondary-action-button"
                onClick={() => setRatingClaim({ ...returnedClaim, community_post: post })}
              >
                Rate Helper
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'my-posts':
      case 'my-lost':
        return (
          <ContentPanel
            title="Lost Reports"
            subtitle="Track the lost items you have reported and their current status."
          >
            {myLostPosts.length > 0 ? (
              <div className="community-feed">
                {myLostPosts.map(renderMyLostCard)}
              </div>
            ) : (
              <div className="community-empty-state">
                <strong>No lost items reported yet.</strong>
                <p>When you report a lost item, it will appear here.</p>
                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={() => {
                    setEditingPost(null)
                    setIsModalOpen(true)
                  }}
                >
                  Report Lost Item
                </button>
              </div>
            )}
          </ContentPanel>
        )
      case 'my-found':
        return (
          <ContentPanel
            title="Found Reports"
            subtitle="Review your found item reports and incoming claims from other members."
          >
            {myFoundPosts.length > 0 ? (
              <div className="my-found-list">
                {myFoundPosts.map(renderMyFoundCard)}
              </div>
            ) : (
              <div className="community-empty-state">
                <strong>No found items yet.</strong>
                <p>Create a found item post when you discover something that should be returned.</p>
              </div>
            )}
          </ContentPanel>
        )
      case 'saved-posts':
        return (
          <ContentPanel
            title="Saved Posts"
            subtitle="Posts you bookmarked for quick access."
          >
            {loadingSavedPosts ? (
              <div className="community-empty-state">
                <strong>Loading saved posts...</strong>
                <p>Your bookmarked posts will appear here shortly.</p>
              </div>
            ) : renderFeed(savedPosts)}
          </ContentPanel>
        )
      case 'my-returns':
        return (
          <PlaceholderPanel
            title="My Returns"
            subtitle="Track items you are helping return or collecting from other members."
          >
            {myClaims.length > 0 ? (
              <div className="community-claim-list">
                {myClaims.map(renderClaimCard)}
              </div>
            ) : (
              <div className="community-empty-state">
                <strong>No returns yet.</strong>
                <p>Items you help return or collect from other members will appear here.</p>
              </div>
            )}
          </PlaceholderPanel>
        )
      case 'notifications':
        return (
          <ContentPanel
            title="Notifications"
            subtitle="Review account updates, return activity, ratings, and messages."
          >
            <div className="notifications-page-shell">
              <div className="notifications-page-toolbar">
                <div className="notification-filter-group" aria-label="Notification status">
                  {['all', 'unread'].map((status) => (
                    <button
                      type="button"
                      key={status}
                      className={`notification-filter-pill${notificationStatusFilter === status ? ' is-active' : ''}`}
                      onClick={() => setNotificationStatusFilter(status)}
                    >
                      {status === 'all' ? 'All' : 'Unread'}
                    </button>
                  ))}
                </div>

                <div className="notification-filter-group" aria-label="Notification type">
                  {notificationTypeFilters.map(([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      className={`notification-filter-pill${notificationTypeFilter === key ? ' is-active' : ''}`}
                      onClick={() => setNotificationTypeFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredNotifications.length > 0 ? (
                <div className="notifications-page-list">
                  {['Today', 'Yesterday', 'Earlier'].map((group) => (
                    groupedNotifications[group]?.length ? (
                      <section className="notifications-group" key={group}>
                        <h3>{group}</h3>
                        <div className="notifications-group-list">
                          {groupedNotifications[group].map((notification) => (
                            <button
                              type="button"
                              key={notification.id}
                              className={`notifications-page-row${notification.read ? '' : ' is-unread'}`}
                              onClick={() => onNotificationClick?.(notification)}
                            >
                              <span className={`notification-page-icon notification-icon-${notification.type}`}>
                                <Icon name={getNotificationIcon(notification)} />
                              </span>
                              <span className="notification-page-copy">
                                <strong>
                                  {notification.title}
                                  {!notification.read ? <i aria-hidden="true" /> : null}
                                </strong>
                                <span>{notification.detail}</span>
                                <small>{getNotificationMeta(notification)}</small>
                              </span>
                              <time>{formatNotificationAbsoluteTime(notification)}</time>
                            </button>
                          ))}
                        </div>
                      </section>
                    ) : null
                  ))}
                </div>
              ) : (
                <div className="notification-page-empty">
                  <Icon name="bell" />
                  <strong>
                    {notificationStatusFilter === 'unread' ? 'No unread notifications' : "You're all caught up"}
                  </strong>
                  <p>
                    {notificationStatusFilter === 'unread'
                      ? 'Unread alerts will appear here as soon as there is something new.'
                      : 'Messages, return updates, ratings, and system alerts will appear here.'}
                  </p>
                </div>
              )}
            </div>
          </ContentPanel>
        )
      case 'feed':
      default:
        return renderCommunityHome()
    }
  }

  return (
    <>
      <section className="dashboard-section community-layout-section">
        <div className="container">
          <div className="community-layout-grid">
            <CommunityMenuCard
              activeSection={activeSection}
              onSelectSection={(section) => {
                if (section === 'messages') {
                  onNavigate('messages')
                  return
                }

                setActiveSection(section)
                setSearchParams(section === 'feed' ? {} : { section })
              }}
              onOpenCreatePost={() => {
                openCreatePost('lost')
              }}
              notifications={notifications}
              savedCount={savedPosts.length}
            />

            <div className="community-main-column">
              {savedFeedback || savedError ? (
                <p className={`settings-feedback${savedError ? ' is-error' : ''}`}>
                  {savedError || savedFeedback}
                </p>
              ) : null}
              {renderSection()}
            </div>
          </div>
        </div>
      </section>

      <CreatePostModal
        open={isModalOpen}
        onClose={closePostModal}
        token={token}
        categories={categories}
        onCreatePost={onCreatePost}
        onUpdatePost={onUpdatePost}
        mode={editingPost ? 'edit' : 'create'}
        post={editingPost}
        initialPostType={createPostType}
      />

      <PostDetailModal
        post={selectedPost}
        user={user}
        onClose={() => setSelectedPost(null)}
        onStartMessage={(targetUser, relatedPost) => {
          setSelectedPost(null)
          onStartMessage?.(targetUser, relatedPost)
        }}
        onUserProfileClick={(profileUser) => {
          setSelectedPost(null)
          openPublicProfile(profileUser)
        }}
        existingClaim={myClaims.find((claim) => claim.community_post?.id === selectedPost?.id)}
        onSubmitClaim={onSubmitClaim}
        onMarkClaimReturned={onMarkClaimReturned}
        submittingClaim={submittingClaim}
        savingClaimId={savingClaimId}
        isSaved={selectedPost ? isSaved(selectedPost.id) : false}
        onToggleSave={selectedPost ? () => toggleSaved(selectedPost) : undefined}
        savingSave={selectedPost ? savingPostId === selectedPost.id : false}
      />
      <ClaimDetailModal
        claim={selectedClaim}
        user={user}
        onClose={() => setSelectedClaim(null)}
        onEdit={(claim) => {
          setSelectedClaim(null)
          setEditingClaim(claim)
        }}
        onStartMessage={(targetUser, relatedPost) => {
          setSelectedClaim(null)
          onStartMessage?.(targetUser, relatedPost)
        }}
      />
      <ClaimEditModal
        claim={editingClaim}
        onClose={() => setEditingClaim(null)}
        onSubmit={onUpdateClaim}
        saving={editingClaim ? savingClaimId === editingClaim.id : false}
      />
      <WithdrawClaimModal
        claim={withdrawingClaim}
        onClose={() => setWithdrawingClaim(null)}
        onConfirm={onWithdrawClaim}
        saving={withdrawingClaim ? savingClaimId === withdrawingClaim.id : false}
      />
      <ConfirmReturnModal
        claim={returningClaim}
        onClose={() => setReturningClaim(null)}
        onConfirm={onMarkClaimReturned}
        saving={returningClaim ? savingClaimId === returningClaim.id : false}
      />
      <RatingModal
        open={Boolean(ratingClaim)}
        claim={ratingClaim}
        token={token}
        onClose={() => setRatingClaim(null)}
        onSuccess={(payload) => {
          const claimId = payload.rating?.claim_id ?? ratingClaim?.id
          if (!claimId) return

          setRatedClaimIds((current) => new Set([...current, claimId]))
        }}
      />
      <ImagePreviewModal preview={imagePreview} onClose={() => setImagePreview(null)} />
    </>
  )
}

export default CommunityPage
