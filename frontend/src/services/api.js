import axios from 'axios'
import { getErrorMessage } from '@/i18n'
import { useToastStore } from '@/store/toast'

// ─── Megosztott interceptor logika ───────────────────────────────────────────

// Zászló a duplikált átirányítások megelőzéséhez, ha több kérés is 401-et ad vissza
let isRedirectingToLogin = false

function applyAuthInterceptors(instance) {
  // JWT csatolása localStorage-ból minden kéréshez
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Egységes hibakezelés
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const status = error.response.status
        const message = error.response.data?.error || error.message || getErrorMessage('SERVER_ERROR')

        if (status === 401) {
          // Jogosulatlan - töröljük a tárolt hitelesítést és átirányítunk a bejelentkezéshez
          // Duplikált átirányítások megelőzése, ha több egyidejű kérés is hibát ad
          if (!isRedirectingToLogin) {
            isRedirectingToLogin = true

            // Show toast notification for token revocation
            try {
              const toastStore = useToastStore()
              // Check if this is a token revocation message
              if (message && (
                message.includes('visszavonva') ||
                message.includes('érvénytelenné vált') ||
                message.includes('lejárt')
              )) {
                toastStore.showToast({
                  type: 'warning',
                  message: 'A munkamenet lejárt. Kérjük, jelentkezzen be újra.',
                  duration: 5000
                })
              }
            } catch (e) {
              // Toast store might not be available during initialization
            }

            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
          }
        } else if (status === 403) {
          console.error(getErrorMessage('ACCESS_DENIED'), message)
        } else if (status >= 500) {
          console.error(getErrorMessage('SERVER_ERROR'), message)
        }
      } else if (error.request) {
        console.error(getErrorMessage('NETWORK_ERROR'), error.message)
      } else {
        console.error(getErrorMessage('UNEXPECTED_ERROR'), error.message)
      }

      return Promise.reject(error)
    }
  )
}

// ─── Axios példányok ─────────────────────────────────────────────────────────

/** Általános API példány – admin nézetekhez használt */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true
})
applyAuthInterceptors(api)

/**
 * Diák API példány.
 * A baseURL '/api/students', így egy studentApi.get('/students/room') hívás
 * GET /api/students/students/room -ra fut (egyezik a DiakRoutes.js-el)
 */
const studentApi = axios.create({
  baseURL: '/api/students',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true
})
applyAuthInterceptors(studentApi)

// ─── Segédfüggvények ─────────────────────────────────────────────────────────

/** Axios hibák normalizálása szabványos formára */
export const handleApiError = (error) => {
  if (error.response) {
    return {
      success: false,
      error: error.response.data?.error || error.message || getErrorMessage('SERVER_ERROR'),
      status: error.response.status
    }
  } else if (error.request) {
    return {
      success: false,
      error: getErrorMessage('NETWORK_ERROR'),
      status: 0
    }
  } else {
    return {
      success: false,
      error: error.message || getErrorMessage('UNEXPECTED_ERROR'),
      status: 0
    }
  }
}

export default api
export { studentApi }
