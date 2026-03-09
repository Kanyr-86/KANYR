const { Op } = require('sequelize');

class DiakRepository {
  constructor(db) {
    this.db = db;
    this.Diak = db.Diak;
    this.Szulo = db.Szulo;
    this.Lakcim = db.Lakcim;
    this.SzobaBekoltozes = db.SzobaBekoltozes;
    this.Szoba = db.Szoba;
  }

  /**
   * Összes diák lekérése
   * @param {Object} options - lekérdezési opciók (limit, offset, sort, etc.)
   * @returns {Promise<Array>} - diákok listája
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
            model: this.Szulo,
            as: 'szulo',
            include: [{
              model: this.Lakcim,
              as: 'lakcim'
            }]
          },
          {
            model: this.Lakcim,
            as: 'lakcim'
          },
          {
            model: this.SzobaBekoltozes,
            as: 'bekoltozesek',
            include: [{
              model: this.Szoba,
              as: 'szoba'
            }]
          }
        ];
      }

      const diaks = await this.Diak.findAll(queryOptions);

      // Post-process: aktiv mező és szoba adatok hozzáadása
      return diaks.map(diak => {
        const diakData = diak.toJSON ? diak.toJSON() : diak;
        
        // Aktív beköltözés keresése
        const activeBekoltozes = diakData.bekoltozesek?.find(b => b.kikoltozes_datum === null);
        
        // Aktív státusz beállítása
        diakData.aktiv = !!activeBekoltozes;
        
        // Aktív szoba beállítása (ha van)
        if (activeBekoltozes && activeBekoltozes.szoba) {
          diakData.szoba = activeBekoltozes.szoba;
        } else {
          diakData.szoba = null;
        }
        
        return diakData;
      });
    } catch (error) {
      throw new Error(`Hiba a diákok lekérésében: ${error.message}`);
    }
  }

  /**
   * Diák lekérése ID alapján
   * @param {number} id - diák ID
   * @param {boolean} includeRelations - kapcsolódó adatok bevonása
   * @returns {Promise<Object|null>} - diák adatok vagy null
   */
  async findById(id, includeRelations = true) {
    try {
      const queryOptions = {
        where: { diak_id: id }
      };

      if (includeRelations) {
        queryOptions.include = [
          {
            model: this.Szulo,
            as: 'szulo',
            include: [{
              model: this.Lakcim,
              as: 'lakcim'
            }]
          },
          {
            model: this.Lakcim,
            as: 'lakcim'
          },
          {
            model: this.SzobaBekoltozes,
            as: 'bekoltozesek',
            include: [{
              model: this.Szoba,
              as: 'szoba'
            }],
            order: [['bekoltozes_datum', 'DESC']]
          }
        ];
      }

      return await this.Diak.findOne(queryOptions);
    } catch (error) {
      throw new Error(`Hiba a diák lekérésében (ID: ${id}): ${error.message}`);
    }
  }

  /**
   * Diák keresése email alapján
   * @param {string} email - diák email címe
   * @param {boolean} includeRelations - kapcsolódó adatok bevonása
   * @returns {Promise<Object|null>} - diák adatok vagy null
   */
  async findByEmail(email, includeRelations = true) {
    try {
      const queryOptions = {
        where: { email }
      };

      if (includeRelations) {
        queryOptions.include = [
          {
            model: this.Szulo,
            as: 'szulo',
            include: [{
              model: this.Lakcim,
              as: 'lakcim'
            }]
          },
          {
            model: this.Lakcim,
            as: 'lakcim'
          }
        ];
      }

      return await this.Diak.findOne(queryOptions);
    } catch (error) {
      throw new Error(`Hiba a diák keresésében (email: ${email}): ${error.message}`);
    }
  }

