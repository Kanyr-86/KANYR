import { useToastStore } from '@/store/toast'
import { getErrorMessage, getSuccessMessage } from '@/i18n'

/**
 * Centralized Error Handler Service
 * Provides consistent error handling across the application
 * 
 * Features:
 * - Consistent toast notifications for all errors
 * - Automatic error message extraction from various error formats
 * - Log errors to console in development
 * - Track error statistics (optional)
 */

// Error severity levels
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
}

// Error categories for tracking
export const ErrorCategory = {
  NETWORK: 'network',
  SERVER: 'server',
  VALIDATION: 'validation',
  AUTH: 'auth',
  NOT_FOUND: 'not_found',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown'
}

/**
 * Extract error message from various error formats
 * @param {Error|Object|string} error - Error object
 * @param {string} defaultMessage - Default message if extraction fails
 * @returns {string} - Human readable error message
 */
export function extractErrorMessage(error, defaultMessage = null) {
  // If it's a string, return it directly
  if (typeof error === 'string') {
    return error
  }

  // If it's an Error object
  if (error instanceof Error) {
    return error.message
  }

  // If it's an Axios error response
  if (error?.response?.data) {
    const { data } = error.response
    
    // Check for various error message fields
    if (data.error) return data.error
    if (data.message) return data.message
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map(e => typeof e === 'string' ? e : e.message || e.msg).join(', ')
    }
    if (data.errors && typeof data.errors === 'object') {
      return Object.values(data.errors).flat().join(', ')
    }
  }

  // Check for custom error fields
  if (error?.error) return error.error
  if (error?.message) return error.message
  if (error?.msg) return error.msg

  // Return default message
  return defaultMessage || getErrorMessage('UNKNOWN_ERROR')
}

/**
 * Categorize an error based on its characteristics
 * @param {Error} error - Error object
 * @returns {string} - Error category
 */
export function categorizeError(error) {
  if (!error) return ErrorCategory.UNKNOWN

  // Network errors (no response)
  if (error.request && !error.response) {
    return ErrorCategory.NETWORK
  }

  const status = error.response?.status

  if (status === 401) return ErrorCategory.AUTH
  if (status === 403) return ErrorCategory.PERMISSION
  if (status === 404) return ErrorCategory.NOT_FOUND
  if (status === 422 || status === 400) return ErrorCategory.VALIDATION
  if (status >= 500) return ErrorCategory.SERVER

  return ErrorCategory.UNKNOWN
}

/**
 * Determine error severity based on status code and category
 * @param {Error} error - Error object
 * @returns {string} - Error severity
 */
export function getErrorSeverity(error) {
  const category = categorizeError(error)
  const status = error?.response?.status

  switch (category) {
    case ErrorCategory.AUTH:
    case ErrorCategory.PERMISSION:
      return ErrorSeverity.WARNING
    
    case ErrorCategory.VALIDATION:
      return ErrorSeverity.INFO
    
    case ErrorCategory.SERVER:
      if (status >= 500) return ErrorSeverity.CRITICAL
      return ErrorSeverity.ERROR
    
    case ErrorCategory.NETWORK:
      return ErrorSeverity.WARNING
    
    default:
      return ErrorSeverity.ERROR
  }
}

/**
 * Get user-friendly message based on error category
 * @param {Error} error - Error object
 * @returns {string}
 */
export function getUserFriendlyMessage(error) {
  const category = categorizeError(error)
  const status = error?.response?.status

  switch (category) {
    case ErrorCategory.NETWORK:
      return getErrorMessage('NETWORK_ERROR')
    
    case ErrorCategory.AUTH:
      if (status === 401) {
        return 'A munkamenet lejárt. Kérjük, jelentkezzen be újra.'
      }
      return getErrorMessage('ACCESS_DENIED')
    
    case ErrorCategory.PERMISSION:
      return getErrorMessage('ACCESS_DENIED')
    
    case ErrorCategory.NOT_FOUND:
      return 'A keresett elem nem található.'
    
    case ErrorCategory.VALIDATION:
      return extractErrorMessage(error, getErrorMessage('VALIDATION_ERROR'))
    
    case ErrorCategory.SERVER:
      return getErrorMessage('SERVER_ERROR')
    
    default:
      return extractErrorMessage(error, getErrorMessage('UNKNOWN_ERROR'))
  }
}

