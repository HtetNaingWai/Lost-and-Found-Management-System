import { useEffect } from 'react'
import Icon from './Icon'
import { formatDate } from '../utils/formatDate'

function PostDetailModal({ post, user, onClose, onStartMessage }) {
  useEffect(() => {
    if (!post) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [post, onClose])

  if (!post) return null

  const postType = post.post_type ?? post.type
  const status = post.status ?? 'pending'
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
  const title = post.title ?? post.itemTitle
  const content = post.content ?? post.description
  const imageUrl = post.image_url ?? post.imageUrl
  const createdAt = post.created_at ?? post.createdAt
  const itemDate = post.item_date ?? post.itemDate
  const owner = post.user ?? {}
  const profileImageUrl = owner.profile_image_url ?? owner.profileImageUrl
  const isOwner = owner.id === user?.id

  const typeLabels = {
    community: 'Community',
    lost: 'Lost',
    found: 'Found',
  }

  return (
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
            <button type="button" className="modal-close-button" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>

          <div className="post-detail-body">
            {imageUrl ? (
              <div className="post-detail-image-wrap">
                <img className="post-detail-image" src={imageUrl} alt={title || 'Post attachment'} />
              </div>
            ) : null}

            <div className="community-post-header">
              <div className="community-post-user">
                <span className="profile-avatar">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt={owner.name} />
                  ) : (
                    (owner.name || 'U').charAt(0).toUpperCase()
                  )}
                </span>
                <div>
                  <strong>{owner.name || 'Unknown user'}</strong>
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
              </div>

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

            <div className="community-modal-actions">
              <button type="button" className="secondary-action-button" onClick={onClose}>
                Close
              </button>
              {postType === 'found' && status === 'approved' && !isOwner ? (
                <button type="button" className="quick-action-button">
                  Claim This Item
                </button>
              ) : null}
              {postType === 'lost' ? (
                <button
                  type="button"
                  className="quick-action-button"
                  onClick={() => onStartMessage?.(owner, post)}
                >
                  Message Owner
                </button>
              ) : null}
              {postType === 'community' ? (
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
  )
}

export default PostDetailModal
