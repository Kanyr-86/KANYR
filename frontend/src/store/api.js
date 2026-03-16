import { defineStore } from 'pinia'

/**
 * LRU Cache implementation with TTL support
 */
class LRUCache {
  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    this.cache = new Map()
    this.accessOrder = new Map() // Track access order for LRU
    this.cleanupInterval = null
    
    // Start periodic cleanup
    this.startCleanup()
  }

  /**
   * Generate a hash-based cache key to prevent collisions
   */
  generateKey(url, params = {}, method = 'GET') {
    const keyData = {
      url,
      method,
      params: JSON.stringify(params)
    }
    // Simple hash function
    const str = JSON.stringify(keyData)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `cache_${Math.abs(hash)}_${Date.now()}`
  }

  /**
   * Set item in cache with LRU eviction
   */
  set(key, data, ttl = this.defaultTTL) {
    // If key exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      })
      this.accessOrder.set(key, Date.now())
      return
    }

    // If cache is full, evict LRU item
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    // Add new item
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
    this.accessOrder.set(key, Date.now())
  }

  /**
   * Get item from cache
   */
  get(key) {
    const item = this.cache.get(key)
    if (!item) {
      return null
    }

    const now = Date.now()
    
    // Check if expired
    if (now - item.timestamp > item.ttl) {
      this.delete(key)
      return null
    }

    // Update access time for LRU
    this.accessOrder.set(key, now)
    
    return item.data
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    this.cache.delete(key)
    this.accessOrder.delete(key)
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    if (this.accessOrder.size === 0) return

    let oldestKey = null
    let oldestTime = Infinity

    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  /**
   * Clear cache with optional pattern matching
   */
  clear(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.delete(key)
        }
      }
    } else {
      this.cache.clear()
      this.accessOrder.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hitCount: this.hitCount,
      missCount: this.missCount
    }
  }

  /**
   * Start periodic cleanup of expired items
   */
  startCleanup() {
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.delete(key)
        }
      }
    }, 60000) // Cleanup every minute
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    this.stopCleanup()
    this.cache.clear()
    this.accessOrder.clear()
  }
}

export const useApiStore = defineStore('api', {
  state: () => ({
    cache: new LRUCache(100, 5 * 60 * 1000), // 100 items, 5 minutes default TTL
    loadingStates: new Map(),
    hitCount: 0,
    missCount: 0
  }),
  
  getters: {
    cacheStats() {
      return this.cache.getStats()
    },
    
    cacheHitRate() {
      const stats = this.cacheStats
      return stats.hitRate
    }
  },
  
  actions: {
    /**
     * Set cache with automatic key generation and collision prevention
     */
    setCache(url, data, params = {}, method = 'GET', ttl = null) {
      const key = this.cache.generateKey(url, params, method)
      this.cache.set(key, data, ttl)
      return key
    },
    
    /**
     * Get cache with automatic key generation
     */
    getCache(url, params = {}, method = 'GET') {
      const key = this.cache.generateKey(url, params, method)
      const result = this.cache.get(key)
      
      if (result) {
        this.hitCount++
      } else {
        this.missCount++
      }
      
      return result
    },
    
    /**
     * Clear cache with pattern matching
     */
    clearCache(pattern = null) {
      this.cache.clear(pattern)
    },
    
    /**
     * Set loading state
     */
    setLoading(key, loading) {
      this.loadingStates.set(key, loading)
    },
    
    /**
     * Get loading state
     */
    getLoading(key) {
      return this.loadingStates.get(key) || false
    },
    
    /**
     * Get cache key for manual operations
     */
    getCacheKey(url, params = {}, method = 'GET') {
      return this.cache.generateKey(url, params, method)
    },
    
    /**
     * Manual cache eviction by key
     */
    evictCache(key) {
      this.cache.delete(key)
    },
    
    /**
     * Get all cache keys (for debugging)
     */
    getCacheKeys() {
      return Array.from(this.cache.cache.keys())
    },
    
    /**
     * Reset cache statistics
     */
    resetStats() {
      this.hitCount = 0
      this.missCount = 0
    },
    
    /**
     * Cleanup cache (called on store destruction)
     */
    cleanup() {
      this.cache.destroy()
      this.loadingStates.clear()
      this.resetStats()
    }
  },
  
  // Cleanup on store destruction
  $onDestroy() {
    this.cleanup()
  }
})