  /**
   * Új diák létrehozása
   * @param {Object} diakData - diák adatok
   * @returns {Promise<Object>} - létrehozott diák
   */
  async create(diakData) {
    try {
      // Adatok validálása
      this.validateDiakData(diakData);

      // Ellenőrizzük, hogy az email már létezik-e
      const existingDiak = await this.findByEmail(diakData.email, false);
      if (existingDiak) {
        throw new Error('Ez az email cím már regisztrálva van!');
      }

      // Szülő létezésének ellenőrzése
      const szulo = await this.Szulo.findByPk(diakData.szulo_id);
      if (!szulo) {
        throw new Error('A megadott szülő/gondviselő nem létezik!');
      }

      // Lakcím létezésének ellenőrzése
      const lakcim = await this.Lakcim.findByPk(diakData.cim_id);
      if (!lakcim) {
        throw new Error('A megadott lakcím nem létezik!');
      }

      return await this.Diak.create(diakData);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(e => e.message).join(', ');
        throw new Error(`Validációs hiba: ${validationErrors}`);
      }
      throw new Error(`Hiba a diák létrehozásában: ${error.message}`);
    }
  }

  /**
   * Diák frissítése
   * @param {number} id - diák ID
   * @param {Object} updates - frissítendő adatok
   * @returns {Promise<Object>} - frissített diák
   */
  async update(id, updates) {
    try {
      const diak = await this.findById(id, false);
      if (!diak) {
        throw new Error('A diák nem található!');
      }

      // Email egyediség ellenőrzése (ha frissítjük)
      if (updates.email && updates.email !== diak.email) {
        const existingDiak = await this.findByEmail(updates.email, false);
        if (existingDiak) {
          throw new Error('Ez az email cím már regisztrálva van!');
        }
      }

      // Szülő létezésének ellenőrzése (ha frissítjük)
      if (updates.szulo_id) {
        const szulo = await this.Szulo.findByPk(updates.szulo_id);
        if (!szulo) {
          throw new Error('A megadott szülő/gondviselő nem létezik!');
        }
      }

      // Lakcím létezésének ellenőrzése (ha frissítjük)
      if (updates.cim_id) {
        const lakcim = await this.Lakcim.findByPk(updates.cim_id);
        if (!lakcim) {
          throw new Error('A megadott lakcím nem létezik!');
        }
      }

      await diak.update(updates);
      return await this.findById(id);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(e => e.message).join(', ');
        throw new Error(`Validációs hiba: ${validationErrors}`);
      }
      throw new Error(`Hiba a diák frissítésében: ${error.message}`);
    }
  }

  /**
   * Diák törlése
   * @param {number} id - diák ID
   * @returns {Promise<boolean>} - sikeres törlés esetén true
   */
  async delete(id) {
    try {
      const diak = await this.findById(id, false);
      if (!diak) {
        throw new Error('A diák nem található!');
      }

      // Ellenőrizzük, hogy vannak-e aktív beköltözései
      const activeBekoltozes = await this.SzobaBekoltozes.findOne({
        where: {
          diak_id: id,
          kikoltozes_datum: null
        }
      });

      if (activeBekoltozes) {
        throw new Error('A diák nem törölhető, mert aktív beköltözése van!');
      }

      await diak.destroy();
      return true;
    } catch (error) {
      throw new Error(`Hiba a diák törlésében: ${error.message}`);
    }
  }

  /**
   * Aktív diákok lekérése (akik jelenleg szobában laknak)
   * @param {Object} options - lekérdezési opciók (limit, offset, sort, order)
   * @returns {Promise<Object>} - aktív diákok listája és összesítő adatok
   */
  async findActive(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        sort = 'nev',
        order = 'ASC'
      } = options;

      const queryOptions = {
        include: [
          {
            model: this.SzobaBekoltozes,
            as: 'bekoltozesek',
            where: {
              kikoltozes_datum: null
            },
            required: true
          },
          {
            model: this.Szulo,
            as: 'szulo'
          },
          {
            model: this.Lakcim,
            as: 'lakcim'
          }
        ],
        order: [[sort, order]],
        limit,
        offset
      };

      // Get total count for pagination metadata
      const totalCount = await this.Diak.count({
        include: [
          {
            model: this.SzobaBekoltozes,
            as: 'bekoltozesek',
            where: {
              kikoltozes_datum: null
            },
            required: true
          }
        ]
      });

      const diaks = await this.Diak.findAll(queryOptions);

      return {
        rows: diaks,
        count: totalCount
      };
    } catch (error) {
      throw new Error(`Hiba az aktív diákok lekérésében: ${error.message}`);
    }
  }

  /**
   * Diákok száma beköltözési státusz alapján
   * @returns {Promise<Object>} - statisztikák
   */
  async getStatistics() {
    try {
      const total = await this.Diak.count();
      const active = await this.Diak.count({
        include: [{
          model: this.SzobaBekoltozes,
          as: 'bekoltozesek',
          where: {
            kikoltozes_datum: null
          },
          required: true
        }]
      });

      return {
        total,
        active,
        inactive: total - active
      };
    } catch (error) {
      throw new Error(`Hiba a statisztikák lekérésében: ${error.message}`);
    }
  }

  /**
   * Diák adatok validálása
   * @param {Object} diakData - diák adatok
   */
  validateDiakData(diakData) {
    const required = ['nev', 'email', 'telefonszam', 'szuletesi_datum',
                     'szemelyi_igazolvany_szam', 'taj_szam', 'diakigazolvany_szam',
                     'szulo_id', 'kapcsolat_tipusa', 'cim_id', 'nem'];

    const missing = required.filter(field => !diakData[field]);
    if (missing.length > 0) {
      throw new Error(`Hiányzó kötelező mezők: ${missing.join(', ')}`);
    }

    // Kapcsolat típus validálása
    const validKapcsolatTipusok = ['anya', 'apa', 'gondviselo'];
    if (!validKapcsolatTipusok.includes(diakData.kapcsolat_tipusa)) {
      throw new Error('A kapcsolat típusa csak anya, apa vagy gondviselo lehet!');
    }

    // Email formátum ellenőrzése
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(diakData.email)) {
      throw new Error('Érvénytelen email formátum!');
    }
  }
}

module.exports = DiakRepository;
