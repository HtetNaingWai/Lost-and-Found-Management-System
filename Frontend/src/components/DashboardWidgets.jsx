import Icon from './Icon'
import { activityItems, messagesPreviewItems, recentItems } from '../utils/constants'

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

export function RecentActivity() {
  return (
    <section className="dashboard-panel">
      <div className="section-panel-heading">
        <h2>Recent Activity</h2>
        <p>Your latest actions across FindIt.</p>
      </div>
      <div className="activity-list">
        {activityItems.map((item) => (
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

export function MyRecentItems() {
  return (
    <section className="dashboard-panel">
      <div className="section-panel-heading">
        <h2>My Recent Items</h2>
        <p>Latest lost and found reports you submitted.</p>
      </div>
      <div className="recent-items-grid">
        {recentItems.map((item) => (
          <article className="recent-item-card" key={`${item.title}-${item.date}`}>
            <img src={item.image} alt={item.title} />
            <div className="recent-item-body">
              <div className="recent-item-badges">
                <span className={`badge badge-type ${item.type === 'Lost' ? 'badge-lost' : 'badge-found'}`}>
                  {item.type}
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
              <p className="recent-item-date">{item.date}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function MessagesPreview() {
  return (
    <section className="dashboard-panel">
      <div className="section-panel-heading">
        <h2>Messages Preview</h2>
        <p>Latest conversations from your inbox.</p>
      </div>
      <div className="message-preview-list">
        {messagesPreviewItems.map((message) => (
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
