import Icon from './Icon'
import { formatDate } from '../utils/formatDate'

function CommunityPostCard({ post, onClick, onImageClick, isSaved, onToggleSave }) {
  const postType = post.post_type ?? post.type
  const status = post.status ?? 'pending'
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
  const createdAt = post.created_at ?? post.createdAt
  const title = post.title ?? post.itemTitle
  const content = post.content ?? post.description
  const imageUrl = post.image_url ?? post.imageUrl
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
              onToggleSave?.(post.id)
            }}
            aria-label={isSaved ? 'Unsave post' : 'Save post'}
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

      {title ? <h3 className="community-post-title">{title}</h3> : null}
      <p className="community-post-content">{content}</p>

      {imageUrl ? (
        <button
          type="button"
          className="community-post-image-button"
          onClick={(event) => {
            event.stopPropagation()
            onImageClick?.(imageUrl, title || 'Post attachment')
          }}
        >
          <img className="community-post-image" src={imageUrl} alt={title || 'Post attachment'} />
        </button>
      ) : null}

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
            onToggleSave?.(post.id)
          }}
        >
          <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} />
          <span>{isSaved ? 'Saved' : 'Save Post'}</span>
        </button>
        <button
          type="button"
          className="secondary-action-button community-card-action"
          onClick={(event) => {
            event.stopPropagation()
            onClick?.()
          }}
        >
          <Icon name="chat" />
          <span>View Details</span>
        </button>
      </div>
    </article>
  )
}

export default CommunityPostCard
