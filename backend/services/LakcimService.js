const LakcimRepository = require('../repositories/LakcimRepository');

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
    return this.lakcimRepository.findAll(options);
  }

  /**
   * Get address by ID
   * @param {number} id - Address ID
   * @param {boolean} includeRelations - Whether to include relations
   * @returns {Promise<Object|null>} Address object or null
   */
  async getLakcimById(id, includeRelations = true) {
    return this.lakcimRepository.findById(id, includeRelations);
  }

  /**
   * Create a new address
   * @param {Object} lakcimData - Address data
   * @returns {Promise<Object>} Created address
   */
  async createLakcim(lakcimData) {
    return this.lakcimRepository.create(lakcimData);
  }

  /**
   * Update an address
   * @param {number} id - Address ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated address
   */
  async updateLakcim(id, updates) {
    return this.lakcimRepository.update(id, updates);
  }

  /**
   * Delete an address
   * @param {number} id - Address ID
   * @returns {Promise<void>}
   */
  async deleteLakcim(id) {
    return this.lakcimRepository.delete(id);
  }

  /**
   * Get addresses by city
   * @param {string} varos - City name
   * @returns {Promise<Array>} Array of addresses
   */
  async getLakcimsByCity(varos) {
    return this.lakcimRepository.findByCity(varos);
  }
}

module.exports = LakcimService;
