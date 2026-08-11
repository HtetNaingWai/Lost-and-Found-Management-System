import { formatDate } from '../../utils/formatDate'
import { resolveImageUrl } from '../../utils/imageUrl'
import StarRating from './StarRating'

function ReviewCard({ review }) {
  const reviewer = review.reviewer ?? {}
  const imageUrl = resolveImageUrl(reviewer.profile_image_url)

  return (
    <article className="review-card">
      <div className="review-card-top">
        <span className="reviewer-avatar">
          {imageUrl ? <img src={imageUrl} alt={reviewer.name || 'Reviewer'} /> : (reviewer.name || 'U').charAt(0).toUpperCase()}
        </span>
        <div>
          <strong>{reviewer.name || 'FindIt member'}</strong>
          <span>{formatDate(review.created_at)}</span>
        </div>
        <StarRating value={review.rating} readonly />
      </div>
      {review.comment ? <p>{review.comment}</p> : null}
    </article>
  )
}

export default ReviewCard
