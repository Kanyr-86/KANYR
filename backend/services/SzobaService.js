class SzobaService {
  constructor(db) {
    this.db = db;
    this.SzobaRepository = new (require('../repositories/SzobaRepository'))(db);
  }

  /**
   * Új szoba létrehozása
   * @param {Object} szobaData - Szoba adatok
   * @param {string} szobaData.szoba_szama - Szoba száma
   * @param {number} szobaData.osszes_hely - Összes férőhely
   * @returns {Promise<Object>} - Létrehozott szoba
   */
  async createSzoba(szobaData) {
    try {
      return await this.SzobaRepository.createSzoba(szobaData);
    } catch (error) {
      throw new Error(`Hiba a szoba létrehozásakor: ${error.message}`);
    }
  }

  /**
   * Szoba lekérdezése ID alapján
   * @param {number} szobaId - Szoba ID
   * @returns {Promise<Object|null>} - Szoba vagy null, ha nem található
   */
  async getSzobaById(szobaId) {
    try {
      return await this.SzobaRepository.getSzobaById(szobaId);
    } catch (error) {
      throw new Error(`Hiba a szoba lekérdezésekor: ${error.message}`);
    }
  }

  /**
   * Szobák listázása
   * @param {Object} options - Lekérdezési paraméterek
   * @param {number} options.limit - Korlát
   * @param {number} options.offset - Eltolás
   * @param {string} options.sort - Rendezési mező
   * @param {string} options.order - Rendezési irány (ASC/DESC)
   * @param {string} options.prefix - Szoba szám prefix (pl. 'A')
   * @returns {Promise<Array>} - Szobák listája beköltözésekkel
   */
  async getAllSzobas(options = {}) {
    try {
      const { Op } = require('sequelize');
      const { limit = 10, offset = 0, sort = 'szoba_id', order = 'ASC', prefix } = options;

      const where = {};
      if (prefix) {
        where.szoba_szama = {
          [Op.startsWith]: prefix
        };
      }

      // OPTIMALIZÁLVA: Egyetlen lekérdezés eager loading-gal (N+1 probléma megoldva)
      const szobak = await this.db.Szoba.findAll({
        where,
        order: [[sort, order]],
        limit,
        offset,
        include: [{
          model: this.db.SzobaBekoltozes,
          as: 'bekoltozesek',
          where: { kikoltozes_datum: null },
          required: false,
          include: [{
            model: this.db.Diak,
            as: 'diak'
          }]
        }]
      });
      
      return szobak.map(szoba => szoba.toJSON ? szoba.toJSON() : szoba);
    } catch (error) {
      throw new Error(`Hiba a szobák listázásakor: ${error.message}`);
    }
  }

  /**
   * Szoba frissítése
   * @param {number} szobaId - Szoba ID
   * @param {Object} updateData - Frissítendő adatok
   * @returns {Promise<Object>} - Frissített szoba
   */
  async updateSzoba(szobaId, updateData) {
    try {
      return await this.SzobaRepository.updateSzoba(szobaId, updateData);
    } catch (error) {
      throw new Error(`Hiba a szoba frissítésekor: ${error.message}`);
    }
  }

  /**
   * Szoba törlése
   * @param {number} szobaId - Szoba ID
   * @returns {Promise<boolean>} - Sikeres törlés
   */
  async deleteSzoba(szobaId) {
    try {
      return await this.SzobaRepository.deleteSzoba(szobaId);
    } catch (error) {
      throw new Error(`Hiba a szoba törlésekor: ${error.message}`);
    }
  }

  /**
   * Szoba elérhetőségének ellenőrzése
   * @param {number} szobaId - Szoba ID
   * @returns {Promise<boolean>} - Elérhető-e a szoba
   */
  async checkRoomAvailability(szobaId) {
    try {
      return await this.SzobaRepository.checkRoomAvailability(szobaId);
    } catch (error) {
      throw new Error(`Hiba a szoba elérhetőségének ellenőrzésében: ${error.message}`);
    }
  }

  /**
   * Szobában tartózkodó diákok listázása
   * @param {number} szobaId - Szoba ID
   * @returns {Promise<Array>} - Diákok listája
   */
  async getStudentsInRoom(szobaId) {
    try {
      return await this.SzobaRepository.getStudentsInRoom(szobaId);
    } catch (error) {
      throw new Error(`Hiba a szoba diákjainak lekérésében: ${error.message}`);
    }
  }

  /**
   * Szoba statisztikák lekérdezése
   * @returns {Promise<Array>} - Szoba statisztikák
   */
  async getRoomStatistics() {
    try {
      const { sequelize } = this.db;
      const { Op } = require('sequelize');

      // OPTIMALIZÁLVA: Egyetlen GROUP BY lekérdezés (N+1 probléma megoldva)
      const occupancyData = await this.db.SzobaBekoltozes.findAll({
        attributes: [
          'szoba_id',
          [sequelize.fn('COUNT', sequelize.col('bekoltozes_id')), 'occupancy']
        ],
        where: {
          kikoltozes_datum: null
        },
        group: ['szoba_id'],
        raw: true
      });

      // Szobák lekérdezése
      const allRooms = await this.db.Szoba.findAll({
        order: [['szoba_id', 'ASC']]
      });

      // Occupancy adatok map-elése gyors kereséshez
      const occupancyMap = new Map();
      occupancyData.forEach(item => {
        occupancyMap.set(item.szoba_id, parseInt(item.occupancy) || 0);
      });

      // Statisztikák összeállítása
      const roomStatistics = allRooms.map(szoba => {
        const szobaData = szoba.toJSON ? szoba.toJSON() : szoba;
        const occupancy = occupancyMap.get(szobaData.szoba_id) || 0;
        
        return {
          szoba_id: szobaData.szoba_id,
          szoba_szama: szobaData.szoba_szama,
          osszes_hely: szobaData.osszes_hely,
          aktualis_szam: occupancy,
          kihasznaltseg: szobaData.osszes_hely > 0 
            ? ((occupancy / szobaData.osszes_hely) * 100).toFixed(1) + '%'
            : '0.0%'
        };
      });

      return roomStatistics;
    } catch (error) {
      throw new Error(`Hiba a szoba statisztikák lekérdezésekor: ${error.message}`);
    }
  }

  /**
   * Elérhető szobák listázása
   * @param {Object} options - Lekérdezési paraméterek
   * @param {number} options.limit - Korlát
   * @param {number} options.offset - Eltolás
   * @param {string} options.sort - Rendezési mező
   * @param {string} options.order - Rendezési irány (ASC/DESC)
   * @param {string} options.prefix - Szoba szám prefix (pl. 'A')
   * @returns {Promise<Array>} - Elérhető szobák listája
   */
  async getAvailableRooms(options = {}) {
    try {
      return await this.SzobaRepository.getAvailableRooms(options);
    } catch (error) {
      throw new Error(`Hiba az elérhető szobák listázásakor: ${error.message}`);
    }
  }

  /**
   * Új beköltözés létrehozása
   * @param {Object} bekoltozesData - Beköltözés adatok
   * @param {number} bekoltozesData.diak_id - Diák ID
   * @param {number} bekoltozesData.szoba_id - Szoba ID
   * @param {string} bekoltozesData.bekoltozes_datum - Beköltözés dátuma
   * @returns {Promise<Object>} - Létrehozott beköltözés
   */
  async createBekoltozes(bekoltozesData) {
    try {
      return await this.SzobaRepository.createBekoltozes(bekoltozesData);
    } catch (error) {
      throw new Error(`Hiba a beköltözés létrehozásakor: ${error.message}`);
    }
  }

  /**
   * Szoba elfoglaltságának lekérdezése
   * @param {number} szobaId - Szoba ID
   * @returns {Promise<Object>} - Szoba elfoglaltsági adatok
   */
  async getRoomOccupancy(szobaId) {
    try {
      const szoba = await this.SzobaRepository.getSzobaById(szobaId);
      if (!szoba) {
        throw new Error('Szoba nem található');
      }

      const currentOccupancy = await this.db.SzobaBekoltozes.count({
        where: {
          szoba_id: szobaId,
          kikoltozes_datum: null
        }
      });

      // Diákok lekérdezése beköltözés dátumával
      const students = await this.db.SzobaBekoltozes.findAll({
        where: {
          szoba_id: szobaId,
          kikoltozes_datum: null
        },
        include: [{
          model: this.db.Diak,
          as: 'diak'
        }]
      });

      // Diákok formázása a válaszhoz
      const formattedStudents = students.map(bekoltozes => ({
        diak_id: bekoltozes.diak.diak_id,
        nev: bekoltozes.diak.nev,
        email: bekoltozes.diak.email,
        telefon: bekoltozes.diak.telefonszam,
        bekoltozes_datum: bekoltozes.bekoltozes_datum,
        aktiv: true  // Aktív beköltözés, ezért a diák aktív
      }));

      return {
        szobaszam: szoba.szoba_szama,
        maxLakokSzama: szoba.osszes_hely,
        currentOccupancy: currentOccupancy,
        available: currentOccupancy < szoba.osszes_hely,
        availableCount: szoba.osszes_hely - currentOccupancy,
        students: formattedStudents
      };
    } catch (error) {
      throw new Error(`Hiba a szoba elfoglaltságának lekérdezésekor: ${error.message}`);
    }
  }

  /**
   * Tömeges beköltözés létrehozása
   * @param {Object} bulkData - Tömeges beköltözés adatok
   * @param {number} bulkData.szoba_id - Szoba ID
   * @param {string} bulkData.bekoltozes_datum - Beköltözés dátuma
   * @param {Array<number>} bulkData.diak_ids - Diák ID-k listája
   * @returns {Promise<Object>} - Létrehozott beköltözések eredménye
   */
  async createBulkBekoltozes(bulkData) {
    try {
      return await this.SzobaRepository.createBulkBekoltozes(bulkData);
    } catch (error) {
      throw new Error(`Hiba a tömeges beköltözés létrehozásakor: ${error.message}`);
    }
  }

  /**
   * Beköltözések lekérdezése szűréssel
   * @param {Object} filters - Szűrési feltételek
   * @param {string} filters.diakNev - Diák név (részleges egyezés)
   * @param {number} filters.szobaId - Szoba ID
   * @param {string} filters.datumFrom - Dátumtól (YYYY-MM-DD)
   * @param {string} filters.datumTo - Dátumig (YYYY-MM-DD)
   * @returns {Promise<Array>} - Beköltözések listája
   */
  async getBekoltozesekWithFilters(filters = {}) {
    try {
      return await this.SzobaRepository.getBekoltozesekWithFilters(filters);
    } catch (error) {
      throw new Error(`Hiba a beköltözések lekérdezésekor: ${error.message}`);
    }
  }
}

module.exports = SzobaService;
