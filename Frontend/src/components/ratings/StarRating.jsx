import { useState } from 'react'

const labels = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
}

function StarRating({ value = 0, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)
  const activeValue = hovered || value

  return (
    <div className="star-rating" aria-label={value ? `${value} out of 5 stars` : 'No rating selected'}>
      <div className="star-rating-buttons" role={readonly ? undefined : 'radiogroup'} aria-label="Select rating">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= activeValue

          if (readonly) {
            return (
              <span key={star} className={`star-rating-symbol${filled ? ' is-filled' : ''}`} aria-hidden="true">
                ★
              </span>
            )
          }

          return (
            <button
              type="button"
              key={star}
              className={`star-rating-button${filled ? ' is-filled' : ''}`}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? '' : 's'} - ${labels[star]}`}
            >
              ★
            </button>
          )
        })}
      </div>
      {!readonly && value ? <span className="star-rating-label">{labels[value]}</span> : null}
    </div>
  )
}

export default StarRating
