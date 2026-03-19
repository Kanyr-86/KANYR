/**
 * Secure Storage Service
 * Provides secure storage for sensitive data with memory-first approach
 * and graceful fallback to localStorage with encryption for non-sensitive data
 */

import CryptoJS from 'crypto-js'
import { logSecurityEvent, SECURITY_EVENTS, setSecureStorage } from '../utils/securityMonitor'

// Configuration
const STORAGE_KEYS = {
  TOKEN: 'secure_token',
  USER: 'secure_user',
  THEME: 'theme',
  CSRF_TOKEN: 'csrf_token'
}

const ENCRYPTION_KEY = 'kanyr-storage-encryption-key-256-bit'

// In-memory storage for sensitive data
const memoryStorage = {
  [STORAGE_KEYS.TOKEN]: null,
  [STORAGE_KEYS.USER]: null,
  [STORAGE_KEYS.CSRF_TOKEN]: null
}

// Storage statistics and monitoring
const storageStats = {
  localStorageWrites: 0,
  localStorageReads: 0,
  localStorageErrors: 0,
  quotaWarnings: 0,
  lastCleanup: null
}

// Cleanup thresholds
const CLEANUP_THRESHOLD = 0.8; // Start cleanup at 80% capacity
const MAX_STORAGE_ITEMS = 50; // Maximum number of items to keep

/**
 * Encrypts data using AES-256-CBC
 * @param {string} data - Data to encrypt
 * @returns {string} - Encrypted data in base64 format
 */
function encryptData(data) {
  try {
    const ciphertext = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY)
    return ciphertext.toString()
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts data using AES-256-CBC
 * @param {string} encryptedData - Encrypted data in base64 format
 * @returns {string} - Decrypted data
 */
function decryptData(encryptedData) {
  try {
    // Check if encryptedData is valid
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid encrypted data format')
    }
    
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    
    if (!decrypted) {
      throw new Error('Failed to decrypt data - empty result')
    }
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data: ' + error.message)
  }
}

/**
 * Checks if localStorage is available and working
 * @returns {boolean} - True if localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Checks localStorage quota and available space with more accurate measurement
 * @returns {Object} - Quota information
 */
function checkStorageQuota() {
  try {
    const testKey = '__quota_test__'
    const testValue = 'x'.repeat(1024) // 1KB test data
    
    // Try to store increasing amounts of data
    let size = 0
    let available = 0
    
    while (size < 10240) { // Try up to 10MB
      try {
        localStorage.setItem(testKey, testValue.repeat(size / 1024 + 1))
        available = size + 1024
        size += 1024
      } catch (e) {
        break
      }
    }
    
    localStorage.removeItem(testKey)
    
    // Calculate used space
    let usedSpace = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = localStorage.getItem(key)
      usedSpace += (key.length + (value ? value.length : 0)) * 2 // UTF-16 characters
    }
    
    const totalSpace = usedSpace + available
    
    return {
      available: available,
      used: usedSpace,
      total: totalSpace,
      isFull: available === 0,
      usagePercentage: totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0,
      error: null
    }
  } catch (error) {
    return {
      available: 0,
      used: 0,
      total: 0,
      isFull: true,
      usagePercentage: 100,
      error: error.message
    }
  }
}

/**
 * Performs intelligent cleanup of localStorage when approaching quota limits
 * @returns {Object} - Cleanup results
 */
function performCleanup() {
  try {
    const quota = checkStorageQuota()
    
    if (!quota.isFull && quota.usagePercentage < CLEANUP_THRESHOLD) {
      return { success: true, cleaned: 0, reason: 'No cleanup needed' }
    }
    
    let cleaned = 0
    const keysToRemove = []
    
    // Remove non-essential items first
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      // Skip essential keys
      if (Object.values(STORAGE_KEYS).includes(key)) {
        continue
      }
      
      // Remove old or corrupted items
      try {
        const value = localStorage.getItem(key)
        if (!value) {
          keysToRemove.push(key)
          continue
        }
        
        // Try to decrypt and parse to check if data is valid
        try {
          const decrypted = decryptData(value)
          JSON.parse(decrypted)
        } catch (e) {
          // Data is corrupted, remove it
          keysToRemove.push(key)
        }
      } catch (e) {
        keysToRemove.push(key)
      }
    }
    
    // Remove excess items if we're still over the threshold
    if (keysToRemove.length === 0 && quota.usagePercentage >= CLEANUP_THRESHOLD) {
      // Remove oldest items (localStorage doesn't have timestamps, so we remove randomly)
      const allKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!Object.values(STORAGE_KEYS).includes(key)) {
          allKeys.push(key)
        }
      }
      
      // Remove 20% of non-essential items
      const itemsToRemove = Math.ceil(allKeys.length * 0.2)
      for (let i = 0; i < itemsToRemove; i++) {
        if (allKeys[i]) {
          keysToRemove.push(allKeys[i])
        }
      }
    }
    
    // Perform cleanup
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key)
        cleaned++
      } catch (e) {
        console.warn(`Failed to remove key ${key}:`, e)
      }
    })
    
    storageStats.lastCleanup = new Date().toISOString()
    
    return {
      success: true,
      cleaned,
      reason: cleaned > 0 ? 'Cleanup completed' : 'No items to clean'
    }
  } catch (error) {
    return {
      success: false,
      cleaned: 0,
      reason: `Cleanup failed: ${error.message}`
    }
  }
}

