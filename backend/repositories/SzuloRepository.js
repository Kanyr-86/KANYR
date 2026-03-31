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
      throw new Error(`Hiba a szülők lekérésében: ${error.message}`, { cause: error });
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
      throw new Error(`Hiba a szülő lekérésében (ID: ${id}): ${error.message}`, { cause: error });
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
      throw new Error(`Hiba a szülő keresésében (email: ${email}): ${error.message}`, { cause: error });
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
        throw new Error(`Validációs hiba: ${validationErrors}`, { cause: error });
      }
      throw new Error(`Hiba a szülő létrehozásában: ${error.message}`, { cause: error });
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
        throw new Error(`Validációs hiba: ${validationErrors}`, { cause: error });
      }
      throw new Error(`Hiba a szülő frissítésében: ${error.message}`, { cause: error });
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
      throw new Error(`Hiba a szülő törlésében: ${error.message}`, { cause: error });
    }
  }

  /**
   * Soft-deleted szülő keresése egyedi mezők alapján
   * @param {Object} params - keresési paraméterek (email, szemelyi_igazolvany_szam, lakcimData)
   * @returns {Promise<Object|null>} - megtalált soft-deleted szülő vagy null
   */
  async findDeletedByUniqueFields(params) {
    try {
      const { Op } = require('sequelize');
      const {
        email,
        szemelyi_igazolvany_szam,
        lakcimData
      } = params;

      // Build where clause - match ANY of the provided unique fields
      const whereConditions = {
        deleted_at: { [Op.ne]: null } // Only search soft-deleted records
      };

      // Create OR conditions for unique field matching
      const orConditions = [];
      
      if (email) {
        orConditions.push({ email });
      }
      if (szemelyi_igazolvany_szam) {
        orConditions.push({ szemelyi_igazolvany_szam });
      }

      // Address matching via associated Lakcim
      if (lakcimData) {
        orConditions.push({
          '$lakcim.orszag$': lakcimData.orszag,
          '$lakcim.iranyitoszam$': lakcimData.iranyitoszam,
          '$lakcim.varos$': lakcimData.varos,
          '$lakcim.utca_hazszam$': lakcimData.utca_hazszam
        });
      }

      // If no unique fields provided, return null (can't match anything)
      if (orConditions.length === 0) {
        return null;
      }

      whereConditions[Op.or] = orConditions;

      return await this.Szulo.findOne({
        paranoid: false, // Include soft-deleted records
        where: whereConditions,
        include: [{
          model: this.Lakcim,
          as: 'lakcim',
          required: false
        }]
      });
    } catch (error) {
      throw new Error(`Hiba a soft-deleted szülő keresésében: ${error.message}`, { cause: error });
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
