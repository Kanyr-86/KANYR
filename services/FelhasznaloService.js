const { generateToken, generateRandomPassword } = require('../utils/authUtils');

class FelhasznaloService {
  constructor(db, { repository }) {
    this.db = db;
    this.repository = repository;
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
      const user = await this.repository.findById(userId);

      if (!user) {
        throw new Error('Felhasználó nem található');
      }

      return user;
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
      const users = await this.repository.findAll(options);
      return users;
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

      // Generate JWT token
      const token = generateToken({
        userId: user.user_id,
        username: user.username,
        email: user.email,
        admin: user.admin
      });

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
   * Update user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Updated user
   */
  async updatePassword(userId, newPassword) {
    try {
      const user = await this.repository.update(userId, { password: newPassword });
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
      const newPassword = generateRandomPassword();
      const user = await this.repository.update(userId, { password: newPassword });

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
   * Check if user is admin
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - True if user is admin
   */
  async isAdmin(userId) {
    try {
      const user = await this.repository.findById(userId);

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