/**
 * Validates and sanitizes data before storage to prevent XSS
 * @param {any} data - Data to validate
 * @returns {boolean} - Whether data is safe to store
 */
function validateDataForStorage(data) {
  try {
    const jsonString = JSON.stringify(data)
    
    // Check for potential XSS patterns
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
      /<embed[\s\S]*?>[\s\S]*?<\/embed>/gi
    ]
    
    for (const pattern of xssPatterns) {
      if (pattern.test(jsonString)) {
        console.warn('Potential XSS attempt detected in data:', data)
        // Log security event
        logSecurityEvent(SECURITY_EVENTS.XSS_ATTEMPT, {
          data: jsonString.substring(0, 200), // Limit data size for logging
          pattern: pattern.toString(),
          blocked: true
        })
        return false
      }
    }
    
    // Check data size limits
    const dataSize = jsonString.length * 2 // UTF-16 characters
    if (dataSize > 1024 * 1024) { // 1MB limit per item
      console.warn('Data size too large for storage:', dataSize)
      // Log storage size warning
      logSecurityEvent(SECURITY_EVENTS.STORAGE_QUOTA_WARNING, {
        dataSize,
        limit: 1024 * 1024,
        type: 'data_size_exceeded'
      })
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error validating data for storage:', error)
    return false
  }
}

/**
 * Secure Storage Service
 */
