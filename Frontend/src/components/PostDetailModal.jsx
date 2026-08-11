import { useEffect, useState } from 'react'
import Icon from './Icon'
import RatingSummary from './ratings/RatingSummary'
import { formatDate } from '../utils/formatDate'
import { resolveImageUrl } from '../utils/imageUrl'

function PostDetailModal({
  post,
  user,
  onClose,
  onStartMessage,
  onUserProfileClick,
  onSubmitClaim,
  onMarkClaimReturned,
  existingClaim,
  submittingClaim = false,
  savingClaimId = null,
  isSaved = false,
  onToggleSave,
  savingSave = false,
}) {
  const [claimOpen, setClaimOpen] = useState(false)
  const [proofDescription, setProofDescription] = useState('')
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '')
  const [claimError, setClaimError] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)

  useEffect(() => {
    if (!post) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (imagePreviewOpen) {
          setImagePreviewOpen(false)
          return
        }

        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [imagePreviewOpen, post, onClose])

  useEffect(() => {
    if (!post) return

    setClaimOpen(false)
    setProofDescription('')
    setContactPhone(user?.phone ?? '')
    setClaimError('')
    setImageFailed(false)
    setImagePreviewOpen(false)
  }, [post, user?.phone])

  if (!post) return null

  const postType = post.post_type ?? post.type
  const status = post.status ?? 'pending'
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
  const title = post.title ?? post.itemTitle
  const content = post.content ?? post.description
  const imageUrl = resolveImageUrl(post.image_url ?? post.imageUrl ?? post.image)
  const shouldShowImage = imageUrl && !imageFailed
  const createdAt = post.created_at ?? post.createdAt
  const itemDate = post.item_date ?? post.itemDate
  const owner = post.user ?? {}
  const profileImageUrl = owner.profile_image_url ?? owner.profileImageUrl
  const isOwner = owner.id === user?.id
  const canClaim = postType === 'found' && status === 'approved' && !isOwner
  const existingClaimStatusLabel = existingClaim?.status
    ? existingClaim.status.charAt(0).toUpperCase() + existingClaim.status.slice(1)
    : ''

  const typeLabels = {
    community: 'Community',
    lost: 'Lost',
    found: 'Found',
  }

  const handleClaimSubmit = async (event) => {
    event.preventDefault()
    setClaimError('')

    if (!proofDescription.trim()) {
      setClaimError('Please provide proof details for your claim.')
      return
    }

    if (!contactPhone.trim()) {
      setClaimError('Please provide a contact phone number.')
      return
    }

    try {
      await onSubmitClaim?.({
        community_post_id: post.id,
        proof_description: proofDescription.trim(),
        contact_phone: contactPhone.trim(),
      })

      setClaimOpen(false)
      setProofDescription('')
    } catch (error) {
      setClaimError(error?.payload?.message ?? error?.message ?? 'Failed to submit your claim.')
    }
  }

  return (
    <>
      <div className="community-modal-root" onClick={onClose}>
        <div className="community-modal-overlay" />
        <div className="community-modal-shell">
          <section
            className="community-modal-card post-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
          <div className="community-modal-top">
            <div>
              <h2 id="post-detail-title">{title || 'Community Post Details'}</h2>
              <p>View the full post details and member information.</p>
            </div>
            <div className="post-detail-top-actions">
              <button
                type="button"
                className={`community-save-button${isSaved ? ' is-saved' : ''}`}
                disabled={savingSave}
                onClick={onToggleSave}
                aria-label={isSaved ? 'Remove from saved posts' : 'Save post'}
              >
                <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} />
              </button>
              <button type="button" className="modal-close-button" onClick={onClose}>
                <Icon name="close" />
              </button>
            </div>
          </div>

          <div className="post-detail-body">
            {shouldShowImage ? (
              <button
                type="button"
                className="post-detail-image-wrap post-detail-image-button"
                onClick={() => setImagePreviewOpen(true)}
                aria-label={`View larger image for ${title || 'post attachment'}`}
              >
                <img
                  className="post-detail-image"
                  src={imageUrl}
                  alt={title || 'Post attachment'}
                  onError={() => setImageFailed(true)}
                />
                <span className="post-detail-image-hint">
                  <Icon name="search" />
                  View image
                </span>
              </button>
            ) : null}

            <div className="community-post-header">
              <button
                type="button"
                className="community-post-user community-author-link"
                disabled={!owner.id}
                onClick={() => onUserProfileClick?.(owner)}
              >
                <span className="profile-avatar">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt={owner.name} />
                  ) : (
                    (owner.name || 'U').charAt(0).toUpperCase()
                  )}
                </span>
                <div>
                  <strong>{owner.name || 'Unknown user'}</strong>
                  <RatingSummary summary={owner.rating_summary} compact />
                  <p>
                    {formatDate(createdAt, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </button>

              <div className="community-post-badges">
                <span className={`badge badge-type ${postType === 'lost' ? 'badge-lost' : postType === 'found' ? 'badge-found' : 'badge-approved'}`}>
                  {typeLabels[postType] ?? 'Post'}
                </span>
                <span className={`badge badge-status badge-${status.toLowerCase()}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <p className="community-post-content">{content}</p>

            <div className="post-detail-grid">
              <div className="post-detail-meta-card">
                <strong>Category</strong>
                <span>{post.category?.name || 'General'}</span>
              </div>
              <div className="post-detail-meta-card">
                <strong>Location</strong>
                <span>{post.location || 'Not provided'}</span>
              </div>
              <div className="post-detail-meta-card">
                <strong>Item Date</strong>
                <span>{itemDate ? formatDate(itemDate) : 'Not provided'}</span>
              </div>
              <div className="post-detail-meta-card">
                <strong>Status</strong>
                <span>{statusLabel}</span>
              </div>
            </div>

            {post.admin_note ? (
              <div className="settings-note">
                <strong>Admin Note:</strong> {post.admin_note}
              </div>
            ) : null}

            {existingClaim ? (
              <div className="settings-note claim-status-note">
                <strong>Your Return Status:</strong> {existingClaimStatusLabel}
                {existingClaim.returned_at ? ` • Returned ${formatDate(existingClaim.returned_at)}` : ''}
                {existingClaim.admin_note ? ` • Note: ${existingClaim.admin_note}` : ''}
              </div>
            ) : null}

            {isOwner && Array.isArray(post.claims) && post.claims.length > 0 ? (
              <div className="post-detail-claims">
                <div className="section-panel-heading">
                  <h3>Return Requests on This Item</h3>
                  <p>Track members connected to this item return.</p>
                </div>

                <div className="community-claim-list">
                  {post.claims.map((claim) => (
                    <article className="community-claim-item" key={claim.id}>
                      <div className="community-claim-copy">
                        {claim.user?.id ? (
                          <button
                            type="button"
                            className="inline-profile-link claim-profile-link"
                            onClick={() => onUserProfileClick?.(claim.user)}
                          >
                            {claim.user.name || 'Unknown claimant'}
                          </button>
                        ) : (
                          <strong>{claim.user?.name || 'Unknown claimant'}</strong>
                        )}
                        <p>{claim.contact_phone || 'No contact phone'}</p>
                        <p>{claim.proof_description || 'No proof description provided.'}</p>
                        <p>
                          Submitted {formatDate(claim.created_at)}
                          {claim.reviewed_at ? ` • Reviewed ${formatDate(claim.reviewed_at)}` : ''}
                          {claim.returned_at ? ` • Returned ${formatDate(claim.returned_at)}` : ''}
                        </p>
                        {claim.admin_note ? <p>Admin note: {claim.admin_note}</p> : null}
                      </div>
                      <div className="community-claim-actions">
                        <span className={`badge badge-status badge-${claim.status}`}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                        {claim.user?.id && claim.user.id !== user?.id ? (
                          <button
                            type="button"
                            className="secondary-action-button"
                            onClick={() => onStartMessage?.(claim.user, post)}
                          >
                            {postType === 'lost' ? 'Message Helper' : 'Message Owner'}
                          </button>
                        ) : null}
                        {['pending', 'approved'].includes(claim.status) ? (
                          <button
                            type="button"
                            className="quick-action-button"
                            disabled={savingClaimId === claim.id}
                            onClick={() => {
                              const confirmed = window.confirm('This confirms that the item has been successfully returned. The listing will be removed from active Lost/Found results and both participants can leave feedback.')
                              if (confirmed) {
                                void onMarkClaimReturned?.({ ...claim, community_post: post })
                              }
                            }}
                          >
                            {savingClaimId === claim.id ? 'Saving...' : 'Mark as Returned'}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {claimOpen ? (
              <form className="profile-form post-claim-form" onSubmit={handleClaimSubmit}>
                <div className="profile-form-grid">
                  <label className="profile-form-field profile-form-field-full">
                    <span>Proof Description</span>
                    <textarea
                      rows="4"
                      value={proofDescription}
                      onChange={(event) => setProofDescription(event.target.value)}
                      placeholder="Explain why this item belongs to you."
                    />
                  </label>

                  <label className="profile-form-field profile-form-field-full">
                    <span>Contact Phone</span>
                    <input
                      value={contactPhone}
                      onChange={(event) => setContactPhone(event.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </label>
                </div>

                {claimError ? <p className="settings-feedback is-error">{claimError}</p> : null}

                <div className="community-modal-actions">
                  <button type="button" className="secondary-action-button" onClick={() => setClaimOpen(false)}>
                    Cancel Claim
                  </button>
                  <button type="submit" className="quick-action-button" disabled={submittingClaim}>
                    {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            ) : null}

            <div className="community-modal-actions">
              <button type="button" className="secondary-action-button" onClick={onClose}>
                Close
              </button>
              {canClaim ? (
                <button
                  type="button"
                  className="quick-action-button"
                  disabled={Boolean(existingClaim)}
                  onClick={() => setClaimOpen(true)}
                >
                  {existingClaim ? `Claim ${existingClaimStatusLabel}` : 'Claim This Item'}
                </button>
              ) : null}
              {postType === 'found' && !isOwner ? (
                <button
                  type="button"
                  className="quick-action-button"
                  onClick={() => onStartMessage?.(owner, post)}
                >
                  Message Owner
                </button>
              ) : null}
              {postType === 'lost' && !isOwner ? (
                <button
                  type="button"
                  className="quick-action-button"
                  onClick={() => onStartMessage?.(owner, post)}
                >
                  Message Owner
                </button>
              ) : null}
              {postType === 'community' && !isOwner ? (
                <button
                  type="button"
                  className="quick-action-button"
                  onClick={() => onStartMessage?.(owner, post)}
                >
                  Message User
                </button>
              ) : null}
            </div>
          </div>
          </section>
        </div>
      </div>

      {imagePreviewOpen && shouldShowImage ? (
        <div className="community-image-modal-root" onClick={() => setImagePreviewOpen(false)}>
          <div className="community-image-modal-overlay" />
          <div className="community-image-modal-shell" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-close-button community-image-close"
              onClick={() => setImagePreviewOpen(false)}
              aria-label="Close image preview"
            >
              <Icon name="close" />
            </button>
            <img className="community-image-modal-image" src={imageUrl} alt={title || 'Post attachment'} />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default PostDetailModal
