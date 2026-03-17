/**
 * Security Monitor Utility
 * Provides security event tracking and monitoring for the frontend application
 */

// Security event types
const SECURITY_EVENTS = {
  STORAGE_QUOTA_WARNING: 'storage_quota_warning',
  STORAGE_QUOTA_EXCEEDED: 'storage_quota_exceeded',
  XSS_ATTEMPT: 'xss_attempt',
  TOKEN_REFRESH_FAILED: 'token_refresh_failed',
  AUTHENTICATION_ERROR: 'authentication_error',
  CSRF_TOKEN_ERROR: 'csrf_token_error',
  STORAGE_CORRUPTION: 'storage_corruption'
}

// Security event log
const securityEvents = []

// Configuration
const MAX_EVENTS = 100
const ALERT_THRESHOLD = {
  storageQuotaWarning: 5,
  xssAttempts: 3,
  tokenRefreshFailures: 3
}

// Lazy-loaded secure storage reference
let secureStorageRef = null

// Function to set secure storage reference (dependency injection)
export function setSecureStorage(storage) {
  secureStorageRef = storage
}

/**
 * Logs a security event
 * @param {string} type - Type of security event
 * @param {Object} details - Additional details about the event
 */
export function logSecurityEvent(type, details = {}) {
  const event = {
    id: generateEventId(),
    type,
    timestamp: new Date().toISOString(),
    details,
    severity: getEventSeverity(type),
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  // Add to event log
  securityEvents.push(event)
  
  // Maintain event log size
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift()
  }

  // Check for alert conditions
  checkAlertConditions(type)

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Security Event] ${type}:`, event)
  }

  // Store critical events in secure storage for persistence
  if (event.severity === 'high' || event.severity === 'critical') {
    persistCriticalEvent(event)
  }
}

/**
 * Generates a unique event ID
 * @returns {string} - Unique event ID
 */
function generateEventId() {
  return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Gets the severity level for an event type
 * @param {string} type - Event type
 * @returns {string} - Severity level
 */
function getEventSeverity(type) {
  switch (type) {
    case SECURITY_EVENTS.STORAGE_QUOTA_EXCEEDED:
    case SECURITY_EVENTS.XSS_ATTEMPT:
    case SECURITY_EVENTS.STORAGE_CORRUPTION:
      return 'critical'
    case SECURITY_EVENTS.TOKEN_REFRESH_FAILED:
    case SECURITY_EVENTS.AUTHENTICATION_ERROR:
      return 'high'
    case SECURITY_EVENTS.STORAGE_QUOTA_WARNING:
      return 'medium'
    case SECURITY_EVENTS.CSRF_TOKEN_ERROR:
      return 'low'
    default:
      return 'info'
  }
}

/**
 * Checks if alert conditions are met for an event type
 * @param {string} type - Event type
 */
function checkAlertConditions(type) {
  const recentEvents = securityEvents.filter(
    event => event.type === type && 
    new Date() - new Date(event.timestamp) < 5 * 60 * 1000 // Last 5 minutes
  )

  switch (type) {
    case SECURITY_EVENTS.STORAGE_QUOTA_WARNING:
      if (recentEvents.length >= ALERT_THRESHOLD.storageQuotaWarning) {
        triggerAlert('storage_quota_threshold', {
          count: recentEvents.length,
          threshold: ALERT_THRESHOLD.storageQuotaWarning
        })
      }
      break
    case SECURITY_EVENTS.XSS_ATTEMPT:
      if (recentEvents.length >= ALERT_THRESHOLD.xssAttempts) {
        triggerAlert('xss_threshold', {
          count: recentEvents.length,
          threshold: ALERT_THRESHOLD.xssAttempts
        })
      }
      break
    case SECURITY_EVENTS.TOKEN_REFRESH_FAILED:
      if (recentEvents.length >= ALERT_THRESHOLD.tokenRefreshFailures) {
        triggerAlert('token_refresh_threshold', {
          count: recentEvents.length,
          threshold: ALERT_THRESHOLD.tokenRefreshFailures
        })
      }
      break
  }
}

/**
 * Triggers a security alert
 * @param {string} alertType - Type of alert
 * @param {Object} details - Alert details
 */
function triggerAlert(alertType, details) {
  const alert = {
    type: 'security_alert',
    alertType,
    timestamp: new Date().toISOString(),
    details
  }

  // Dispatch custom event for components to listen to
  window.dispatchEvent(new CustomEvent('security-alert', { detail: alert }))

  // Log alert
  console.error(`[Security Alert] ${alertType}:`, alert)

  // Store alert in secure storage
  persistCriticalEvent(alert)
}

/**
 * Persists critical security events to secure storage
 * @param {Object} event - Security event or alert
 */
async function persistCriticalEvent(event) {
  try {
    if (!secureStorageRef) {
      console.warn('Secure storage not available for persisting critical event')
      return
    }
    
    const criticalEvents = await getCriticalEvents()
    criticalEvents.push(event)
    
    // Maintain storage size
    if (criticalEvents.length > 50) {
      criticalEvents.splice(0, criticalEvents.length - 50)
    }

    await secureStorageRef.setItem('critical_security_events', criticalEvents, false)
  } catch (error) {
    console.error('Failed to persist critical security event:', error)
  }
}

/**
 * Retrieves critical security events from secure storage
 * @returns {Array} - Array of critical events
 */
async function getCriticalEvents() {
  try {
    if (!secureStorageRef) {
      console.warn('Secure storage not available for retrieving critical events')
      return []
    }
    
    const events = await secureStorageRef.getItem('critical_security_events', false)
    return Array.isArray(events) ? events : []
  } catch (error) {
    console.error('Failed to retrieve critical security events:', error)
    return []
  }
}

/**
 * Gets security statistics
 * @returns {Object} - Security statistics
 */
export function getSecurityStats() {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const recentEvents = securityEvents.filter(event => new Date(event.timestamp) > oneHourAgo)
  const dailyEvents = securityEvents.filter(event => new Date(event.timestamp) > oneDayAgo)

  const stats = {
    totalEvents: securityEvents.length,
    recentEvents: recentEvents.length,
    dailyEvents: dailyEvents.length,
    eventTypes: {},
    severityBreakdown: {},
    storageStats: secureStorageRef ? secureStorageRef.getStorageStats() : null
  }

  // Count event types
  dailyEvents.forEach(event => {
    stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1
    stats.severityBreakdown[event.severity] = (stats.severityBreakdown[event.severity] || 0) + 1
  })

  return stats
}

/**
 * Clears security event log
 */
export function clearSecurityEvents() {
  securityEvents.length = 0
  return { success: true, message: 'Security events cleared' }
}

/**
 * Exports security events for analysis
 * @returns {Object} - Exported security data
 */
export function exportSecurityData() {
  return {
    events: securityEvents,
    stats: getSecurityStats(),
    exportTime: new Date().toISOString(),
    version: '1.0.0'
  }
}

/**
 * Initializes security monitoring
 */
export function initSecurityMonitoring() {
  // Monitor storage quota warnings
  if (secureStorageRef) {
    const originalSetItem = secureStorageRef.setItem.bind(secureStorageRef)
    secureStorageRef.setItem = async function(key, value, isSensitive) {
      try {
        return await originalSetItem(key, value, isSensitive)
      } catch (error) {
        if (error.message && error.message.includes('quota')) {
          logSecurityEvent(SECURITY_EVENTS.STORAGE_QUOTA_EXCEEDED, {
            key,
            isSensitive,
            error: error.message
          })
        }
        throw error
      }
    }
  }

  // Monitor XSS attempts
  const originalValidateData = window.validateDataForStorage
  if (originalValidateData) {
    window.validateDataForStorage = function(data) {
      const result = originalValidateData(data)
      if (!result) {
        logSecurityEvent(SECURITY_EVENTS.XSS_ATTEMPT, {
          data: JSON.stringify(data).substring(0, 200), // Limit data size
          blocked: true
        })
      }
      return result
    }
  }

  console.log('Security monitoring initialized')
}

// Export event types for external use
export { SECURITY_EVENTS }