export const secureStorage = {
  /**
   * Stores sensitive data in memory first, then localStorage with encryption
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {boolean} isSensitive - Whether the data is sensitive
   */
  async setItem(key, value, isSensitive = true) {
    try {
      // Validate data for XSS and size before storage
      if (!validateDataForStorage(value)) {
        throw new Error('Invalid data - potential security risk or size too large')
      }

      const stringValue = JSON.stringify(value)
      
      // For sensitive data, store only in memory
      if (isSensitive) {
        memoryStorage[key] = stringValue
      }
      
      // Always try to store in localStorage with encryption for persistence
      if (isLocalStorageAvailable()) {
        const quota = checkStorageQuota()
        
        // Perform cleanup if we're approaching the threshold
        if (quota.usagePercentage >= CLEANUP_THRESHOLD) {
          const cleanupResult = performCleanup()
          console.log('Storage cleanup performed:', cleanupResult)
          
          // Recheck quota after cleanup
          const updatedQuota = checkStorageQuota()
          if (updatedQuota.isFull) {
            console.warn('localStorage still full after cleanup, skipping localStorage storage')
            if (!isSensitive) {
              throw new Error('localStorage quota exceeded even after cleanup')
            }
          }
        }
        
        if (!quota.isFull) {
          try {
            const encryptedValue = await encryptData(stringValue)
            localStorage.setItem(key, encryptedValue)
            storageStats.localStorageWrites++
          } catch (storageError) {
            storageStats.localStorageErrors++
            console.warn(`localStorage write failed for ${key}:`, storageError)
            
            // If localStorage fails but we have memory storage for sensitive data, continue
            if (!isSensitive) {
              throw new Error('Failed to write to localStorage')
            }
          }
        }
      } else {
        console.warn('localStorage not available, using memory storage only')
        if (!isSensitive) {
          throw new Error('localStorage not available')
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error(`Failed to store ${key}:`, error)
      throw error
    }
  },

  /**
   * Retrieves data from memory first, then localStorage
   * @param {string} key - Storage key
   * @param {boolean} isSensitive - Whether the data is sensitive
   * @returns {any|null} - Retrieved value or null
   */
  async getItem(key, isSensitive = true) {
    try {
      // For sensitive data, check memory first
      if (isSensitive && memoryStorage[key]) {
        try {
          return JSON.parse(memoryStorage[key])
        } catch (parseError) {
          console.warn(`Failed to parse memory data for ${key}:`, parseError)
          memoryStorage[key] = null
        }
      }
      
      // Try to get from localStorage
      if (isLocalStorageAvailable()) {
        const encryptedValue = localStorage.getItem(key)
        if (encryptedValue) {
          storageStats.localStorageReads++
          try {
            const decryptedValue = await decryptData(encryptedValue)
            const parsedValue = JSON.parse(decryptedValue)
            
            // For sensitive data, also store in memory for faster access
            if (isSensitive) {
              memoryStorage[key] = decryptedValue
            }
            
            return parsedValue
          } catch (decryptError) {
            storageStats.localStorageErrors++
            console.warn(`Failed to decrypt ${key}:`, decryptError)
            // Remove corrupted data
            try {
              localStorage.removeItem(key)
            } catch (removeError) {
              console.error(`Failed to remove corrupted key ${key}:`, removeError)
            }
            return null
          }
        }
      }
      
      return null
    } catch (error) {
      storageStats.localStorageErrors++
      console.error(`Failed to retrieve ${key}:`, error)
      return null
    }
  },

  /**
   * Gets detailed storage statistics and monitoring information
   * @returns {Object} - Storage statistics
   */
  getStorageStats() {
    const quota = checkStorageQuota()
    
    return {
      stats: storageStats,
      quota: quota,
      memoryUsage: {
        totalKeys: Object.keys(memoryStorage).length,
        usedKeys: Object.values(memoryStorage).filter(v => v !== null).length
      },
      recommendations: this.getStorageRecommendations(quota)
    }
  },

  /**
   * Gets storage recommendations based on current usage
   * @param {Object} quota - Quota information
   * @returns {Array} - Array of recommendations
   */
  getStorageRecommendations(quota) {
    const recommendations = []
    
    if (quota.usagePercentage >= 90) {
      recommendations.push({
        type: 'critical',
        message: 'Storage usage is critically high. Consider cleaning up non-essential data.',
        action: 'performCleanup'
      })
    } else if (quota.usagePercentage >= 70) {
      recommendations.push({
        type: 'warning',
        message: 'Storage usage is getting high. Monitor usage closely.',
        action: 'monitorUsage'
      })
    }
    
    if (storageStats.localStorageErrors > 10) {
      recommendations.push({
        type: 'error',
        message: 'High number of localStorage errors detected. Check browser storage settings.',
        action: 'checkStorageSettings'
      })
    }
    
    if (!isLocalStorageAvailable()) {
      recommendations.push({
        type: 'info',
        message: 'localStorage is not available. Using memory-only storage.',
        action: 'enableLocalStorage'
      })
    }
    
    return recommendations
  },

  /**
   * Forces a cleanup of localStorage
   * @returns {Object} - Cleanup results
   */
  forceCleanup() {
    return performCleanup()
  },

  /**
   * Resets storage statistics
   */
  resetStats() {
    storageStats.localStorageWrites = 0
    storageStats.localStorageReads = 0
    storageStats.localStorageErrors = 0
    storageStats.quotaWarnings = 0
    storageStats.lastCleanup = null
  },

  /**
   * Removes data from both memory and localStorage
   * @param {string} key - Storage key
   */
  removeItem(key) {
    try {
      // Remove from memory
      if (memoryStorage[key]) {
        memoryStorage[key] = null
      }
      
      // Remove from localStorage
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(key)
      }
      
      return { success: true }
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error)
      throw error
    }
  },

  /**
   * Clears all storage (memory and localStorage)
   */
  clear() {
    try {
      // Clear memory storage
      Object.keys(memoryStorage).forEach(key => {
        memoryStorage[key] = null
      })
      
      // Clear localStorage
      if (isLocalStorageAvailable()) {
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key)
        })
      }
      
      return { success: true }
    } catch (error) {
      console.error('Failed to clear storage:', error)
      throw error
    }
  },

  /**
   * Gets storage status and quota information
   * @returns {Object} - Storage status
   */
  getStorageStatus() {
    const memoryStatus = Object.keys(memoryStorage).reduce((acc, key) => {
      acc[key] = memoryStorage[key] !== null && memoryStorage[key] !== undefined
      return acc
    }, {})

    const localStorageStatus = isLocalStorageAvailable() ? checkStorageQuota() : {
      available: 0,
      isFull: true,
      error: 'localStorage not available'
    }

    return {
      memory: memoryStatus,
      localStorage: localStorageStatus,
      isWorking: localStorageStatus.available > 0 || !localStorageStatus.isFull
    }
  },

  // Convenience methods for specific data types
  setToken(token) {
    return this.setItem(STORAGE_KEYS.TOKEN, token, true)
  },

  getToken() {
    return this.getItem(STORAGE_KEYS.TOKEN, true)
  },

  removeToken() {
    return this.removeItem(STORAGE_KEYS.TOKEN)
  },

  setUser(user) {
    return this.setItem(STORAGE_KEYS.USER, user, true)
  },

  getUser() {
    return this.getItem(STORAGE_KEYS.USER, true)
  },

  removeUser() {
    return this.removeItem(STORAGE_KEYS.USER)
  },

  setTheme(theme) {
    return this.setItem(STORAGE_KEYS.THEME, theme, false)
  },

  getTheme() {
    return this.getItem(STORAGE_KEYS.THEME, false)
  },

  setCsrfToken(token) {
    return this.setItem(STORAGE_KEYS.CSRF_TOKEN, token, false)
  },

  getCsrfToken() {
    return this.getItem(STORAGE_KEYS.CSRF_TOKEN, false)
  }
}

// Export storage keys for use in other modules
export { STORAGE_KEYS }

// Register secure storage with security monitor after module is loaded
setSecureStorage(secureStorage)

// Initialize security monitoring now that secure storage is available
import { initSecurityMonitoring } from '../utils/securityMonitor'
initSecurityMonitoring()
