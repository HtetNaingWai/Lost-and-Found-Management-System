import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CreatePostModal from '../components/CreatePostModal'
import CommunityMap from '../components/CommunityMap'
import CommunityPostCard from '../components/CommunityPostCard'
import PostDetailModal from '../components/PostDetailModal'
import Icon from '../components/Icon'
import { formatDate } from '../utils/formatDate'
import { resolveImageUrl } from '../utils/imageUrl'

const communityMenuItems = [
  { key: 'create-post', label: 'Create Post', icon: 'plusSquare' },
  { key: 'my-posts', label: 'My Posts', icon: 'document' },
  { key: 'my-found', label: 'My Found', icon: 'inventory' },
  { key: 'my-claims', label: 'My Claims', icon: 'clipboard' },
  { key: 'saved-posts', label: 'Saved Posts', icon: 'bookmark' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
]

const INITIAL_REPORT_COUNT = 5

function getPostTimestamp(post) {
  return new Date(post.created_at ?? post.createdAt ?? 0).getTime()
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
  return (
    <aside className="community-side-card">
      <div className="community-side-header">
        <h2>Community Menu</h2>
      </div>
      <div className="community-side-list">
        {communityMenuItems.map((item) => {
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
  const steps = [
    ['Submitted', Boolean(claim.created_at)],
    ['Finder Review', ['pending', 'approved', 'returned'].includes(claim.status)],
    ['Direct Handoff', ['pending', 'approved', 'returned'].includes(claim.status)],
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

  const post = claim.community_post ?? {}
  const finder = post.user ?? {}
  const canEdit = claim.status === 'pending'
  const canMessageFinder = ['pending', 'approved', 'returned'].includes(claim.status) && finder.id && finder.id !== user?.id

  return (
    <div className="community-modal-root" onClick={onClose}>
      <div className="community-modal-overlay" />
      <div className="community-modal-shell">
        <section className="community-modal-card claim-detail-modal" onClick={(event) => event.stopPropagation()}>
          <div className="community-modal-top">
            <div>
              <h2>Claim Details</h2>
              <p>Review your claim, item context, and return status.</p>
            </div>
            <button type="button" className="modal-close-button" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>

          <div className="claim-detail-layout">
            <ClaimItemImage post={post} />
            <div className="claim-detail-copy">
              <span className={`badge badge-type ${post.post_type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                {(post.post_type || 'found').charAt(0).toUpperCase() + (post.post_type || 'found').slice(1)}
              </span>
              <h3>{post.title || 'Claimed item'}</h3>
              <p>{post.content || 'No item description provided.'}</p>
              <div className="claim-detail-meta">
                <span>{post.category?.name || 'General'}</span>
                <span>{post.location || 'No location provided'}</span>
                <span>Finder: {finder.name || 'Unknown user'}</span>
              </div>
            </div>
          </div>

          <div className="claim-info-grid">
            <div className="post-detail-meta-card">
              <strong>Ownership Evidence</strong>
              <span>{claim.proof_description}</span>
            </div>
            <div className="post-detail-meta-card">
              <strong>Contact Phone</strong>
              <span>{claim.contact_phone}</span>
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
                Edit Claim
              </button>
            ) : null}
            {canMessageFinder ? (
              <button type="button" className="quick-action-button" onClick={() => onStartMessage?.(finder, post)}>
                Message Finder
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

  const title = claim.community_post?.title || 'this found item'

  return (
    <div className="community-modal-root" onClick={onClose}>
      <div className="community-modal-overlay" />
      <div className="community-modal-shell">
        <section className="community-modal-card claim-confirm-modal" onClick={(event) => event.stopPropagation()}>
          <div className="community-modal-top">
            <div>
              <h2>Confirm Return</h2>
              <p>Confirm that {title} has been returned to the claimant.</p>
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
              {saving ? 'Saving...' : 'Confirm Return'}
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
              <h2>Edit Claim</h2>
              <p>Update your evidence while this claim is still pending.</p>
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
                {saving ? 'Saving...' : 'Save Claim'}
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
              <h2>Withdraw Claim?</h2>
              <p>This will remove your pending claim before the finder completes the return.</p>
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
              {saving ? 'Withdrawing...' : 'Withdraw Claim'}
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
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [editingClaim, setEditingClaim] = useState(null)
  const [withdrawingClaim, setWithdrawingClaim] = useState(null)
  const [returningClaim, setReturningClaim] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [reportsExpanded, setReportsExpanded] = useState(false)
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'feed')
  const reportsRef = useRef(null)
  const {
    savedPosts = [],
    isSaved = () => false,
    toggleSaved = () => {},
    loadingSavedPosts = false,
    savingPostId = null,
    savedFeedback = '',
    savedError = '',
  } = savedPostsState ?? {}

  useEffect(() => {
    setActiveSection(searchParams.get('section') || 'feed')
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
        return post.status === 'approved' && ['community', 'lost', 'found'].includes(postType)
      }),
    [orderedPosts],
  )

  const visibleReportPosts = useMemo(
    () =>
      reportsExpanded
        ? publicReportPosts
        : publicReportPosts.slice(0, INITIAL_REPORT_COUNT),
    [publicReportPosts, reportsExpanded],
  )

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

  const closePostModal = () => {
    setIsModalOpen(false)
    setEditingPost(null)
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
      {renderFeed(visibleReportPosts)}
      {publicReportPosts.length > INITIAL_REPORT_COUNT ? (
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

  const renderClaimActions = (claim) => {
    const isPending = claim.status === 'pending'

    return (
      <div className="claim-card-actions">
        <button type="button" className="secondary-action-button" onClick={() => setSelectedClaim(claim)}>
          View
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
            Withdraw Claim
          </button>
        ) : null}
        {['pending', 'approved', 'returned'].includes(claim.status) && claim.community_post?.user?.id ? (
          <button
            type="button"
            className="secondary-action-button"
            onClick={() => onStartMessage?.(claim.community_post.user, claim.community_post)}
          >
            Message Finder
          </button>
        ) : null}
      </div>
    )
  }

  const renderClaimCard = (claim) => {
    const post = claim.community_post ?? {}

    return (
      <article className="claim-card" key={claim.id}>
        <ClaimItemImage post={post} />
        <div className="claim-card-copy">
          <div className="claim-card-heading">
            <div>
              <h3>{post.title || 'Claimed item'}</h3>
              <p>{post.category?.name || 'General'} • {post.location || 'No location provided'}</p>
            </div>
            <span className={`badge badge-status badge-${claim.status}`}>
              {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
            </span>
          </div>
          <p className="claim-card-evidence">{claim.proof_description}</p>
          <div className="claim-card-meta">
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

    return (
      <article className="my-found-card" key={post.id}>
        <div className="my-found-summary">
          <ClaimItemImage post={post} />
          <div>
            <span className="badge badge-found">Found</span>
            <h3>{post.title || 'Found item'}</h3>
            <p>{post.location || 'No location provided'}</p>
            <small>{claims.length} incoming claim{claims.length === 1 ? '' : 's'}</small>
          </div>
        </div>

        <div className="claim-card-actions">
          <button type="button" className="secondary-action-button" onClick={() => setSelectedPost(post)}>
            View Item
          </button>
          {claims.length > 0 ? (
            <button type="button" className="secondary-action-button" onClick={() => setSelectedPost(post)}>
              View Claims
            </button>
          ) : null}
        </div>

        {claims.length > 0 ? (
          <div className="my-found-claims">
            {claims.map((claim) => (
              <article className="my-found-claim-row" key={claim.id}>
                <div>
                  <strong>{claim.user?.name || 'Unknown claimant'}</strong>
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
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="community-empty-inline">No claims received for this found item yet.</p>
        )}
      </article>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'my-posts':
        return (
          <ContentPanel
            title="My Posts"
            subtitle="Your community, lost, and found posts across all statuses."
          >
            {renderFeed(orderedMyPosts, { allowDelete: true, allowEdit: true })}
          </ContentPanel>
        )
      case 'my-found':
        return (
          <ContentPanel
            title="My Found"
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
      case 'my-claims':
        return (
          <PlaceholderPanel
            title="My Claims"
            subtitle="Track your claim requests and review progress."
          >
            {myClaims.length > 0 ? (
              <div className="community-claim-list">
                {myClaims.map(renderClaimCard)}
              </div>
            ) : (
              <div className="community-empty-state">
                <strong>No claims yet.</strong>
                <p>When you recognize an approved found item, open it and submit your claim.</p>
              </div>
            )}
          </PlaceholderPanel>
        )
      case 'notifications':
        return (
          <PlaceholderPanel
            title="Notifications"
            subtitle="Recent alerts related to your account and community activity."
          >
            <div className="notification-list notification-list-panel">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <article className="notification-item" key={notification.id}>
                    <div className="notification-item-copy">
                      <strong>{notification.title}</strong>
                      <p>{notification.detail}</p>
                    </div>
                    <span>{notification.time}</span>
                  </article>
                ))
              ) : (
                <div className="notification-empty">No new notifications</div>
              )}
            </div>
          </PlaceholderPanel>
        )
      case 'feed':
      default:
        return renderPublicReports()
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
                setEditingPost(null)
                setIsModalOpen(true)
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
              {activeSection === 'feed' ? (
                <CommunityMap
                  posts={orderedPosts}
                  onViewDetails={(post) => setSelectedPost(post)}
                />
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
      />

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
      <ImagePreviewModal preview={imagePreview} onClose={() => setImagePreview(null)} />
    </>
  )
}

export default CommunityPage
