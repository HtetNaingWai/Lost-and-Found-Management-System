import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { APP_BASE_URL } from './api'

const REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST ?? '127.0.0.1'
const REVERB_PORT = Number(import.meta.env.VITE_REVERB_PORT ?? 8080)
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME ?? 'http'

let echoInstance = null
let connectedToken = ''

function makeAuthorizer(token) {
  return (channel) => ({
    authorize(socketId, callback) {
      fetch(`${APP_BASE_URL}/broadcasting/auth`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          socket_id: socketId,
          channel_name: channel.name,
        }),
      })
        .then(async (response) => {
          const payload = await response.json()

          if (!response.ok) {
            callback(payload, null)
            return
          }

          callback(null, payload)
        })
        .catch((error) => callback(error, null))
    },
  })
}

export function getUserChannelName(userId) {
  return `user.${userId}`
}

export function getConversationChannelName(firstUserId, secondUserId) {
  const sorted = [Number(firstUserId), Number(secondUserId)].sort((left, right) => left - right)
  return `conversation.${sorted[0]}.${sorted[1]}`
}

export function getPresenceChannelName() {
  return 'messaging'
}

export function getRealtimeClient(token) {
  if (!REVERB_APP_KEY || !token) {
    return null
  }

  if (echoInstance && connectedToken === token) {
    return echoInstance
  }

  if (echoInstance) {
    echoInstance.disconnect()
  }

  window.Pusher = Pusher

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: REVERB_APP_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authorizer: makeAuthorizer(token),
  })

  connectedToken = token

  return echoInstance
}

export function disconnectRealtime() {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
    connectedToken = ''
  }
}
