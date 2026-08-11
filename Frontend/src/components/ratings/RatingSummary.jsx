function RatingSummary({ summary, compact = false }) {
  const average = summary?.average ?? null
  const count = summary?.count ?? 0

  if (!average || count === 0) {
    return <span className={compact ? 'rating-summary rating-summary-compact' : 'rating-summary'}>New member</span>
  }

  return (
    <span className={compact ? 'rating-summary rating-summary-compact' : 'rating-summary'}>
      <span aria-hidden="true">★</span>
      <strong>{average}</strong>
      {!compact ? <span>{count} review{count === 1 ? '' : 's'}</span> : null}
    </span>
  )
}

export default RatingSummary
