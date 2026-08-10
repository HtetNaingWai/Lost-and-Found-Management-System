import { APP_BASE_URL } from '../services/api'

export function resolveImageUrl(value) {
  if (!value) return ''

  const rawValue = String(value).trim()
  if (!rawValue) return ''

  if (/^(https?:|data:|blob:)/i.test(rawValue)) {
    return rawValue
  }

  if (rawValue.startsWith('/storage/')) {
    return `${APP_BASE_URL}${rawValue}`
  }

  if (rawValue.startsWith('storage/')) {
    return `${APP_BASE_URL}/${rawValue}`
  }

  if (rawValue.startsWith('/')) {
    return `${APP_BASE_URL}${rawValue}`
  }

  return `${APP_BASE_URL}/storage/${rawValue}`
}
