import axios from 'axios'

const api = axios.create({
  baseURL: '/api', // Using proxy configuration instead of hardcoded URL
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 second timeout
  withCredentials: true // Include cookies for CORS
})

// Student API instance with correct base URL
const studentApi = axios.create({
  baseURL: '/api/diaks', // Student endpoints are mounted at /api/diaks/students/*
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 second timeout
  withCredentials: true // Include cookies for CORS
})

// Request interceptor for student API
studentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for student API
studentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const message = error.response.data?.error || error.message || 'Server error'
      
      if (status === 401) {
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else if (status === 403) {
        // Forbidden - show error message
        console.error('Access forbidden:', message)
      } else if (status >= 500) {
        // Server error
        console.error('Server error:', message)
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error - no response received:', error.message)
    } else {
      // Something else happened
      console.error('Request error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const message = error.response.data?.error || error.message || 'Server error'
      
      if (status === 401) {
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else if (status === 403) {
        // Forbidden - show error message
        console.error('Access forbidden:', message)
      } else if (status >= 500) {
        // Server error
        console.error('Server error:', message)
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error - no response received:', error.message)
    } else {
      // Something else happened
      console.error('Request error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// Helper function to handle API errors consistently
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
