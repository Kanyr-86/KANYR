const SzuloRepository = require('../repositories/SzuloRepository');
const cacheService = require('./CacheService');

class SzuloService {
  constructor(db) {
    this.szuloRepository = new SzuloRepository(db);
  }

  /**
   * Get all parents
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of parents
   */
  async getAllSzulos(options = {}) {
    // Generate cache key based on options
    const cacheKey = cacheService.generateKey(cacheService.keyPatterns.PARENTS_LIST, {
      limit: options.limit || 'all',
      offset: options.offset || 0,
      sort: options.sort || 'default'
    });

    return await cacheService.getOrCompute(cacheKey, async () => {
      return this.szuloRepository.findAll(options);
    }, cacheService.listsTTL);
  }

  /**
   * Get parent by ID
   * @param {number} id - Parent ID
   * @param {boolean} includeRelations - Whether to include relations
   * @returns {Promise<Object|null>} Parent object or null
   */
  async getSzuloById(id, includeRelations = true) {
    // Cache individual parent lookups
    const cacheKey = cacheService.generateKey(cacheService.keyPatterns.SINGLE_PARENT, { 
      id, 
      include: includeRelations 
    });

    return await cacheService.getOrCompute(cacheKey, async () => {
      return this.szuloRepository.findById(id, includeRelations);
    }, cacheService.defaultTTL);
  }

  /**
   * Create a new parent
   * @param {Object} szuloData - Parent data
   * @returns {Promise<Object>} Created parent
   */
  async createSzulo(szuloData) {
    const result = await this.szuloRepository.create(szuloData);
    // Invalidate parent list caches
    cacheService.invalidateParentCache();
    return result;
  }

  /**
   * Update a parent
   * @param {number} id - Parent ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated parent
   */
  async updateSzulo(id, updates) {
    const result = await this.szuloRepository.update(id, updates);
    // Invalidate parent caches
    cacheService.invalidateParentCache();
    // Invalidate specific parent cache
    cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_PARENT, { 
      id, 
      include: true 
    }));
    cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_PARENT, { 
      id, 
      include: false 
    }));
    return result;
  }

  /**
   * Delete a parent
   * @param {number} id - Parent ID
   * @returns {Promise<void>}
   */
  async deleteSzulo(id) {
    await this.szuloRepository.delete(id);
    // Invalidate parent caches
    cacheService.invalidateParentCache();
    // Invalidate specific parent cache
    cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_PARENT, { 
      id, 
      include: true 
    }));
    cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_PARENT, { 
      id, 
      include: false 
    }));
  }
}

module.exports = SzuloService;
