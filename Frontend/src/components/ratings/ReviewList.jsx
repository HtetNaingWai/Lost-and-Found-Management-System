import ReviewCard from './ReviewCard'

function ReviewList({ reviews = [], hasMore = false, loading = false, onLoadMore }) {
  if (!reviews.length) {
    return (
      <div className="public-profile-placeholder">
        <strong>No ratings yet</strong>
        <p>Reviews from completed returns will appear here.</p>
      </div>
    )
  }

  return (
    <div className="review-list">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      {hasMore ? (
        <button type="button" className="secondary-action-button review-load-more" onClick={onLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'View All Reviews'}
        </button>
      ) : null}
    </div>
  )
}

export default ReviewList
