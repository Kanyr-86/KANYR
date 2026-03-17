import { ref } from 'vue'

/**
 * Request Deduplication composable
 * Prevents multiple identical simultaneous requests by sharing the same promise
 * 
 * @example
 * const { dedupe } = useRequestDeduplication()
 * 
 * // Multiple calls with same key will share the same promise
 * const result = await dedupe('fetch-users', () => api.get('/users'))
 */

// Global in-flight requests map shared across all component instances
const inFlightRequests = new Map()

export function useRequestDeduplication() {
  /**
   * Execute a request with deduplication
   * @param {string} key - Unique key for this request type
   * @param {Function} requestFn - Function that returns a promise
   * @param {Object} options - Options
   * @param {number} options.timeout - Request timeout in ms (default: 30000)
   * @returns {Promise} - The request promise
   */
  const dedupe = async (key, requestFn, options = {}) => {
    const { timeout = 30000 } = options

    // If there's already an in-flight request with this key, return its promise
    if (inFlightRequests.has(key)) {
      console.log(`[Deduplication] Reusing in-flight request for: ${key}`)
      return inFlightRequests.get(key)
    }

    // Create the promise
    const requestPromise = (async () => {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Request timeout after ${timeout}ms`))
          }, timeout)
        })

        // Race between the request and timeout
        const result = await Promise.race([requestFn(), timeoutPromise])
        return result
      } finally {
        // Clean up after request completes (success or error)
        // Use setTimeout to allow for immediate subsequent calls with same key
        setTimeout(() => {
          inFlightRequests.delete(key)
        }, 0)
      }
    })()

    // Store the promise
    inFlightRequests.set(key, requestPromise)

    return requestPromise
  }

  /**
   * Cancel all in-flight requests (useful for logout/reset)
   */
  const cancelAll = () => {
    inFlightRequests.clear()
  }

  /**
   * Check if a request is currently in-flight
   * @param {string} key - Request key
   * @returns {boolean}
   */
  const isInFlight = (key) => {
    return inFlightRequests.has(key)
  }

  /**
   * Get count of in-flight requests
   * @returns {number}
   */
  const getInFlightCount = () => {
    return inFlightRequests.size
  }

  return {
    dedupe,
    cancelAll,
    isInFlight,
    getInFlightCount
  }
}

/**
 * Standalone deduplication helper for use outside of composables
 * @param {string} key - Unique key for this request type
 * @param {Function} requestFn - Function that returns a promise
 * @param {Object} options - Options
 * @returns {Promise}
 */
export function dedupeRequest(key, requestFn, options = {}) {
  const { timeout = 30000 } = options

  if (inFlightRequests.has(key)) {
    console.log(`[Deduplication] Reusing in-flight request for: ${key}`)
    return inFlightRequests.get(key)
  }

  const requestPromise = (async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeout}ms`))
        }, timeout)
      })

      const result = await Promise.race([requestFn(), timeoutPromise])
      return result
    } finally {
      setTimeout(() => {
        inFlightRequests.delete(key)
      }, 0)
    }
  })()

  inFlightRequests.set(key, requestPromise)
  return requestPromise
}

/**
 * Generate a deduplication key from request config
 * @param {Object} config - Axios request config
 * @returns {string}
 */
export function generateRequestKey(config) {
  const method = config.method?.toLowerCase() || 'get'
  const url = config.url || ''
  const params = config.params ? JSON.stringify(config.params) : ''
  const data = config.data ? JSON.stringify(config.data) : ''
  
  return `${method}:${url}:${params}:${data}`
}

export default useRequestDeduplication