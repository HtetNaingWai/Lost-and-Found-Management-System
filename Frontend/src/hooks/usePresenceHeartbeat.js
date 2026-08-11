import { useEffect } from 'react'
import { API_BASE_URL, apiRequest } from '../services/api'

const HEARTBEAT_INTERVAL_MS = 30000

export function usePresenceHeartbeat(token, user, onPresenceUpdate) {
  useEffect(() => {
    if (!token || !user?.id) return undefined

    let stopped = false

    const mergePresence = (presenceUser) => {
      if (!presenceUser?.id) return

      onPresenceUpdate?.((current) => (
        current?.id === presenceUser.id
          ? { ...current, ...presenceUser }
          : current
      ))
    }

    const heartbeat = async () => {
      try {
        const payload = await apiRequest('/presence/heartbeat', {
          method: 'POST',
          token,
        })

        if (!stopped) {
          mergePresence(payload.user)
        }
      } catch {
        // Presence should never interrupt the authenticated app experience.
      }
    }

    const markOffline = () => {
      fetch(`${API_BASE_URL}/presence/offline`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        keepalive: true,
      }).catch(() => {})
    }

    void heartbeat()
    const intervalId = window.setInterval(heartbeat, HEARTBEAT_INTERVAL_MS)
    window.addEventListener('pagehide', markOffline)
    window.addEventListener('offline', markOffline)

    return () => {
      stopped = true
      window.clearInterval(intervalId)
      window.removeEventListener('pagehide', markOffline)
      window.removeEventListener('offline', markOffline)
    }
  }, [onPresenceUpdate, token, user?.id])
}
