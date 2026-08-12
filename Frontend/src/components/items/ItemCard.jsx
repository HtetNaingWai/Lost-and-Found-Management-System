import { useEffect, useState } from 'react'
import Icon from '../Icon'
import { formatDate } from '../../utils/formatDate'
import { resolveImageUrl } from '../../utils/imageUrl'

function ItemCard({
  item,
  type,
  onClick,
  onUserProfileClick,
  isSaved = false,
  onToggleSave,
  savingSave = false,
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = resolveImageUrl(item.image_url || item.image)
  const shouldShowImage = imageUrl && !imageFailed
  const itemType = item.post_type ?? item.type
  const status = item.status ?? 'approved'
  const category = item.category?.name || 'General'
  const ownerName = item.user?.name || 'Unknown user'

  useEffect(() => {
    setImageFailed(false)
  }, [imageUrl])

  return (
    <article
      className="recent-item-card recent-item-card-interactive"
      onClick={onClick}
    >
      <div className="recent-item-image-wrap">
        <button
          type="button"
          className={`recent-item-save-button${isSaved ? ' is-saved' : ''}`}
          disabled={savingSave}
          aria-label={isSaved ? 'Remove from saved posts' : 'Save post'}
          onClick={(event) => {
            event.stopPropagation()
            onToggleSave?.(item)
          }}
        >
          <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} />
        </button>
        {shouldShowImage ? (
          <img
            src={imageUrl}
            alt={item.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="recent-item-image-placeholder">
            <Icon name={type === 'lost' ? 'search' : 'inventory'} />
          </div>
        )}
        <div className="recent-item-hover">
          <span className="quick-action-button recent-item-hover-button liquid-glass-action">View Details</span>
        </div>
      </div>
      <div className="recent-item-body">
        <div className="recent-item-badges">
          <span className={`badge badge-type ${type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
            {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
          </span>
          <span className={`badge badge-status badge-${status.toLowerCase()}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <h3>{item.title}</h3>
        <p className="recent-item-copy">{item.content ?? item.description}</p>
        <p className="recent-item-meta">
          <Icon name="pin" />
          <span>{item.location}</span>
        </p>
        <div className="recent-item-footer">
          <span className="recent-item-category">{category}</span>
          <span className="recent-item-footer-meta recent-item-date">
            <Icon name="clock" />
            {formatDate(item.item_date || item.date)}
          </span>
          <span className="recent-item-footer-meta recent-item-submeta">
            <Icon name="userCircle" />
            {item.user?.id ? (
              <button
                type="button"
                className="inline-profile-link"
                onClick={(event) => {
                  event.stopPropagation()
                  onUserProfileClick?.(item.user)
                }}
              >
                {ownerName}
              </button>
            ) : (
              ownerName
            )}
          </span>
        </div>
      </div>
    </article>
  )
}

export default ItemCard
