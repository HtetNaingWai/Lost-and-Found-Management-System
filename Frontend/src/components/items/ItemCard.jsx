import Icon from '../Icon'
import { formatDate } from '../../utils/formatDate'

function ItemCard({ item, type, onClick }) {
  return (
    <article
      className="recent-item-card recent-item-card-interactive"
      onClick={onClick}
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
  )
}

export default ItemCard
