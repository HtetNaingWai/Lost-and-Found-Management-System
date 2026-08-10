import Icon from '../Icon'
import { formatDate } from '../../utils/formatDate'

function ItemFact({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

export default ItemDetailsSidebar
