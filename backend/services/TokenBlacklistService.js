const RevokedTokenRepository = require('../repositories/RevokedTokenRepository');
const { verifyToken } = require('../utils/authUtils');
const logger = require('../utils/logger');

/**
 * Token Blacklist Service - JWT token visszavonás kezelése
 * Singleton pattern a konzisztens példánykezeléshez
 */
class TokenBlacklistService {
  constructor(db) {
    if (!TokenBlacklistService.instance) {
      this.db = db;
      this.revokedTokenRepository = new RevokedTokenRepository(db);
      TokenBlacklistService.instance = this;
    }
    return TokenBlacklistService.instance;
  }

  /**
   * Szervíz inicializálása adatbázissal
   * @param {Object} db - Adatbázis objektum
   */
  static initialize(db) {
    if (!TokenBlacklistService.instance) {
      TokenBlacklistService.instance = new TokenBlacklistService(db);
    }
    TokenBlacklistService.instance.db = db;
    TokenBlacklistService.instance.revokedTokenRepository = new RevokedTokenRepository(db);
    return TokenBlacklistService.instance;
  }

  /**
   * Token visszavonása (kijelentkezés)
   * @param {string} token - A visszavonandó JWT token
   * @returns {Promise<Object>} - Visszavonási eredmény
   */
  async revokeToken(token) {
    try {
      // Token dekódolása a lejárati idő lekérdezéséhez
      const decoded = verifyToken(token);
      const expiresAt = new Date(decoded.exp * 1000); // Unix timestamp -> Date

      // Token hozzáadása a feketelistához
      await this.revokedTokenRepository.add(token, decoded.userId, expiresAt);

      logger.info('Token successfully revoked', {
        userId: decoded.userId,
        expiresAt: expiresAt.toISOString()
      });

      return {
        success: true,
        message: 'Token sikeresen visszavonva',
        expiresAt: expiresAt.toISOString()
      };
    } catch (error) {
      logger.error('Error revoking token', { error: error.message });
      throw new Error(`Hiba a token visszavonása közben: ${error.message}`);
    }
  }

  /**
   * Ellenőrzi, hogy a token visszavonva lett-e
   * @param {string} token - Ellenőrizendő token
   * @returns {Promise<boolean>} - Igaz, ha a token visszavonva
   */
  async isTokenRevoked(token) {
    try {
      return await this.revokedTokenRepository.isRevoked(token);
    } catch (error) {
      logger.error('Error checking token revocation status', { error: error.message });
      // Hiba esetén biztonsági okokból úgy tekintjük, mintha visszavonva lenne
      return true;
    }
  }

  /**
   * Lejárt tokenek törlése a feketelistáról (takarítás)
   * @returns {Promise<number>} - Törölt rekordok száma
   */
  async cleanupExpiredTokens() {
    try {
      const deleted = await this.revokedTokenRepository.cleanupExpiredTokens();
      return deleted;
    } catch (error) {
      logger.error('Error cleaning up expired tokens', { error: error.message });
      throw error;
    }
  }

  /**
   * Felhasználó összes tokenjének visszavonása (pl. jelszó változtatáskor)
   * @param {number} userId - Felhasználó azonosító
   * @returns {Promise<number>} - Törölt rekordok száma
   */
  async revokeAllUserTokens(userId) {
    try {
      const deleted = await this.revokedTokenRepository.revokeAllUserTokens(userId);
      return deleted;
    } catch (error) {
      logger.error('Error revoking all user tokens', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = TokenBlacklistService;
