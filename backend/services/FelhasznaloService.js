const { generateTokenWithVersion, generateRandomPassword } = require('../utils/authUtils');
const TokenBlacklistService = require('./TokenBlacklistService');
const cacheService = require('./CacheService');
const logger = require('../utils/logger');

class FelhasznaloService {
  constructor(db, { repository }) {
    this.db = db;
    this.repository = repository;
    this.tokenBlacklistService = new TokenBlacklistService(db);
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(userData) {
    try {
      // Check if user already exists
      const emailExists = await this.repository.existsByEmail(userData.email);
      if (emailExists) {
        throw new Error('Az email cím már foglalt');
      }

      const usernameExists = await this.repository.existsByUsername(userData.username);
      if (usernameExists) {
        throw new Error('A felhasználónév már foglalt');
      }

      // Create user
      const user = await this.repository.create(userData);
      
      // Invalidate user caches
      cacheService.invalidateUserCache();
      
      return user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó létrehozása közben: ${error.message}`);
    }
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - User
   */
  async getUserById(userId) {
    try {
      // Cache individual user lookups
      const cacheKey = cacheService.generateKey(cacheService.keyPatterns.SINGLE_USER, { id: userId });
      
      return await cacheService.getOrCompute(cacheKey, async () => {
        const user = await this.repository.findById(userId);

        if (!user) {
          throw new Error('Felhasználó nem található');
        }

        return user;
      }, cacheService.defaultTTL);
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a felhasználó lekérdezése közben: ${error.message}`);
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} - User
   */
  async getUserByEmail(email) {
    try {
      // Don't cache email lookups for security (password-related)
      const user = await this.repository.findByEmail(email);

      if (!user) {
        throw new Error('Felhasználó nem található');
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a felhasználó lekérdezése közben: ${error.message}`);
    }
  }

  /**
   * Get user by username
   * @param {string} username - User username
   * @returns {Promise<Object>} - User
   */
  async getUserByUsername(username) {
    try {
      // Don't cache username lookups for security
      const user = await this.repository.findByUsername(username);

      if (!user) {
        throw new Error('Felhasználó nem található');
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a felhasználó lekérdezése közben: ${error.message}`);
    }
  }

  /**
   * Get all users
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of users
   */
  async getAllUsers(options = {}) {
    try {
      // Generate cache key based on options
      const cacheKey = cacheService.generateKey(cacheService.keyPatterns.USERS_LIST, {
        limit: options.limit || 'all',
        offset: options.offset || 0,
        sort: options.sort || 'default'
      });

      return await cacheService.getOrCompute(cacheKey, async () => {
        const users = await this.repository.findAll(options);
        return users;
      }, cacheService.listsTTL);
    } catch (error) {
      throw new Error(`Hiba a felhasználók listázása közben: ${error.message}`);
    }
  }

  /**
   * Update user
   * @param {number} userId - User ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(userId, updates) {
    try {
      const user = await this.repository.update(userId, updates);
      
      // Invalidate user caches
      cacheService.invalidateUserCache();
      cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_USER, { id: userId }));
      
      return user;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a felhasználó frissítése közben: ${error.message}`);
    }
  }

  /**
   * Delete user
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if deleted
   */
  async deleteUser(userId) {
    try {
      const result = await this.repository.delete(userId);
      
      // Invalidate user caches
      cacheService.invalidateUserCache();
      cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_USER, { id: userId }));
      
      return result;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a felhasználó törlése közben: ${error.message}`);
    }
  }

  /**
   * Authenticate user and generate token
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Authenticated user with token
   */
  async login(email, password) {
    try {
      const user = await this.repository.authenticate(email, password);

      // Ellenőrizzük a biztonsági jelzőket
      const securityFlags = user.security_flags || {};
      if (securityFlags.force_logout) {
        // Töröljük a force_logout flag-et sikeres bejelentkezés után
        await this.repository.update(user.user_id, {
          security_flags: { ...securityFlags, force_logout: false }
        });
      }

      // Generate JWT token with version
      const token = generateTokenWithVersion(user);

      return {
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          admin: user.admin
        },
        token,
        expiresIn: '24h'
      };
    } catch (error) {
      if (error.message === 'Érvénytelen email vagy jelszó') {
        throw error;
      }
      throw new Error(`Hiba a bejelentkezés közben: ${error.message}`);
    }
  }

  /**
   * Create admin user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created admin user
   */
  async createAdminUser(userData) {
    try {
      // Set admin flag to true
      userData.admin = true;

      // Create user
      const adminUser = await this.createUser(userData);
      return adminUser;
    } catch (error) {
      throw new Error(`Hiba az admin felhasználó létrehozása közben: ${error.message}`);
    }
  }

  /**
   * Update user password and revoke all tokens
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @param {Object} options - Options
   * @param {boolean} options.revokeTokens - Whether to revoke existing tokens (default: true)
   * @returns {Promise<Object>} - Updated user
   */
  async updatePassword(userId, newPassword, options = { revokeTokens: true }) {
    try {
      // Get current user to check token version
      const currentUser = await this.repository.findById(userId);
      if (!currentUser) {
        throw new Error('Felhasználó nem található');
      }

      // Increment token version to invalidate all existing tokens
      const newTokenVersion = (currentUser.token_version || 1) + 1;

      const updates = {
        password: newPassword,
        token_version: newTokenVersion,
        last_password_change: new Date()
      };

      const user = await this.repository.update(userId, updates);

      // Revoke all existing tokens for this user
      if (options.revokeTokens) {
        await this.tokenBlacklistService.revokeAllUserTokens(userId);
        logger.info('All tokens revoked after password change', { userId, newTokenVersion });
      }

      // Invalidate user caches
      cacheService.invalidateUserCache();
      cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_USER, { id: userId }));

      return user;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a jelszó frissítése közben: ${error.message}`);
    }
  }

  /**
   * Generate random password and update user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Updated user with new password
   */
  async resetPassword(userId) {
    try {
      // Get current user to check token version
      const currentUser = await this.repository.findById(userId);
      if (!currentUser) {
        throw new Error('Felhasználó nem található');
      }

      const newPassword = generateRandomPassword();

      // Increment token version to invalidate all existing tokens
      const newTokenVersion = (currentUser.token_version || 1) + 1;

      const updates = {
        password: newPassword,
        token_version: newTokenVersion,
        last_password_change: new Date()
      };

      const user = await this.repository.update(userId, updates);

      // Revoke all existing tokens for this user
      await this.tokenBlacklistService.revokeAllUserTokens(userId);
      logger.info('All tokens revoked after password reset', { userId, newTokenVersion });

      // Invalidate user caches
      cacheService.invalidateUserCache();
      cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_USER, { id: userId }));

      return {
        user,
        newPassword
      };
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a jelszó visszaállítása közben: ${error.message}`);
    }
  }

  /**
   * Update user role and revoke all tokens
   * @param {number} userId - User ID
   * @param {boolean} admin - New admin status
   * @returns {Promise<Object>} - Updated user
   */
  async updateUserRole(userId, admin) {
    try {
      // Get current user to check token version
      const currentUser = await this.repository.findById(userId);
      if (!currentUser) {
        throw new Error('Felhasználó nem található');
      }

      // Increment token version to invalidate all existing tokens
      const newTokenVersion = (currentUser.token_version || 1) + 1;

      const updates = {
        admin,
        token_version: newTokenVersion
      };

      const user = await this.repository.update(userId, updates);

      // Revoke all existing tokens for this user
      await this.tokenBlacklistService.revokeAllUserTokens(userId);
      logger.info('All tokens revoked after role change', {
        userId,
        newTokenVersion,
        oldRole: currentUser.admin,
        newRole: admin
      });

      // Invalidate user caches
      cacheService.invalidateUserCache();
      cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_USER, { id: userId }));

      return user;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a felhasználói szerepkör frissítése közben: ${error.message}`);
    }
  }

  /**
   * Force logout user by setting security flag and incrementing token version
   * @param {number} userId - User ID
   * @param {string} reason - Reason for force logout
   * @returns {Promise<Object>} - Updated user
   */
  async forceLogout(userId, reason = 'security') {
    try {
      const currentUser = await this.repository.findById(userId);
      if (!currentUser) {
        throw new Error('Felhasználó nem található');
      }

      const securityFlags = currentUser.security_flags || {};
      const newTokenVersion = (currentUser.token_version || 1) + 1;

      const updates = {
        token_version: newTokenVersion,
        security_flags: {
          ...securityFlags,
          force_logout: true,
          force_logout_reason: reason,
          force_logout_at: new Date().toISOString()
        }
      };

      const user = await this.repository.update(userId, updates);

      // Revoke all existing tokens
      await this.tokenBlacklistService.revokeAllUserTokens(userId);

      logger.warn('Force logout executed for user', { userId, reason, newTokenVersion });

      // Invalidate user caches
      cacheService.invalidateUserCache();
      cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_USER, { id: userId }));

      return user;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a kényszerített kijelentkeztetés közben: ${error.message}`);
    }
  }

  /**
   * Flag user for suspicious activity
   * @param {number} userId - User ID
   * @param {Object} activityDetails - Details about the suspicious activity
   * @returns {Promise<Object>} - Updated user
   */
  async flagSuspiciousActivity(userId, activityDetails) {
    try {
      const currentUser = await this.repository.findById(userId);
      if (!currentUser) {
        throw new Error('Felhasználó nem található');
      }

      const securityFlags = currentUser.security_flags || {};
      const suspiciousActivities = securityFlags.suspicious_activities || [];

      // Add new suspicious activity to history (keep last 10)
      suspiciousActivities.unshift({
        ...activityDetails,
        timestamp: new Date().toISOString()
      });
      if (suspiciousActivities.length > 10) {
        suspiciousActivities.pop();
      }

      const updates = {
        security_flags: {
          ...securityFlags,
          suspicious_activity: true,
          suspicious_activity_count: (securityFlags.suspicious_activity_count || 0) + 1,
          suspicious_activities: suspiciousActivities,
          last_suspicious_activity: new Date().toISOString()
        }
      };

      // If too many suspicious activities, force logout
      if (updates.security_flags.suspicious_activity_count >= 5) {
        updates.token_version = (currentUser.token_version || 1) + 1;
        updates.security_flags.force_logout = true;
        updates.security_flags.force_logout_reason = 'too_many_suspicious_activities';
        updates.security_flags.force_logout_at = new Date().toISOString();

        // Revoke all tokens
        await this.tokenBlacklistService.revokeAllUserTokens(userId);

        logger.warn('Force logout due to suspicious activity', { userId, activityDetails });
      } else {
        logger.warn('Suspicious activity flagged for user', { userId, activityDetails });
      }

      const user = await this.repository.update(userId, updates);
      
      // Invalidate user caches
      cacheService.invalidateUserCache();
      cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_USER, { id: userId }));
      
      return user;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a gyanús tevékenység jelölése közben: ${error.message}`);
    }
  }

  /**
   * Check if user is admin
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if user is admin
   */
  async isAdmin(userId) {
    try {
      const user = await this.getUserById(userId);

      if (!user) {
        throw new Error('Felhasználó nem található');
      }

      return user.admin;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba az admin jogok ellenőrzése közben: ${error.message}`);
    }
  }
}

module.exports = FelhasznaloService;
