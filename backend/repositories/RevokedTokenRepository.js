const logger = require('../utils/logger');
const { Op } = require('sequelize');

class RevokedTokenRepository {
  constructor(db) {
    this.db = db;
    this.RevokedToken = db.RevokedToken;
    this.Op = Op;
  }

  /**
   * Token hozzáadása a feketelistához
   * @param {string} token - A visszavonandó JWT token
   * @param {number} userId - Felhasználó azonosító
   * @param {Date} expiresAt - Token lejárati ideje
   * @returns {Promise<Object>} - Létrehozott bejegyzés
   */
  async add(token, userId, expiresAt) {
    try {
      const revokedToken = await this.RevokedToken.create({
        token,
        user_id: userId,
        expires_at: expiresAt,
        revoked_at: new Date()
      });

      logger.info('Token added to blacklist', { userId, expiresAt });
      return revokedToken;
    } catch (error) {
      // Ha már létezik (pl. duplikált kijelentkezés), nem dobunk hibát
      if (error.name === 'SequelizeUniqueConstraintError') {
        logger.warn('Token already in blacklist', { userId });
        return null;
      }
      logger.error('Error adding token to blacklist', { error: error.message, userId });
      throw new Error(`Hiba a token feketelistához adása közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Ellenőrzi, hogy a token a feketelistán van-e
   * @param {string} token - Ellenőrizendő token
   * @returns {Promise<boolean>} - Igaz, ha a token a feketelistán van
   */
  async isRevoked(token) {
    try {
      const revokedToken = await this.RevokedToken.findOne({
        where: { token }
      });
      return !!revokedToken;
    } catch (error) {
      logger.error('Error checking token blacklist', { error: error.message });
      throw new Error(`Hiba a token ellenőrzése közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Lekérdezi a felhasználó összes visszavont tokenjét
   * @param {number} userId - Felhasználó azonosító
   * @returns {Promise<Array>} - Visszavont tokenek tömbje
   */
  async findByUserId(userId) {
    try {
      const tokens = await this.RevokedToken.findAll({
        where: { user_id: userId },
        order: [['revoked_at', 'DESC']]
      });
      return tokens;
    } catch (error) {
      logger.error('Error finding revoked tokens by user', { error: error.message, userId });
      throw new Error(`Hiba a tokenek lekérdezése közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Törli a lejárt tokeneket a feketelistáról (takarítás)
   * @returns {Promise<number>} - Törölt rekordok száma
   */
  async cleanupExpiredTokens() {
    try {
      const now = new Date();
      const deleted = await this.RevokedToken.destroy({
        where: {
          expires_at: {
            [this.Op.lt]: now
          }
        }
      });

      if (deleted > 0) {
        logger.info('Cleaned up expired revoked tokens', { count: deleted });
      }
      return deleted;
    } catch (error) {
      logger.error('Error cleaning up expired tokens', { error: error.message });
      throw new Error(`Hiba a lejárt tokenek törlése közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Összes visszavont token törlése egy felhasználótól (pl. jelszó változtatáskor)
   * @param {number} userId - Felhasználó azonosító
   * @returns {Promise<number>} - Törölt rekordok száma
   */
  async revokeAllUserTokens(userId) {
    try {
      const deleted = await this.RevokedToken.destroy({
        where: { user_id: userId }
      });

      logger.info('All tokens revoked for user', { userId, count: deleted });
      return deleted;
    } catch (error) {
      logger.error('Error revoking all user tokens', { error: error.message, userId });
      throw new Error(`Hiba a felhasználó tokenjeinek törlése közben: ${error.message}`, { cause: error });
    }
  }
}

module.exports = RevokedTokenRepository;
