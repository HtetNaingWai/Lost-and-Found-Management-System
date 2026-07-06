export function formatDate(dateValue, options = {}) {
  if (!dateValue) return 'Not available'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(dateValue))
}
