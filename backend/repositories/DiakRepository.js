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
   * @returns {Promise<Object>} - diákok listája és összesítő adatok { rows, count }
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

      // Get total count for pagination metadata
      const totalCount = await this.Diak.count();

      const diaks = await this.Diak.findAll(queryOptions);

      // Post-process: aktiv mező és szoba adatok hozzáadása
      const processedDiaks = diaks.map(diak => {
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

      return {
        rows: processedDiaks,
        count: totalCount
      };
    } catch (error) {
      throw new Error(`Hiba a diákok lekérésében: ${error.message}`, { cause: error });
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
      throw new Error(`Hiba a diák lekérésében (ID: ${id}): ${error.message}`, { cause: error });
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
      throw new Error(`Hiba a diák keresésében (email: ${email}): ${error.message}`, { cause: error });
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
        throw new Error(`Validációs hiba: ${validationErrors}`, { cause: error });
      }
      throw new Error(`Hiba a diák létrehozásában: ${error.message}`, { cause: error });
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
        throw new Error(`Validációs hiba: ${validationErrors}`, { cause: error });
      }
      throw new Error(`Hiba a diák frissítésében: ${error.message}`, { cause: error });
    }
  }

  /**
   * Diák törlése (soft delete)
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
        throw new Error('A diák nem törölhető, mert aktív beköltözése van! Előbb ki kell költöztetni a diákot.');
      }

      // Soft delete - only sets deleted_at timestamp
      // This preserves referential integrity with related tables (notifications, users, etc.)
      await diak.destroy();
      return true;
    } catch (error) {
      throw new Error(`Hiba a diák törlésében: ${error.message}`, { cause: error });
    }
  }

  /**
   * Véglegesen törölt diákok lekérése (soft-deleted records)
   * @param {Object} options - lekérdezési opciók
   * @returns {Promise<Array>} - törölt diákok listája
   */
  async findDeleted(options = {}) {
    try {
      const { Op } = require('sequelize');
      const { limit = 100, offset = 0, sort = 'deleted_at', order = 'DESC' } = options;

      return await this.Diak.findAll({
        paranoid: false, // Include soft-deleted records
        where: {
          deleted_at: { [Op.ne]: null }
        },
        order: [[sort, order]],
        limit,
        offset
      });
    } catch (error) {
      throw new Error(`Hiba a törölt diákok lekérésében: ${error.message}`, { cause: error });
    }
  }

  /**
   * Soft-deleted diák visszaállítása (undelete)
   * @param {number} id - diák ID
   * @returns {Promise<Object>} - visszaállított diák
   */
  async restore(id) {
    try {
      const { Op } = require('sequelize');
      const diak = await this.Diak.findByPk(id, {
        paranoid: false, // Include soft-deleted records
        where: {
          deleted_at: { [Op.ne]: null }
        }
      });

      if (!diak) {
        throw new Error('A diák nem található a törölt rekordok között!');
      }

      await diak.restore();
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Hiba a diák visszaállításában: ${error.message}`, { cause: error });
    }
  }

  /**
   * Végleges törlés (hard delete) - CSAK ADMIN HASZNÁLATRA!
   * Először törli a kapcsolódó rekordokat, majd magát a diákot.
   * @param {number} id - diák ID
   * @returns {Promise<boolean>} - sikeres törlés esetén true
   */
  async hardDelete(id) {
    try {
      const diak = await this.Diak.findByPk(id, { paranoid: false });
      if (!diak) {
        throw new Error('A diák nem található!');
      }

      // 1. Delete all related notifications
      await this.Diak.sequelize.models.Notification.destroy({
        where: { diak_id: id }
      });

      // 2. Clear diak_id from felhasznalos table
      await this.Diak.sequelize.models.Felhasznalo.update(
        { diak_id: null },
        { where: { diak_id: id } }
      );

      // 3. Delete all related room change requests
      const szobaValtoztatas = this.Diak.sequelize.models.SzobaValtoztatas;
      if (szobaValtoztatas) {
        await szobaValtoztatas.destroy({
          where: { diak_id: id }
        });
      }

      // 4. Delete all related SzobaBekoltozes records
      await this.Diak.sequelize.models.SzobaBekoltozes.destroy({
        where: { diak_id: id }
      });

      // 5. Finally, hard delete the student
      await diak.destroy({ force: true });
      return true;
    } catch (error) {
      throw new Error(`Hiba a diák végleges törlésében: ${error.message}`, { cause: error });
    }
  }

  /**
   * Soft-deleted diák keresése egyedi mezők alapján
   * @param {Object} params - keresési paraméterek (email, szemelyi_igazolvany_szam, taj_szam, diakigazolvany_szam)
   * @returns {Promise<Object|null>} - megtalált soft-deleted diák vagy null
   */
  async findDeletedByUniqueFields(params) {
    try {
      const { Op } = require('sequelize');
      const {
        email,
        szemelyi_igazolvany_szam,
        taj_szam,
        diakigazolvany_szam
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
      if (taj_szam) {
        orConditions.push({ taj_szam });
      }
      if (diakigazolvany_szam) {
        orConditions.push({ diakigazolvany_szam });
      }

      // If no unique fields provided, return null (can't match anything)
      if (orConditions.length === 0) {
        return null;
      }

      whereConditions[Op.or] = orConditions;

      return await this.Diak.findOne({
        paranoid: false, // Include soft-deleted records
        where: whereConditions
      });
    } catch (error) {
      throw new Error(`Hiba a soft-deleted diák keresésében: ${error.message}`, { cause: error });
    }
  }

  /**
   * Összes soft-deleted rekord végleges törlése (cleanup)
   * Hasznos tesztelés után az adatbázis tisztításához.
   * @returns {Promise<number>} - hány rekord lett törölve
   */
  async cleanupDeleted(options = {}) {
    try {
      const { Op } = require('sequelize');
      const { olderThan = null } = options; // Pass null to delete all soft-deleted

      let whereCondition = {
        deleted_at: { [Op.ne]: null }
      };

      // Only delete records older than a certain time if specified
      if (olderThan) {
        whereCondition.deleted_at = {
          [Op.lt]: olderThan
        };
      }

      // First, delete related records for soft-deleted students
      const deletedStudents = await this.Diak.findAll({
        paranoid: false,
        where: whereCondition,
        attributes: ['diak_id']
      });

      const studentIds = deletedStudents.map(s => s.diak_id);

      if (studentIds.length > 0) {
        // Delete related notifications
        await this.Diak.sequelize.models.Notification.destroy({
          where: { diak_id: studentIds }
        });

        // Clear diak_id from felhasznalos
        await this.Diak.sequelize.models.Felhasznalo.update(
          { diak_id: null },
          { where: { diak_id: studentIds } }
        );

        // Delete related SzobaBekoltozes records
        await this.Diak.sequelize.models.SzobaBekoltozes.destroy({
          where: { diak_id: studentIds }
        });
      }

      // Finally, hard delete all soft-deleted students
      const result = await this.Diak.destroy({
        where: whereCondition,
        force: true, // Hard delete
        paranoid: false // Include soft-deleted records
      });

      return result;
    } catch (error) {
      throw new Error(`Hiba a törölt rekordok tisztításában: ${error.message}`, { cause: error });
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
      throw new Error(`Hiba az aktív diákok lekérésében: ${error.message}`, { cause: error });
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
      throw new Error(`Hiba a statisztikák lekérésében: ${error.message}`, { cause: error });
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
