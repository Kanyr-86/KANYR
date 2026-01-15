class LakcimRepository {
  constructor(db) {
    this.db = db;
    this.Lakcim = db.Lakcim;
    this.Diak = db.Diak;
    this.Szulo = db.Szulo;
  }

  /**
   * Összes lakcím lekérése
   * @param {Object} options - lekérdezési opciók
   * @returns {Promise<Array>} - lakcímek listája
   */
  async findAll(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        sort = 'varos',
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
            model: this.Diak,
            as: 'diaks'
          },
          {
            model: this.Szulo,
            as: 'szulos'
          }
        ];
      }

      return await this.Lakcim.findAll(queryOptions);
    } catch (error) {
      throw new Error(`Hiba a lakcímek lekérésében: ${error.message}`);
    }
  }

  /**
   * Lakcím lekérése ID alapján
   * @param {number} id - lakcím ID
   * @param {boolean} includeRelations - kapcsolódó adatok bevonása
   * @returns {Promise<Object|null>} - lakcím adatok vagy null
   */
  async findById(id, includeRelations = true) {
    try {
      const queryOptions = {
        where: { cim_id: id }
      };

      if (includeRelations) {
        queryOptions.include = [
          {
            model: this.Diak,
            as: 'diaks'
          },
          {
            model: this.Szulo,
            as: 'szulos'
          }
        ];
      }

      return await this.Lakcim.findOne(queryOptions);
    } catch (error) {
      throw new Error(`Hiba a lakcím lekérésében (ID: ${id}): ${error.message}`);
    }
  }

  /**
   * Lakcím keresése címek alapján
   * @param {Object} addressData - címek adatok
   * @returns {Promise<Object|null>} - lakcím adatok vagy null
   */
  async findByAddress(addressData) {
    try {
      const { orszag, iranyitoszam, varos, utca_hazszam } = addressData;
      
      return await this.Lakcim.findOne({
        where: {
          orszag,
          iranyitoszam,
          varos,
          utca_hazszam
        }
      });
    } catch (error) {
      throw new Error(`Hiba a lakcím keresésében: ${error.message}`);
    }
  }

  /**
   * Új lakcím létrehozása
   * @param {Object} lakcimData - lakcím adatok
   * @returns {Promise<Object>} - létrehozott lakcím
   */
  async create(lakcimData) {
    try {
      // Adatok validálása
      this.validateLakcimData(lakcimData);

      return await this.Lakcim.create(lakcimData);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(e => e.message).join(', ');
        throw new Error(`Validációs hiba: ${validationErrors}`);
      }
      throw new Error(`Hiba a lakcím létrehozásában: ${error.message}`);
    }
  }

  /**
   * Lakcím frissítése
   * @param {number} id - lakcím ID
   * @param {Object} updates - frissítendő adatok
   * @returns {Promise<Object>} - frissített lakcím
   */
  async update(id, updates) {
    try {
      const lakcim = await this.findById(id, false);
      if (!lakcim) {
        throw new Error('A lakcím nem található!');
      }

      await lakcim.update(updates);
      return await this.findById(id);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(e => e.message).join(', ');
        throw new Error(`Validációs hiba: ${validationErrors}`);
      }
      throw new Error(`Hiba a lakcím frissítésében: ${error.message}`);
    }
  }

  /**
   * Lakcím törlése
   * @param {number} id - lakcím ID
   * @returns {Promise<boolean>} - sikeres törlés esetén true
   */
  async delete(id) {
    try {
      const lakcim = await this.findById(id, false);
      if (!lakcim) {
        throw new Error('A lakcím nem található!');
      }

      // Ellenőrizzük, hogy vannak-e kapcsolódó diákjai
      const connectedDiaks = await this.Diak.count({
        where: { cim_id: id }
      });

      // Ellenőrizzük, hogy vannak-e kapcsolódó szülei
      const connectedSzulos = await this.Szulo.count({
        where: { cim_id: id }
      });

      if (connectedDiaks > 0 || connectedSzulos > 0) {
        throw new Error('A lakcím nem törölhető, mert kapcsolódó diákjai vagy szülei vannak!');
      }

      await lakcim.destroy();
      return true;
    } catch (error) {
      throw new Error(`Hiba a lakcím törlésében: ${error.message}`);
    }
  }

  /**
   * Lakcím adatok validálása
   * @param {Object} lakcimData - lakcím adatok
   */
  validateLakcimData(lakcimData) {
    const required = ['orszag', 'iranyitoszam', 'varos', 'utca_hazszam'];
    const missing = required.filter(field => !lakcimData[field]);
    if (missing.length > 0) {
      throw new Error(`Hiányzó kötelező mezők: ${missing.join(', ')}`);
    }
  }

  /**
   * Lakcímek keresése város alapján
   * @param {string} varos - város neve
   * @returns {Promise<Array>} - lakcímek listája
   */
  async findByCity(varos) {
    try {
      return await this.Lakcim.findAll({
        where: {
          varos: {
            [this.db.sequelize.Sequelize.Op.like]: `%${varos}%`
          }
        },
        include: [
          {
            model: this.Diak,
            as: 'diaks'
          },
          {
            model: this.Szulo,
            as: 'szulos'
          }
        ]
      });
    } catch (error) {
      throw new Error(`Hiba a lakcímek város szerinti keresésében: ${error.message}`);
    }
  }
}

module.exports = LakcimRepository;
