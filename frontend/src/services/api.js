import axios from 'axios'
import { getErrorMessage } from '@/i18n'
import { useToastStore } from '@/store/toast'

// ─── CSRF Token kezelés ─────────────────────────────────────────────────────

const CSRF_COOKIE_NAME = 'XSRF-TOKEN'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

/**
 * Lekéri a CSRF tokent a sütiből
 * @returns {string|null} A CSRF token vagy null ha nem található
 */
function getCsrfTokenFromCookie() {
  const match = document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Lekéri a CSRF tokent a szervertől
 * @returns {Promise<string|null>} A CSRF token vagy null ha nem sikerült
 */
async function fetchCsrfToken() {
  try {
    const response = await axios.get('/api/auth/csrf-token', {
      withCredentials: true
    })
    return response.data?.data?.csrfToken || null
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error)
    return null
  }
}

/**
 * Biztosítja, hogy legyen érvényes CSRF token
 * Először a sütiből próbálja, ha nincs, akkor lekéri a szervertől
 * @returns {Promise<string|null>} A CSRF token vagy null
 */
async function ensureCsrfToken() {
  let token = getCsrfTokenFromCookie()
  if (!token) {
    token = await fetchCsrfToken()
  }
  return token
}

// ─── Megosztott interceptor logika ───────────────────────────────────────────

// Zászló a duplikált átirányítások megelőzéséhez, ha több kérés is 401-et ad vissza
let isRedirectingToLogin = false

function applyAuthInterceptors(instance) {
  // JWT és CSRF token csatolása minden kéréshez
  instance.interceptors.request.use(
    async (config) => {
      // JWT token hozzáadása
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      // CSRF token hozzáadása állapotváltoztató kérésekhez (POST, PUT, DELETE, PATCH)
      const stateChangingMethods = ['post', 'put', 'delete', 'patch']
      if (stateChangingMethods.includes(config.method?.toLowerCase())) {
        const csrfToken = await ensureCsrfToken()
        if (csrfToken) {
          config.headers[CSRF_HEADER_NAME] = csrfToken
        }
      }
      
      return config
    },
    (error) => Promise.reject(error)
  )

  // Egységes hibakezelés
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
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
          // CSRF token hiba kezelése
          if (error.response.data?.code?.startsWith('CSRF_')) {
            console.error('CSRF token error:', message)
            // Megpróbáljuk újra lekérni a CSRF tokent és frissíteni az oldalt
            try {
              await fetchCsrfToken()
              // Toast értesítés megjelenítése
              const toastStore = useToastStore()
              toastStore.showToast({
                type: 'warning',
                message: 'Biztonsági token lejárt. Az oldal újratöltése...',
                duration: 3000
              })
              // Kis késleltetés után frissítjük az oldalt
              setTimeout(() => {
                window.location.reload()
              }, 2000)
            } catch (e) {
              console.error('Failed to refresh CSRF token:', e)
            }
          } else {
            console.error(getErrorMessage('ACCESS_DENIED'), message)
          }
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
