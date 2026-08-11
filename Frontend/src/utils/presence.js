import { normalizePresenceIds, normalizeRealtimeUserId } from '../services/realtime'

const ONLINE_STALE_MS = 75 * 1000

export function getUserLastSeen(user) {
  return user?.lastSeen ?? user?.last_seen_at ?? null
}

export function isUserOnline(user, onlineUserIds = []) {
  const userId = normalizeRealtimeUserId(user?.id)
  const onlineIdSet = new Set(normalizePresenceIds(onlineUserIds))

  if (userId !== null && onlineIdSet.has(userId)) {
    return true
  }

  if (userId !== null && onlineIdSet.size > 0) {
    return false
  }

  const lastSeen = getUserLastSeen(user)
  const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0
  const recentlySeen = lastSeenTime > 0 && Date.now() - lastSeenTime <= ONLINE_STALE_MS

  return Boolean(user?.isOnline ?? user?.is_online) && recentlySeen
}

export function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Offline'

  const lastSeenTime = new Date(lastSeen).getTime()

  if (!Number.isFinite(lastSeenTime)) return 'Offline'

  const diffMinutes = Math.max(0, Math.floor((Date.now() - lastSeenTime) / 60000))

  if (diffMinutes < 1) return 'Last seen just now'
  if (diffMinutes === 1) return 'Last seen 1 minute ago'
  if (diffMinutes < 60) return `Last seen ${diffMinutes} minutes ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours === 1) return 'Last seen 1 hour ago'
  if (diffHours < 24) return `Last seen ${diffHours} hours ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Last seen yesterday'

  return `Last seen ${diffDays} days ago`
}

export function getPresenceStatus(user, onlineUserIds = []) {
  const online = isUserOnline(user, onlineUserIds)

  return {
    online,
    label: online ? 'Online' : formatLastSeen(getUserLastSeen(user)),
  }
}
