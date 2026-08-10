export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'
export const APP_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

export const AUTH_STORAGE_KEY = 'findit-auth'

export function saveAuth(auth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = {
    Accept: 'application/json',
  }

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch {
    const error = new Error('Cannot connect to the FindIt server. Please start the Laravel API and try again.')
    error.status = 0
    error.payload = { message: error.message }
    throw error
  }

  const text = await response.text()
  let payload

  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = { message: 'The FindIt server returned an invalid response.' }
  }

  if (!response.ok) {
    const error = new Error(payload.message ?? 'Request failed.')
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
