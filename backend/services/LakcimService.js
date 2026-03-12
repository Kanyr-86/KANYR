const LakcimRepository = require('../repositories/LakcimRepository');
const cacheService = require('./CacheService');

class LakcimService {
  constructor(db) {
    this.lakcimRepository = new LakcimRepository(db);
  }

  /**
   * Get all addresses
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of addresses
   */
  async getAllLakcims(options = {}) {
    // Generate cache key based on options
    const cacheKey = cacheService.generateKey('addresses:list', {
      limit: options.limit || 'all',
      offset: options.offset || 0,
      sort: options.sort || 'default'
    });

    return await cacheService.getOrCompute(cacheKey, async () => {
      return this.lakcimRepository.findAll(options);
    }, cacheService.listsTTL);
  }

  /**
   * Get address by ID
   * @param {number} id - Address ID
   * @param {boolean} includeRelations - Whether to include relations
   * @returns {Promise<Object|null>} Address object or null
   */
  async getLakcimById(id, includeRelations = true) {
    // Cache individual address lookups
    const cacheKey = cacheService.generateKey('addresses:single', { 
      id, 
      include: includeRelations 
    });

    return await cacheService.getOrCompute(cacheKey, async () => {
      return this.lakcimRepository.findById(id, includeRelations);
    }, cacheService.defaultTTL);
  }

  /**
   * Create a new address
   * @param {Object} lakcimData - Address data
   * @returns {Promise<Object>} Created address
   */
  async createLakcim(lakcimData) {
    const result = await this.lakcimRepository.create(lakcimData);
    // Invalidate address list caches
    cacheService.invalidatePattern('addresses:');
    return result;
  }

  /**
   * Update an address
   * @param {number} id - Address ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated address
   */
  async updateLakcim(id, updates) {
    const result = await this.lakcimRepository.update(id, updates);
    // Invalidate address caches
    cacheService.invalidatePattern('addresses:');
    return result;
  }

  /**
   * Delete an address
   * @param {number} id - Address ID
   * @returns {Promise<void>}
   */
  async deleteLakcim(id) {
    await this.lakcimRepository.delete(id);
    // Invalidate address caches
    cacheService.invalidatePattern('addresses:');
  }

  /**
   * Get addresses by city
   * @param {string} varos - City name
   * @returns {Promise<Array>} Array of addresses
   */
  async getLakcimsByCity(varos) {
    // Cache city-based queries
    const cacheKey = cacheService.generateKey('addresses:by_city', { varos });

    return await cacheService.getOrCompute(cacheKey, async () => {
      return this.lakcimRepository.findByCity(varos);
    }, cacheService.defaultTTL);
  }
}

module.exports = LakcimService;
