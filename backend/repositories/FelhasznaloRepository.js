const { hashPassword, comparePassword } = require('../utils/authUtils');

class FelhasznaloRepository {
  constructor(db) {
    this.db = db;
    this.Felhasznalo = db.Felhasznalo;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async create(userData) {
    try {
      // Hash password before saving
      const hashedPassword = await hashPassword(userData.password);

      const user = await this.Felhasznalo.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        admin: userData.admin || false
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.fields.username) {
          throw new Error('A felhasználónév már foglalt');
        }
        if (error.fields.email) {
          throw new Error('Az email cím már foglalt');
        }
      }
      throw new Error(`Hiba a felhasználó létrehozása közben: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} - User or null
   */
  async findById(userId) {
    try {
      const user = await this.Felhasznalo.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
      return user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó keresése közben: ${error.message}`);
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User or null
   */
  async findByEmail(email) {
    try {
      const user = await this.Felhasznalo.findOne({
        where: { email }
      });
      return user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó keresése közben: ${error.message}`);
    }
  }

  /**
   * Find user by username
   * @param {string} username - User username
   * @returns {Promise<Object|null>} - User or null
   */
  async findByUsername(username) {
    try {
      const user = await this.Felhasznalo.findOne({
        where: { username }
      });
      return user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó keresése közben: ${error.message}`);
    }
  }

  /**
   * Find all users
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of users
   */
  async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0, sort = 'username', order = 'ASC' } = options;

      const users = await this.Felhasznalo.findAll({
        attributes: { exclude: ['password'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort, order]]
      });

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
  async update(userId, updates) {
    try {
      const user = await this.Felhasznalo.findByPk(userId);

      if (!user) {
        throw new Error('Felhasználó nem található');
      }

      // Hash password if it's being updated
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }

      await user.update(updates);

      // Return user without password
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
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
  async delete(userId) {
    try {
      const user = await this.Felhasznalo.findByPk(userId);

      if (!user) {
        throw new Error('Felhasználó nem található');
      }

      await user.destroy();
      return true;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a felhasználó törlése közben: ${error.message}`);
    }
  }

  /**
   * Authenticate user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Authenticated user
   */
  async authenticate(email, password) {
    try {
      const user = await this.findByEmail(email);

      if (!user) {
        throw new Error('Érvénytelen email vagy jelszó');
      }

      const passwordMatch = await comparePassword(password, user.password);

      if (!passwordMatch) {
        throw new Error('Érvénytelen email vagy jelszó');
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      if (error.message === 'Érvénytelen email vagy jelszó') {
        throw error;
      }
      throw new Error(`Hiba a bejelentkezés közben: ${error.message}`);
    }
  }

  /**
   * Check if user exists by email
   * @param {string} email - User email
   * @returns {Promise<boolean>} - True if user exists
   */
  async existsByEmail(email) {
    try {
      const user = await this.Felhasznalo.findOne({
        where: { email },
        attributes: ['user_id']
      });
      return !!user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó létezésének ellenőrzése közben: ${error.message}`);
    }
  }

  /**
   * Check if user exists by username
   * @param {string} username - User username
   * @returns {Promise<boolean>} - True if user exists
   */
  async existsByUsername(username) {
    try {
      const user = await this.Felhasznalo.findOne({
        where: { username },
        attributes: ['user_id']
      });
      return !!user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó létezésének ellenőrzése közben: ${error.message}`);
    }
  }
}

module.exports = FelhasznaloRepository;
