import { useEffect, useState } from 'react'
import Icon from './Icon'
import { formatDate } from '../utils/formatDate'
import { resolveImageUrl } from '../utils/imageUrl'

function CommunityPostCard({
  post,
  onClick,
  onImageClick,
  isSaved,
  onToggleSave,
  savingSave = false,
  canEdit = false,
  onEdit,
  canDelete = false,
  onDelete,
  deleting = false,
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const postType = post.post_type ?? post.type
  const status = post.status ?? 'pending'
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
  const createdAt = post.created_at ?? post.createdAt
  const title = post.title ?? post.itemTitle
  const content = post.content ?? post.description
  const imageUrl = resolveImageUrl(post.image_url ?? post.imageUrl ?? post.image)
  const shouldShowImage = imageUrl && !imageFailed

  useEffect(() => {
    setImageFailed(false)
  }, [imageUrl])
  const itemDate = post.item_date ?? post.itemDate
  const profileImageUrl = post.user?.profile_image_url ?? post.user?.profileImageUrl

  const badgeClassMap = {
    community: 'badge-approved',
    lost: 'badge-lost',
    found: 'badge-found',
  }

  const labelMap = {
    community: 'Community',
    lost: 'Lost',
    found: 'Found',
  }

  return (
    <article
      className={`community-post-card${onClick ? ' is-clickable' : ''}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="community-post-header">
        <div className="community-post-user">
          <span className="profile-avatar">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={post.user.name} />
            ) : (
              post.user.name.charAt(0).toUpperCase()
            )}
          </span>
          <div>
            <strong>{post.user.name}</strong>
            <p>{formatDate(createdAt, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
          </div>
        </div>

        <div className="community-post-header-actions">
          <button
            type="button"
            className={`community-save-button${isSaved ? ' is-saved' : ''}`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleSave?.(post)
            }}
            disabled={savingSave}
            aria-label={isSaved ? 'Remove from saved posts' : 'Save post'}
          >
            <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} />
          </button>
          <div className="community-post-badges">
            <span className={`badge badge-type ${badgeClassMap[postType]}`}>
              {labelMap[postType]}
            </span>
            <span className={`badge badge-status badge-${status.toLowerCase()}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className={`community-report-body${shouldShowImage ? ' has-media' : ''}`}>
        {shouldShowImage ? (
          <button
            type="button"
            className="community-post-image-button"
            onClick={(event) => {
              event.stopPropagation()
              onImageClick?.(imageUrl, title || 'Post attachment')
            }}
          >
            <img
              className="community-post-image"
              src={imageUrl}
              alt={title || 'Post attachment'}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          </button>
        ) : null}

        <div className="community-report-copy">
          {title ? <h3 className="community-post-title">{title}</h3> : null}
          <p className="community-post-content">{content}</p>

          {postType !== 'community' ? (
            <div className="community-post-meta">
              {post.location ? (
                <p>
                  <Icon name="pin" />
                  <span>{post.location}</span>
                </p>
              ) : null}
              {itemDate ? (
                <p>
                  <Icon name="document" />
                  <span>{itemDate}</span>
                </p>
              ) : null}
              {post.category?.name ? (
                <p>
                  <Icon name="clipboard" />
                  <span>{post.category.name}</span>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="community-post-actions">
            <button
              type="button"
              className={`secondary-action-button community-card-action${isSaved ? ' is-saved' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                onToggleSave?.(post)
              }}
              disabled={savingSave}
              aria-label={isSaved ? 'Remove from saved posts' : 'Save post'}
            >
              <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} />
              <span>{savingSave ? 'Saving...' : isSaved ? 'Saved' : 'Save Post'}</span>
            </button>
            <button
              type="button"
              className="secondary-action-button community-card-action community-view-detail-action liquid-glass-action"
              onClick={(event) => {
                event.stopPropagation()
                onClick?.()
              }}
            >
              <Icon name="chat" />
              <span>View Details</span>
            </button>
            {canEdit ? (
              <button
                type="button"
                className="secondary-action-button community-card-action community-edit-action"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit?.(post)
                }}
              >
                <Icon name="document" />
                <span>Edit</span>
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                className="secondary-action-button community-card-action community-delete-action"
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete?.(post)
                }}
                disabled={deleting}
              >
                <Icon name="close" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export default CommunityPostCard
