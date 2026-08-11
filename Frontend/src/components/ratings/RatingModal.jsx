import { useEffect, useState } from 'react'
import Icon from '../Icon'
import { apiRequest } from '../../services/api'
import { resolveImageUrl } from '../../utils/imageUrl'
import StarRating from './StarRating'

function RatingModal({ open, claim, token, onClose, onSuccess }) {
  const [eligibility, setEligibility] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !claim?.id) return undefined

    let cancelled = false
    setLoading(true)
    setError('')
    setRating(0)
    setComment('')
    setEligibility(null)

    apiRequest(`/ratings/eligibility?claim_id=${claim.id}`, { token })
      .then((payload) => {
        if (!cancelled) setEligibility(payload)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.payload?.message ?? 'Failed to check rating eligibility.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [claim?.id, open, token])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  const reviewedUser = eligibility?.reviewed_user
  const item = eligibility?.item
  const imageUrl = resolveImageUrl(reviewedUser?.profile_image_url)
  const unavailableReason = (() => {
    const reason = eligibility?.reason || error
    if (!reason) return 'This return is not eligible for review.'

    const lowerReason = reason.toLowerCase()
    if (
      lowerReason.includes('migration')
      || lowerReason.includes('database')
      || lowerReason.includes('table')
      || lowerReason.includes('column')
    ) {
      console.warn('Rating unavailable:', reason)
      return 'Rating is temporarily unavailable.'
    }

    return reason
  })()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!rating) return

    setSubmitting(true)
    setError('')

    try {
      const payload = await apiRequest('/ratings', {
        method: 'POST',
        token,
        body: {
          claim_id: claim.id,
          rating,
          comment,
        },
      })

      onSuccess?.(payload)
      onClose()
    } catch (requestError) {
      setError(requestError.payload?.message ?? 'Failed to submit rating.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="community-modal-root" onClick={onClose}>
      <div className="community-modal-overlay" />
      <div className="community-modal-shell">
        <section className="community-modal-card rating-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <div className="community-modal-top">
            <div>
              <h2>{reviewedUser ? `Rate your experience with ${reviewedUser.name}` : 'Rate this return'}</h2>
              <p>Share feedback after a completed lost and found return.</p>
            </div>
            <button type="button" className="modal-close-button" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>

          {loading ? (
            <div className="rating-modal-state">Checking eligibility...</div>
          ) : eligibility?.eligible && reviewedUser ? (
            <form className="rating-form" onSubmit={handleSubmit}>
              <div className="rating-reviewee">
                <span className="reviewer-avatar rating-reviewee-avatar">
                  {imageUrl ? <img src={imageUrl} alt={reviewedUser.name} /> : reviewedUser.name.charAt(0).toUpperCase()}
                </span>
                <strong>{reviewedUser.name}</strong>
              </div>

              {item ? (
                <div className="rating-item-context">
                  <span className={`badge badge-${item.post_type}`}>{item.post_type}</span>
                  <div>
                    <strong>{item.title || 'Returned item'}</strong>
                    <small>{item.category?.name || 'General'}{item.returned_at ? ` • Returned ${new Date(item.returned_at).toLocaleDateString()}` : ''}</small>
                  </div>
                </div>
              ) : null}

              <StarRating value={rating} onChange={setRating} />

              <label className="profile-form-field">
                <span>Optional review</span>
                <textarea
                  rows="4"
                  maxLength={500}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Very helpful and easy to communicate with."
                />
              </label>

              {error ? <p className="settings-feedback is-error">{error}</p> : null}

              <div className="community-modal-actions">
                <button type="button" className="secondary-action-button" onClick={onClose}>
                  Maybe Later
                </button>
                <button type="submit" className="quick-action-button" disabled={!rating || submitting}>
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          ) : (
            <div className="rating-modal-state">
              <strong>{eligibility?.already_rated ? 'You already reviewed this return.' : 'Rating unavailable'}</strong>
              <p>{unavailableReason}</p>
              <button type="button" className="secondary-action-button" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default RatingModal
