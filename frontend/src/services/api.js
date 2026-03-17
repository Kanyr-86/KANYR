import axios from 'axios'
import { getErrorMessage } from '@/i18n'
import { useToastStore } from '@/store/toast'
import { secureStorage } from './secureStorage'
import { dedupeRequest, generateRequestKey } from '@/composables/useRequestDeduplication'
import { handleError, ErrorCategory } from '@/services/errorHandler'

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

<<<<<<< HEAD
// Token refresh művelet blokkolása több egyidejű kérés esetén
let isRefreshingToken = false
let refreshSubscribers = []

// Storage error tracking
let storageErrorCount = 0
const MAX_STORAGE_ERRORS = 3
=======
// Enable request deduplication flag
const ENABLE_DEDUPLICATION = true
>>>>>>> ef5bf1e98206f97102ce5068851c9fb454611ef9

function applyAuthInterceptors(instance) {
  // Token refresh függvény
  const onTokenRefreshed = (newToken) => {
    refreshSubscribers.forEach((callback) => callback(newToken))
    refreshSubscribers = []
  }

  const addSubscriber = (callback) => {
    refreshSubscribers.push(callback)
  }

  // JWT és CSRF token csatolása minden kéréshez
  instance.interceptors.request.use(
    async (config) => {
      // JWT token hozzáadása
      try {
        const token = await secureStorage.getToken()
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
      
<<<<<<< HEAD
        return config
      } catch (error) {
        // Handle storage errors gracefully
        if (error.message && (
          error.message.includes('localStorage quota exceeded') ||
          error.message.includes('localStorage not available') ||
          error.message.includes('Invalid data')
        )) {
          storageErrorCount++
          
          if (storageErrorCount >= MAX_STORAGE_ERRORS) {
            const toastStore = useToastStore()
            toastStore.showToast({
              type: 'error',
              message: 'Tárhely hiba észlelve. Kérjük, töröljön néhány adatot vagy forduljon a rendszergazdához.',
              duration: 8000
            })
          }
          
          // Continue with request even if storage fails for non-sensitive operations
          return config
        }
        
        return Promise.reject(error)
      }
=======
      // Generate deduplication key for GET requests (safe to dedupe)
      if (ENABLE_DEDUPLICATION && config.method?.toLowerCase() === 'get') {
        config.dedupeKey = generateRequestKey(config)
      }
      
      return config
>>>>>>> ef5bf1e98206f97102ce5068851c9fb454611ef9
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor with standardized error handling
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response) {
        const status = error.response.status
        const message = error.response.data?.error || error.message || getErrorMessage('SERVER_ERROR')

        if (status === 401 && !originalRequest._retry) {
          if (isRefreshingToken) {
            // Ha már folyamatban van a token frissítés, várunk rá
            return new Promise((resolve) => {
              addSubscriber((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                resolve(instance(originalRequest))
              })
            })
          }

          originalRequest._retry = true
          isRefreshingToken = true

          try {
            // Token frissítési kísérlet
            const response = await axios.post('/api/auth/refresh', {}, {
              withCredentials: true
            })

            if (response.data.success && response.data.data.token) {
              const newToken = response.data.data.token
              
              // Új token mentése
              await secureStorage.setToken(newToken)
              
              // Store frissítése
              const authStore = useAuthStore()
              authStore.setToken(newToken)

              // Token frissítése az eredeti kérésben
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              
              // Várakozó kérések feldolgozása
              onTokenRefreshed(newToken)
              
              isRefreshingToken = false
              return instance(originalRequest)
            }
          } catch (refreshError) {
            // Token refresh sikertelen, kijelentkeztetés
            isRefreshingToken = false
            await handleTokenExpiration()
            return Promise.reject(refreshError)
          }
        } else if (status === 401) {
          // Jogosulatlan - töröljük a tárolt hitelesítést és átirányítunk a bejelentkezéshez
          // Duplikált átirányítások megelőzése, ha több egyidejű kérés is hibát ad
          if (!isRedirectingToLogin) {
            isRedirectingToLogin = true
<<<<<<< HEAD
            await handleTokenExpiration()
=======

            // Check if this is a token revocation message
            if (message && (
              message.includes('visszavonva') ||
              message.includes('érvénytelenné vált') ||
              message.includes('lejárt')
            )) {
              handleError(error, { 
                context: 'auth',
                showToast: true 
              })
            }

            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
>>>>>>> ef5bf1e98206f97102ce5068851c9fb454611ef9
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
            handleError(error, { 
              context: 'permission',
              showToast: true 
            })
          }
        } else if (status >= 500) {
          handleError(error, { 
            context: 'server',
            showToast: true 
          })
        } else {
          // Handle other errors with standardized handler
          handleError(error, { 
            context: 'api',
            showToast: true 
          })
        }
      } else if (error.request) {
        // Network errors
        handleError(error, { 
          context: 'network',
          showToast: true 
        })
      } else {
        // Other errors
        handleError(error, { 
          context: 'unknown',
          showToast: true 
        })
      }

      return Promise.reject(error)
    }
  )

  // Token lejárás kezelése
  async function handleTokenExpiration() {
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

    // Biztonságos tároló törlése
    await secureStorage.removeToken()
    await secureStorage.removeUser()
    
    // Store frissítése
    const authStore = useAuthStore()
    await authStore.logout()

    window.location.href = '/login'
  }
}

// Apply deduplication to axios adapter
const originalGet = axios.get
axios.get = function(url, config = {}) {
  if (ENABLE_DEDUPLICATION) {
    const dedupeKey = generateRequestKey({ method: 'get', url, ...config })
    return dedupeRequest(dedupeKey, () => originalGet.call(this, url, config))
  }
  return originalGet.call(this, url, config)
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
 * A baseURL '/api/diaks', így egy studentApi.get('/students/room') hívás
 * GET /api/diaks/students/room -ra fut (egyezik a DiakRoutes.js-el)
 */
const studentApi = axios.create({
  baseURL: '/api/diaks',
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
