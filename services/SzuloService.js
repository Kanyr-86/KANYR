const SzuloRepository = require('../repositories/SzuloRepository');

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
    return this.szuloRepository.findAll(options);
  }

  /**
   * Get parent by ID
   * @param {number} id - Parent ID
   * @param {boolean} includeRelations - Whether to include relations
   * @returns {Promise<Object|null>} Parent object or null
   */
  async getSzuloById(id, includeRelations = true) {
    return this.szuloRepository.findById(id, includeRelations);
  }

  /**
   * Create a new parent
   * @param {Object} szuloData - Parent data
   * @returns {Promise<Object>} Created parent
   */
  async createSzulo(szuloData) {
    return this.szuloRepository.create(szuloData);
  }

  /**
   * Update a parent
   * @param {number} id - Parent ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated parent
   */
  async updateSzulo(id, updates) {
    return this.szuloRepository.update(id, updates);
  }

  /**
   * Delete a parent
   * @param {number} id - Parent ID
   * @returns {Promise<void>}
   */
  async deleteSzulo(id) {
    return this.szuloRepository.delete(id);
  }
}

module.exports = SzuloService;
