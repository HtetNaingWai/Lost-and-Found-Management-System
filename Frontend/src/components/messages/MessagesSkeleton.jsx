function MessagesSkeleton() {
  return (
    <div className="messages-skeleton-list">
      {[0, 1, 2, 3].map((item) => (
        <span className={`messages-skeleton-row${item % 2 ? ' is-own' : ''}`} key={item} />
      ))}
    </div>
  )
}

export default MessagesSkeleton
