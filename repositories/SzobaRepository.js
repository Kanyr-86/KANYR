const { Op } = require('sequelize');

class SzobaRepository {
  constructor(db) {
    this.Szoba = db.Szoba;
    this.SzobaBekoltozes = db.SzobaBekoltozes;
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
      const { szoba_szama, osszes_hely } = szobaData;

      // Ellenőrizzük, hogy létezik-e már ilyen szoba szám
      const existingSzoba = await this.Szoba.findOne({
        where: { szoba_szama }
      });

      if (existingSzoba) {
        throw new Error(`A ${szoba_szama} számú szoba már létezik!`);
      }

      // Új szoba létrehozása
      const newSzoba = await this.Szoba.create({
        szoba_szama,
        osszes_hely
      });

      return newSzoba;
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
      return await this.Szoba.findByPk(szobaId);
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
   * @returns {Promise<Array>} - Szobák listája
   */
  async getAllSzobas(options = {}) {
    try {
      const { limit = 10, offset = 0, sort = 'szoba_id', order = 'ASC', prefix } = options;

      const where = {};
      if (prefix) {
        where.szoba_szama = {
          [Op.startsWith]: prefix
        };
      }

      return await this.Szoba.findAll({
        where,
        order: [[sort, order]],
        limit,
        offset
      });
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
      const szoba = await this.getSzobaById(szobaId);
      if (!szoba) {
        throw new Error('A szoba nem található!');
      }

      // Ha a szoba számát módosítják, ellenőrizzük, hogy nem létezik-e már
      if (updateData.szoba_szama && updateData.szoba_szama !== szoba.szoba_szama) {
        const existingSzoba = await this.Szoba.findOne({
          where: { szoba_szama: updateData.szoba_szama }
        });

        if (existingSzoba) {
          throw new Error(`A ${updateData.szoba_szama} számú szoba már létezik!`);
        }
      }

      await szoba.update(updateData);
      return szoba;
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
      const szoba = await this.getSzobaById(szobaId);
      if (!szoba) {
        throw new Error('A szoba nem található!');
      }

      // Ellenőrizzük, hogy van-e aktív beköltözés a szobában
      const activeBekoltozesek = await this.SzobaBekoltozes.count({
        where: {
          szoba_id: szobaId,
          kikoltozes_datum: null
        }
      });

      if (activeBekoltozesek > 0) {
        throw new Error('A szobában vannak aktív beköltözések, nem törölhető!');
      }

      await szoba.destroy();
      return true;
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
      const szoba = await this.getSzobaById(szobaId);
      if (!szoba) {
        throw new Error('A szoba nem található!');
      }

      const currentOccupancy = await this.SzobaBekoltozes.count({
        where: {
          szoba_id: szobaId,
          kikoltozes_datum: null
        }
      });

      return currentOccupancy < szoba.osszes_hely;
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
      return await this.SzobaBekoltozes.findAll({
        where: {
          szoba_id: szobaId,
          kikoltozes_datum: null
        },
        include: [{
          model: this.db.Diak,
          as: 'diak'
        }]
      });
    } catch (error) {
      throw new Error(`Hiba a szoba diákjainak lekérésében: ${error.message}`);
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
      const { diak_id, szoba_id, bekoltozes_datum } = bekoltozesData;

      // Ellenőrizzük, hogy a diák és szoba létezik
      const diak = await this.db.Diak.findByPk(diak_id);
      const szoba = await this.Szoba.findByPk(szoba_id);

      if (!diak) {
        throw new Error(`A ${diak_id} ID-jú diák nem található!`);
      }

      if (!szoba) {
        throw new Error(`A ${szoba_id} ID-jú szoba nem található!`);
      }

      // Ellenőrizzük, hogy a szoba elérhető-e
      const currentOccupancy = await this.SzobaBekoltozes.count({
        where: {
          szoba_id: szoba_id,
          kikoltozes_datum: null
        }
      });

      if (currentOccupancy >= szoba.osszes_hely) {
        throw new Error(`A szoba tele van! Maximális férőhely: ${szoba.osszes_hely}`);
      }

      // Ellenőrizzük, hogy a diák már be van-e költözve ebbe a szobába
      const existingBekoltozes = await this.SzobaBekoltozes.findOne({
        where: {
          diak_id: diak_id,
          szoba_id: szoba_id,
          kikoltozes_datum: null
        }
      });

      if (existingBekoltozes) {
        throw new Error('A diák már be van költözve ebbe a szobába!');
      }

      // Új beköltözés létrehozása
      const newBekoltozes = await this.SzobaBekoltozes.create({
        diak_id,
        szoba_id,
        bekoltozes_datum
      });

      return newBekoltozes;
    } catch (error) {
      throw new Error(`Hiba a beköltözés létrehozásakor: ${error.message}`);
    }
  }
}

module.exports = SzobaRepository;
