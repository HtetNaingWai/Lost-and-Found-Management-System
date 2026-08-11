import { formatDate } from './formatDate'

export const notificationIconMap = {
  message_received: 'chat',
  claim_created: 'clipboard',
  claim_submitted: 'clipboard',
  claim_received: 'clipboard',
  item_returned: 'checkCircle',
  return_completed: 'checkCircle',
  rating_available: 'star',
  rating_requested: 'star',
  rating_received: 'star',
  post_approved: 'shield',
  post_rejected: 'close',
}

export function getNotificationIcon(notification) {
  const action = notification?.data?.action
  return notificationIconMap[action] ?? notificationIconMap[notification?.type] ?? 'bell'
}

export function getNotificationRelatedItem(notification) {
  return notification?.data?.item_title
    ?? notification?.data?.post_title
    ?? notification?.data?.community_post_title
    ?? notification?.data?.title
    ?? ''
}

export function getNotificationMeta(notification) {
  const relatedItem = getNotificationRelatedItem(notification)
  const time = notification?.relativeTime ?? notification?.time ?? 'Just now'

  return relatedItem ? `${relatedItem} · ${time}` : time
}

export function getNotificationCategory(notification) {
  const type = notification?.data?.action ?? notification?.type ?? ''

  if (type.includes('message')) return 'messages'
  if (type.includes('claim') || type.includes('return')) return 'returns'
  if (type.includes('rating')) return 'ratings'

  return 'system'
}

export function getNotificationGroup(notification) {
  if (!notification?.rawTime && !notification?.time) return 'Earlier'

  const date = new Date(notification.rawTime ?? notification.time)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return 'Earlier'
}

export function formatNotificationAbsoluteTime(notification) {
  if (notification?.absoluteTime) return notification.absoluteTime
  if (!notification?.rawTime && !notification?.time) return 'Today'

  return formatDate(notification.rawTime ?? notification.time, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