/**
 * Central error handler function
 * @param {Error} error - Error object
 * @param {Object} options - Handling options
 * @param {boolean} options.showToast - Whether to show toast notification (default: true)
 * @param {string} options.context - Context where error occurred (for logging)
 * @param {Function} options.onError - Callback to execute on error
 * @param {boolean} options.logToConsole - Whether to log to console (default: true in dev)
 * @returns {Object} - Standardized error object
 */
export function handleError(error, options = {}) {
  const {
    showToast = true,
    context = null,
    onError = null,
    logToConsole = process.env.NODE_ENV !== 'production'
  } = options

  // Extract and categorize error
  const message = extractErrorMessage(error)
  const userMessage = getUserFriendlyMessage(error)
  const category = categorizeError(error)
  const severity = getErrorSeverity(error)
  const status = error?.response?.status || 0

  // Create standardized error object
  const errorInfo = {
    message,
    userMessage,
    category,
    severity,
    status,
    timestamp: new Date().toISOString(),
    context,
    originalError: error
  }

  // Log to console in development
  if (logToConsole) {
    const logMethod = severity === ErrorSeverity.CRITICAL ? 'error' : 
                      severity === ErrorSeverity.WARNING ? 'warn' : 'log'
    console[logMethod](`[ErrorHandler${context ? ` - ${context}` : ''}]`, errorInfo)
  }

  // Show toast notification
  if (showToast) {
    try {
      const toastStore = useToastStore()
      const toastType = severity === ErrorSeverity.INFO ? 'info' :
                        severity === ErrorSeverity.WARNING ? 'warning' : 'error'
      
      // Use addToast method which is the actual method name in the toast store
      toastStore.addToast(userMessage, toastType, severity === ErrorSeverity.CRITICAL ? 8000 : 5000)
    } catch (e) {
      // Toast store might not be available during initialization
      console.warn('Could not show toast notification:', e)
    }
  }

  // Execute callback if provided
  if (onError && typeof onError === 'function') {
    onError(errorInfo)
  }

  return errorInfo
}

/**
 * Create a wrapped API call with consistent error handling
 * @param {Function} apiCall - API call function
 * @param {Object} options - Error handling options
 * @returns {Promise} - API call result or throws standardized error
 */
export async function withErrorHandling(apiCall, options = {}) {
  try {
    const result = await apiCall()
    return result
  } catch (error) {
    const errorInfo = handleError(error, options)
    throw errorInfo
  }
}

/**
 * Success handler - shows success toast
 * @param {string} message - Success message
 * @param {Object} options - Options
 * @param {number} options.duration - Toast duration
 */
export function handleSuccess(message, options = {}) {
  const { duration = 3000 } = options
  
  try {
    const toastStore = useToastStore()
    // Use success convenience method which internally calls addToast
    toastStore.success(message, duration)
  } catch (e) {
    console.log('[Success]', message)
  }
}

/**
 * Validation error handler - shows validation errors
 * @param {Object} errors - Validation errors object
 * @param {Object} options - Options
 */
export function handleValidationErrors(errors, options = {}) {
  const { showToast = true } = options
  
  const messages = Object.entries(errors)
    .map(([field, msgs]) => {
      if (Array.isArray(msgs)) {
        return `${field}: ${msgs.join(', ')}`
      }
      return `${field}: ${msgs}`
    })
    .join('\n')

  if (showToast) {
    try {
      const toastStore = useToastStore()
      // Use addToast method which is the actual method name in the toast store
      toastStore.addToast(`Kérjük, javítsa a következő hibákat:\n${messages}`, 'warning', 5000)
    } catch (e) {
      console.warn('[Validation Errors]', messages)
    }
  }

  return messages
}

export default {
  handleError,
  withErrorHandling,
  handleSuccess,
  handleValidationErrors,
  extractErrorMessage,
  categorizeError,
  getErrorSeverity,
  getUserFriendlyMessage,
  ErrorSeverity,
  ErrorCategory
}