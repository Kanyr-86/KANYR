import axios from 'axios'

// ─── Shared interceptor logic ───────────────────────────────────────────────

function applyAuthInterceptors(instance) {
  // Attach JWT from localStorage on every request
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

  // Unified error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const status = error.response.status
        const message = error.response.data?.error || error.message || 'Server error'

        if (status === 401) {
          // Unauthorized – clear stored auth and redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        } else if (status === 403) {
          console.error('Access forbidden:', message)
        } else if (status >= 500) {
          console.error('Server error:', message)
        }
      } else if (error.request) {
        console.error('Network error - no response received:', error.message)
      } else {
        console.error('Request error:', error.message)
      }

      return Promise.reject(error)
    }
  )
}

// ─── Axios instances ─────────────────────────────────────────────────────────

/** General API instance – used by admin views */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true
})
applyAuthInterceptors(api)

/**
 * Student API instance.
 * baseURL is '/api/diaks' so a call like studentApi.get('/students/room')
 * resolves to GET /api/diaks/students/room  (matches DiakRoutes.js)
 */
const studentApi = axios.create({
  baseURL: '/api/diaks',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true
})
applyAuthInterceptors(studentApi)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise axios errors into a standard shape */
export const handleApiError = (error) => {
  if (error.response) {
    return {
      success: false,
      error: error.response.data?.error || error.message || 'Server error',
      status: error.response.status
    }
  } else if (error.request) {
    return {
      success: false,
      error: 'Network error - please check your connection',
      status: 0
    }
  } else {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      status: 0
    }
  }
}

export default api
export { studentApi }
