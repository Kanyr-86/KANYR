/**
 * CacheService - Query result caching for frequently accessed data
 * Implements in-memory caching with TTL (Time To Live) support
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    this.statisticsTTL = 2 * 60 * 1000; // 2 minutes for statistics (more volatile)
    this.listsTTL = 10 * 60 * 1000; // 10 minutes for lists (less volatile)
    
    // Cache key patterns for different data types
    this.keyPatterns = {
      ROOMS_LIST: 'rooms:list',
      ROOMS_AVAILABLE: 'rooms:available',
      ROOM_STATISTICS: 'rooms:statistics',
      ROOM_OCCUPANCY: 'rooms:occupancy',
      STUDENTS_LIST: 'students:list',
      STUDENTS_STATISTICS: 'students:statistics',
      PARENTS_LIST: 'parents:list',
      USERS_LIST: 'users:list',
      SINGLE_ROOM: 'rooms:single',
      SINGLE_STUDENT: 'students:single',
      SINGLE_PARENT: 'parents:single',
      SINGLE_USER: 'users:single'
    };
  }

  /**
   * Generate cache key with optional parameters
   * @param {string} pattern - Base pattern from keyPatterns
   * @param {Object} params - Optional parameters to include in key
   * @returns {string} - Generated cache key
   */
  generateKey(pattern, params = null) {
    if (!params) return pattern;
    
    // Sort keys for consistent ordering
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${pattern}:${sortedParams}`;
  }

  /**
   * Get cached data by key
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached data or null if expired/not found
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached data with optional TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, data, ttl = null) {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Delete cached data by key
   * @param {string} key - Cache key to delete
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data or by pattern
   * @param {string} pattern - Optional pattern to match keys for deletion
   */
  clear(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache entries by pattern
   * @param {string} pattern - Pattern to match for invalidation
   */
  invalidatePattern(pattern) {
    this.clear(pattern);
  }

  /**
   * Get or compute cached value
   * @param {string} key - Cache key
   * @param {Function} computeFunction - Function to compute value if not cached
   * @param {number} ttl - Optional TTL
   * @returns {Promise<any>} - Cached or computed value
   */
  async getOrCompute(key, computeFunction, ttl = null) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await computeFunction();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate room-related caches
   * Call this when room data changes
   */
  invalidateRoomCache() {
    this.invalidatePattern('rooms:');
  }

  /**
   * Invalidate student-related caches
   * Call this when student data changes
   */
  invalidateStudentCache() {
    this.invalidatePattern('students:');
  }

  /**
   * Invalidate parent-related caches
   * Call this when parent data changes
   */
  invalidateParentCache() {
    this.invalidatePattern('parents:');
  }

  /**
   * Invalidate user-related caches
   * Call this when user data changes
   */
  invalidateUserCache() {
    this.invalidatePattern('users:');
  }

  /**
   * Invalidate all statistics caches
   * Call this when any data that affects statistics changes
   */
  invalidateStatisticsCache() {
    this.invalidatePattern(':statistics');
    this.invalidatePattern(':occupancy');
  }

  /**
   * Get cache statistics for monitoring
   * @returns {Object} - Cache statistics
   */
  getStatistics() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now <= value.expiresAt) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: this._calculateHitRate()
    };
  }

  /**
   * Clean up expired cache entries
   * Call this periodically or before/after heavy operations
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Private hit rate tracking
  _hits = 0;
  _misses = 0;

  _calculateHitRate() {
    const total = this._hits + this._misses;
    return total === 0 ? 0 : (this._hits / total) * 100;
  }

  trackHit() {
    this._hits++;
  }

  trackMiss() {
    this._misses++;
  }
}

// Export singleton instance
module.exports = new CacheService();
