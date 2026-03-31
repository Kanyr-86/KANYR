const { hashPassword, comparePassword } = require('../utils/authUtils');

class FelhasznaloRepository {
  constructor(db) {
    this.db = db;
    this.Felhasznalo = db.Felhasznalo;
  }

  /**
   * Új felhasználó létrehozása
   * @param {Object} userData - Felhasználói adatok
   * @returns {Promise<Object>} - Létrehozott felhasználó
   */
  async create(userData) {
    try {
      // Jelszó hashelése mentés előtt
      const hashedPassword = await hashPassword(userData.password);

      const user = await this.Felhasznalo.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        admin: userData.admin || false
      });

      // Felhasználó visszaadása jelszó nélkül
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.fields.username) {
          throw new Error('A felhasználónév már foglalt', { cause: error });
        }
        if (error.fields.email) {
          throw new Error('Az email cím már foglalt', { cause: error });
        }
      }
      throw new Error(`Hiba a felhasználó létrehozása közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Felhasználó keresése azonosító alapján
   * @param {number} userId - Felhasználó azonosító
   * @returns {Promise<Object|null>} - Felhasználó vagy null
   */
  async findById(userId) {
    try {
      const user = await this.Felhasznalo.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
      return user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó keresése közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Felhasználó keresése email alapján
   * @param {string} email - Felhasználó email címe
   * @returns {Promise<Object|null>} - Felhasználó vagy null
   */
  async findByEmail(email) {
    try {
      const user = await this.Felhasznalo.findOne({
        where: { email }
      });
      return user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó keresése közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Felhasználó keresése felhasználónév alapján
   * @param {string} username - Felhasználónév
   * @returns {Promise<Object|null>} - Felhasználó vagy null
   */
  async findByUsername(username) {
    try {
      const user = await this.Felhasznalo.findOne({
        where: { username }
      });
      return user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó keresése közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Összes felhasználó lekérdezése
   * @param {Object} options - Lekérdezési opciók
   * @returns {Promise<Array>} - Felhasználók tömbje
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
      throw new Error(`Hiba a felhasználók listázása közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Felhasználó frissítése
   * @param {number} userId - Felhasználó azonosító
   * @param {Object} updates - Alkalmazandó módosítások
   * @returns {Promise<Object>} - Frissített felhasználó
   */
  async update(userId, updates) {
    try {
      const user = await this.Felhasznalo.findByPk(userId);

      if (!user) {
        throw new Error('Felhasználó nem található');
      }

      // Jelszó hashelése, ha frissítésre kerül
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }

      await user.update(updates);

      // Felhasználó visszaadása jelszó nélkül
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      if (error.message === 'Felhasználó nem található') {
        throw error;
      }
      throw new Error(`Hiba a felhasználó frissítése közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Felhasználó törlése
   * @param {number} userId - Felhasználó azonosító
   * @returns {Promise<boolean>} - Igaz, ha törölve lett
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
      throw new Error(`Hiba a felhasználó törlése közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Felhasználó hitelesítése
   * Ellenőrzi a jelszót, valamint azt is, hogy a felhasználóhoz tartozó diák
   * és maga a felhasználó nincs-e soft-delete állapotban.
   * @param {string} email - Felhasználó email címe
   * @param {string} password - Felhasználó jelszava
   * @returns {Promise<Object>} - Hitelesített felhasználó
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

      // Check if the user itself is soft-deleted
      if (user.deleted_at) {
        throw new Error('A felhasználói fiók törölve lett. A bejelentkezés nem lehetséges.');
      }

      // Check if linked student is soft-deleted
      if (user.diak_id) {
        const Diak = this.db.Diak;
        const diak = await Diak.findByPk(user.diak_id, {
          paranoid: false // Include soft-deleted records
        });

        if (diak && diak.deleted_at) {
          throw new Error('A diák fiók törölve lett. A bejelentkezés nem lehetséges.');
        }
      }

      // Felhasználó visszaadása jelszó nélkül
      const { password: _, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    } catch (error) {
      if (error.message === 'Érvénytelen email vagy jelszó' ||
          error.message.includes('törölve')) {
        throw error;
      }
      throw new Error(`Hiba a bejelentkezés közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Ellenőrzi, hogy létezik-e felhasználó az email cím alapján
   * @param {string} email - Felhasználó email címe
   * @returns {Promise<boolean>} - Igaz, ha a felhasználó létezik
   */
  async existsByEmail(email) {
    try {
      const user = await this.Felhasznalo.findOne({
        where: { email },
        attributes: ['user_id']
      });
      return !!user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó létezésének ellenőrzése közben: ${error.message}`, { cause: error });
    }
  }

  /**
   * Ellenőrzi, hogy létezik-e felhasználó a felhasználónév alapján
   * @param {string} username - Felhasználónév
   * @returns {Promise<boolean>} - Igaz, ha a felhasználó létezik
   */
  async existsByUsername(username) {
    try {
      const user = await this.Felhasznalo.findOne({
        where: { username },
        attributes: ['user_id']
      });
      return !!user;
    } catch (error) {
      throw new Error(`Hiba a felhasználó létezésének ellenőrzése közben: ${error.message}`, { cause: error });
    }
  }
}

module.exports = FelhasznaloRepository;
