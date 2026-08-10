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

function ItemDetailsSidebar({
  relatedItem,
  user,
  activeConversation,
  onViewItem,
  onMarkClaimReturned,
  savingClaimId,
}) {
  const itemType = relatedItem?.post_type ?? relatedItem?.type
  const imageUrl = relatedItem?.image_url ?? relatedItem?.image
  const ownerId = relatedItem?.user?.id ?? relatedItem?.user_id
  const isOwner = ownerId && user?.id && Number(ownerId) === Number(user.id)
  const normalizedStatus = relatedItem?.status?.toLowerCase()
  const canMarkReturned = (
    isOwner
    && itemType === 'found'
    && normalizedStatus !== 'returned'
    && normalizedStatus !== 'rejected'
  )
  const activeClaim = relatedItem?.claims?.find((claim) => (
    ['pending', 'approved'].includes(claim.status)
    && (!activeConversation?.participant?.id || Number(claim.user?.id) === Number(activeConversation.participant.id))
  ))

  return (
    <aside className="messages-item-panel">
      <div className="messages-panel-heading">
        <div>
          <h2>Item Details</h2>
          <p>Conversation context</p>
        </div>
      </div>

      {relatedItem ? (
        <div className="messages-item-content">
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
            <button type="button" className="quick-action-button messages-sidebar-action" onClick={() => onViewItem?.(relatedItem)}>View Item</button>
            {canMarkReturned && activeClaim ? (
              <button
                type="button"
                className="secondary-action-button messages-sidebar-action"
                disabled={savingClaimId === activeClaim.id}
                onClick={() => onMarkClaimReturned?.(activeClaim)}
              >
                {savingClaimId === activeClaim.id ? 'Saving...' : 'Mark as Returned'}
              </button>
            ) : null}
            <button type="button" className="secondary-action-button messages-sidebar-action" disabled>Report User</button>
          </div>
        </div>
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
