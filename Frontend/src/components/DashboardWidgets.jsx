import Icon from './Icon'

export function StatCard({ card }) {
  return (
    <article className="dashboard-stat-card">
      <div className="dashboard-stat-icon">
        <Icon name={card.icon} />
      </div>
      <div className="dashboard-stat-content">
        <strong>{card.value}</strong>
        <h3>{card.label}</h3>
        <p>{card.description}</p>
      </div>
    </article>
  )
}

export function RecentActivity({ items = [] }) {
  return (
    <section className="dashboard-panel">
      <div className="section-panel-heading">
        <h2>Recent Activity</h2>
        <p>Your latest actions across FindIt.</p>
      </div>
      <div className="activity-list">
        {items.map((item) => (
          <article className="activity-item" key={item.title}>
            <span className="activity-icon">
              <Icon name={item.icon} />
            </span>
            <div className="activity-copy">
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
            <span className="activity-time">{item.time}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

export function MyRecentItems({ items = [] }) {
  return (
    <section className="dashboard-panel">
      <div className="section-panel-heading">
        <h2>My Recent Items</h2>
        <p>Latest lost and found reports you submitted.</p>
      </div>
      <div className="recent-items-grid">
        {items.map((item) => (
          <article className="recent-item-card" key={`${item.title}-${item.created_at ?? item.date}`}>
            <img src={item.image_url || item.image} alt={item.title} />
            <div className="recent-item-body">
              <div className="recent-item-badges">
                <span className={`badge badge-type ${(item.post_type ?? item.type) === 'lost' || item.type === 'Lost' ? 'badge-lost' : 'badge-found'}`}>
                  {(item.post_type ?? item.type) === 'lost' ? 'Lost' : (item.post_type ?? item.type) === 'found' ? 'Found' : item.type}
                </span>
                <span className={`badge badge-status badge-${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>
              <h3>{item.title}</h3>
              <p className="recent-item-meta">
                <Icon name="pin" />
                <span>{item.location}</span>
              </p>
              <p className="recent-item-date">{item.item_date || item.date}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function MessagesPreview({ items = [] }) {
  return (
    <section className="dashboard-panel">
      <div className="section-panel-heading">
        <h2>Messages Preview</h2>
        <p>Latest conversations from your inbox.</p>
      </div>
      <div className="message-preview-list">
        {items.map((message) => (
          <article className="message-preview-item" key={`${message.sender}-${message.time}`}>
            <span className={`message-dot${message.unread ? ' is-unread' : ''}`} />
            <div className="message-preview-copy">
              <div className="message-preview-top">
                <strong>{message.sender}</strong>
                <span>{message.time}</span>
              </div>
              <p>{message.message}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
