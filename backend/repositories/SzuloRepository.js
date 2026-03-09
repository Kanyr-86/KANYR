const logger = require('../utils/logger');

class SzuloRepository {
  constructor(db) {
    logger.debug('SzuloRepository constructor called', {
      dbExists: db ? true : false,
      szuloModel: db && db.Szulo ? true : false,
      diakModel: db && db.Diak ? true : false,
      lakcimModel: db && db.Lakcim ? true : false
    });

    this.db = db;
    this.Szulo = db.Szulo;
    this.Diak = db.Diak;
    this.Lakcim = db.Lakcim;
  }

  /**
   * Összes szülő lekérése
   * @param {Object} options - lekérdezési opciók
   * @returns {Promise<Array>} - szülők listája
   */
  async findAll(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        sort = 'nev',
        order = 'ASC',
        includeRelations = true
      } = options;

      const queryOptions = {
        limit,
        offset,
        order: [[sort, order]],
        where: {}
      };

      if (includeRelations) {
        queryOptions.include = [
          {
            model: this.Lakcim,
            as: 'lakcim'
          },
          {
            model: this.Diak,
            as: 'diaks'
          }
        ];
      }

      return await this.Szulo.findAll(queryOptions);
    } catch (error) {
      throw new Error(`Hiba a szülők lekérésében: ${error.message}`);
    }
  }

  /**
   * Szülő lekérése ID alapján
   * @param {number} id - szülő ID
   * @param {boolean} includeRelations - kapcsolódó adatok bevonása
   * @returns {Promise<Object|null>} - szülő adatok vagy null
   */
  async findById(id, includeRelations = true) {
    try {
      const queryOptions = {
        where: { szulo_id: id }
      };

      if (includeRelations) {
        queryOptions.include = [
          {
            model: this.Lakcim,
            as: 'lakcim'
          },
          {
            model: this.Diak,
            as: 'diaks'
          }
        ];
      }

      return await this.Szulo.findOne(queryOptions);
    } catch (error) {
      throw new Error(`Hiba a szülő lekérésében (ID: ${id}): ${error.message}`);
    }
  }

  /**
   * Szülő keresése email alapján
   * @param {string} email - szülő email címe
   * @returns {Promise<Object|null>} - szülő adatok vagy null
   */
  async findByEmail(email) {
    try {
      return await this.Szulo.findOne({
        where: { email }
      });
    } catch (error) {
      throw new Error(`Hiba a szülő keresésében (email: ${email}): ${error.message}`);
    }
  }

  /**
   * Új szülő létrehozása
   * @param {Object} szuloData - szülő adatok
   * @returns {Promise<Object>} - létrehozott szülő
   */
  async create(szuloData) {
    try {
      // Adatok validálása
      this.validateSzuloData(szuloData);

      // Email egyediség ellenőrzése
      const existingSzulo = await this.findByEmail(szuloData.email);
      if (existingSzulo) {
        throw new Error('Ez az email cím már regisztrálva van!');
      }

      // Lakcím létezésének ellenőrzése
      if (szuloData.cim_id) {
        const lakcim = await this.Lakcim.findByPk(szuloData.cim_id);
        if (!lakcim) {
          throw new Error('A megadott lakcím nem létezik!');
        }
      }

      return await this.Szulo.create(szuloData);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(e => e.message).join(', ');
        throw new Error(`Validációs hiba: ${validationErrors}`);
      }
      throw new Error(`Hiba a szülő létrehozásában: ${error.message}`);
    }
  }

  /**
   * Szülő frissítése
   * @param {number} id - szülő ID
   * @param {Object} updates - frissítendő adatok
   * @returns {Promise<Object>} - frissített szülő
   */
  async update(id, updates) {
    try {
      const szulo = await this.findById(id, false);
      if (!szulo) {
        throw new Error('A szülő nem található!');
      }

      // Email egyediség ellenőrzése (ha frissítjük)
      if (updates.email && updates.email !== szulo.email) {
        const existingSzulo = await this.findByEmail(updates.email);
        if (existingSzulo) {
          throw new Error('Ez az email cím már regisztrálva van!');
        }
      }

      // Lakcím létezésének ellenőrzése (ha frissítjük)
      if (updates.cim_id) {
        const lakcim = await this.Lakcim.findByPk(updates.cim_id);
        if (!lakcim) {
          throw new Error('A megadott lakcím nem létezik!');
        }
      }

      await szulo.update(updates);
      return await this.findById(id);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(e => e.message).join(', ');
        throw new Error(`Validációs hiba: ${validationErrors}`);
      }
      throw new Error(`Hiba a szülő frissítésében: ${error.message}`);
    }
  }

  /**
   * Szülő törlése
   * @param {number} id - szülő ID
   * @returns {Promise<boolean>} - sikeres törlés esetén true
   */
  async delete(id) {
    try {
      const szulo = await this.findById(id, false);
      if (!szulo) {
        throw new Error('A szülő nem található!');
      }

      // Ellenőrizzük, hogy vannak-e kapcsolódó diákjai
      const connectedDiaks = await this.Diak.count({
        where: { szulo_id: id }
      });

      if (connectedDiaks > 0) {
        throw new Error('A szülő nem törölhető, mert kapcsolódó diákjai vannak!');
      }

      await szulo.destroy();
      return true;
    } catch (error) {
      throw new Error(`Hiba a szülő törlésében: ${error.message}`);
    }
  }

  /**
   * Szülő adatok validálása
   * @param {Object} szuloData - szülő adatok
   */
  validateSzuloData(szuloData) {
    const required = ['nev', 'email', 'telefonszam', 'szemelyi_igazolvany_szam'];
    const missing = required.filter(field => !szuloData[field]);
    if (missing.length > 0) {
      throw new Error(`Hiányzó kötelező mezők: ${missing.join(', ')}`);
    }

    // Email formátum ellenőrzése
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(szuloData.email)) {
      throw new Error('Érvénytelen email formátum!');
    }
  }
}

module.exports = SzuloRepository;
