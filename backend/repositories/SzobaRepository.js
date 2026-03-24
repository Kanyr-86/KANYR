const { Op } = require('sequelize');

class SzobaRepository {
  constructor(db) {
    this.db = db;
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
      const bekoltozesek = await this.SzobaBekoltozes.findAll({
        where: {
          szoba_id: szobaId,
          kikoltozes_datum: null
        },
        include: [{
          model: this.db.Diak,
          as: 'diak'
        }]
      });

      // Aktív mező hozzáadása minden diákhoz
      return bekoltozesek.map(bekoltozes => {
        const bekoltozesData = bekoltozes.toJSON ? bekoltozes.toJSON() : bekoltozes;
        if (bekoltozesData.diak) {
          bekoltozesData.diak.aktiv = true;  // Aktív beköltözés = aktív diák
        }
        return bekoltozesData;
      });
    } catch (error) {
      throw new Error(`Hiba a szoba diákjainak lekérésében: ${error.message}`);
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
   * @param {string} options.gender - Diák neme ('férfi' vagy 'nő') - opcionális, ha megadva, csak azonos nemű szobákat ad vissza
   * @returns {Promise<Array>} - Elérhető szobák listája
   */
  async getAvailableRooms(options = {}) {
    try {
      const { limit = 10, offset = 0, sort = 'szoba_id', order = 'ASC', prefix, gender } = options;

      const where = {};
      if (prefix) {
        where.szoba_szama = {
          [Op.startsWith]: prefix
        };
      }

      // Szobák lekérdezése a kapacitás ellenőrzésével
      const szobas = await this.Szoba.findAll({
        where,
        order: [[sort, order]],
        limit,
        offset
      });

      // OPTIMALIZÁLVA: Egyetlen lekérdezés az összes szoba aktuális foglaltságára és lakóinak nemére
      const szobaIds = szobas.map(szoba => szoba.szoba_id);
      
      const occupancyData = await this.SzobaBekoltozes.findAll({
        attributes: [
          'szoba_id',
          [this.db.sequelize.fn('COUNT', this.db.sequelize.col('bekoltozes_id')), 'occupancy']
        ],
        where: {
          szoba_id: { [Op.in]: szobaIds },
          kikoltozes_datum: null
        },
        group: ['szoba_id'],
        raw: true
      });

      // Occupancy adatok map-elése gyors kereséshez
      const occupancyMap = new Map();
      occupancyData.forEach(item => {
        occupancyMap.set(item.szoba_id, parseInt(item.occupancy) || 0);
      });

      // Ha gender paraméter meg van adva, lekérdezzük a szobákban lakó diákok nemét
      const roomGenderMap = new Map();
      if (gender) {
        const roomOccupants = await this.SzobaBekoltozes.findAll({
          where: {
            szoba_id: { [Op.in]: szobaIds },
            kikoltozes_datum: null
          },
          include: [{
            model: this.db.Diak,
            as: 'diak',
            attributes: ['nem']
          }]
        });

        // Szobánként tároljuk a lakók nemét
        roomOccupants.forEach(bekoltozes => {
          const szobaId = bekoltozes.szoba_id;
          const nem = bekoltozes.diak?.nem;
          if (nem) {
            if (!roomGenderMap.has(szobaId)) {
              roomGenderMap.set(szobaId, new Set());
            }
            roomGenderMap.get(szobaId).add(nem);
          }
        });
      }

      // Szűrjük és formázzuk az elérhető szobákat
      const availableRooms = [];
      
      for (const szoba of szobas) {
        const currentOccupancy = occupancyMap.get(szoba.szoba_id) || 0;

        if (currentOccupancy < szoba.osszes_hely) {
          // Ha gender paraméter meg van adva, ellenőrizzük a nem kompatibilitást
          if (gender) {
            const roomGenders = roomGenderMap.get(szoba.szoba_id);
            
            // Ha van már lakó a szobában
            if (roomGenders && roomGenders.size > 0) {
              // Ellenőrizzük, hogy a szobában lévő diákok nem megegyezik-e a kérő nemével
              // Ha többféle nem van a szobában (nem szabadna előfordulnia), akkor is kizárjuk
              if (!roomGenders.has(gender) || roomGenders.size > 1) {
                // A szoba nem kompatibilis - más nemű lakók vannak benne
                continue;
              }
            }
            // Ha a szoba üres vagy azonos nemű lakók vannak benne, hozzáadjuk
          }

          availableRooms.push({
            ...szoba.toJSON(),
            aktualis_szam: currentOccupancy,
            szabad_helyek: szoba.osszes_hely - currentOccupancy
          });
        }
      }

      return availableRooms;
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
    const { diak_id, szoba_id, bekoltozes_datum } = bekoltozesData;

    return await this.db.sequelize.transaction(async (transaction) => {
      // 1. Szoba lekérdezése sor szintű zárolással (FOR UPDATE) - ez megakadályozza a konkurens módosításokat
      const szoba = await this.Szoba.findByPk(szoba_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!szoba) {
        throw new Error(`A ${szoba_id} ID-jú szoba nem található!`);
      }

      // 2. Diák lekérdezése
      const diak = await this.db.Diak.findByPk(diak_id, { transaction });

      if (!diak) {
        throw new Error(`A ${diak_id} ID-jú diák nem található!`);
      }

      // 3. Szoba aktuális foglaltságának lekérdezése a tranzakción belül
      const currentOccupancy = await this.SzobaBekoltozes.count({
        where: {
          szoba_id: szoba_id,
          kikoltozes_datum: null
        },
        transaction
      });

      // 4. Kapacitás ellenőrzése
      if (currentOccupancy >= szoba.osszes_hely) {
        throw new Error(`A szoba tele van! Maximális férőhely: ${szoba.osszes_hely}`);
      }

      // 5. Ellenőrizzük, hogy a diák már be van-e költözve ebbe a szobába
      const existingBekoltozes = await this.SzobaBekoltozes.findOne({
        where: {
          diak_id: diak_id,
          szoba_id: szoba_id,
          kikoltozes_datum: null
        },
        transaction
      });

      if (existingBekoltozes) {
        throw new Error('A diák már be van költözve ebbe a szobába!');
      }

      // 6. ELLENŐRZÉS: Ha van már a szobában diák, csak azonos nemű költözhet be
      if (currentOccupancy > 0) {
        // Lekérdezzük a szobában lakó első diák nemét
        const existingResident = await this.SzobaBekoltozes.findOne({
          where: {
            szoba_id: szoba_id,
            kikoltozes_datum: null
          },
          include: [{
            model: this.db.Diak,
            as: 'diak',
            attributes: ['nem']
          }],
          transaction
        });

        if (existingResident && existingResident.diak.nem !== diak.nem) {
          throw new Error(`A szobában már ${existingResident.diak.nem} diák(ok) laknak. Csak azonos nemű diák költözhet be!`);
        }
      }

      // 7. Új beköltözés létrehozása
      const newBekoltozes = await this.SzobaBekoltozes.create({
        diak_id,
        szoba_id,
        bekoltozes_datum
      }, { transaction });

      return newBekoltozes;
    });
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
      const { diakNev, szobaId, datumFrom, datumTo } = filters;
      
      const where = {};
      
      // Szoba szűrés
      if (szobaId) {
        where.szoba_id = szobaId;
      }
      
      // Dátum tartomány szűrés
      if (datumFrom || datumTo) {
        where.bekoltozes_datum = {};
        if (datumFrom) {
          where.bekoltozes_datum[Op.gte] = datumFrom;
        }
        if (datumTo) {
          where.bekoltozes_datum[Op.lte] = datumTo;
        }
      }

      const include = [
        {
          model: this.db.Diak,
          as: 'diak',
          where: diakNev ? { nev: { [Op.like]: `%${diakNev}%` } } : undefined,
          required: !!diakNev
        },
        {
          model: this.Szoba,
          as: 'szoba'
        }
      ];

      const bekoltozesek = await this.SzobaBekoltozes.findAll({
        where,
        include,
        order: [['bekoltozes_datum', 'DESC']]
      });

      // Kiszámítjuk a napok számát minden beköltözéshez
      return bekoltozesek.map(bekoltozes => {
        const data = bekoltozes.toJSON ? bekoltozes.toJSON() : bekoltozes;
        
        const startDate = new Date(data.bekoltozes_datum);
        const endDate = data.kikoltozes_datum ? new Date(data.kikoltozes_datum) : new Date();
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        data.napok_szama = daysDiff;
        return data;
      });
    } catch (error) {
      throw new Error(`Hiba a beköltözések lekérdezésekor: ${error.message}`);
    }
  }

  /**
   * Tömeges beköltözés létrehozása (beköltöztetés és átköltöztetés támogatással)
   * @param {Object} bulkData - Tömeges beköltözés adatok
   * @param {number} bulkData.szoba_id - Szoba ID
   * @param {string} bulkData.bekoltozes_datum - Beköltözés dátuma
   * @param {Array<number>} bulkData.diak_ids - Diák ID-k listája
   * @returns {Promise<Object>} - Létrehozott beköltözések eredménye
   */
  async createBulkBekoltozes(bulkData) {
    const { szoba_id, bekoltozes_datum, diak_ids } = bulkData;
    
    return await this.db.sequelize.transaction(async (transaction) => {
      // 1. Szoba létezésének ellenőrzése sor szintű zárolással
      const szoba = await this.Szoba.findByPk(szoba_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      
      if (!szoba) {
        throw new Error(`A ${szoba_id} ID-jú szoba nem található!`);
      }

      // 2. Szoba kapacitás ellenőrzése
      const currentOccupancy = await this.SzobaBekoltozes.count({
        where: {
          szoba_id: szoba_id,
          kikoltozes_datum: null
        },
        transaction
      });

      const availableCapacity = szoba.osszes_hely - currentOccupancy;
      
      if (diak_ids.length > availableCapacity) {
        throw new Error(`A szoba kapacitása nem elegendő! Szabad helyek: ${availableCapacity}, de ${diak_ids.length} diákot próbál átköltöztetni.`);
      }

      // 3. Diákok létezésének és egyediségének ellenőrzése
      const uniqueDiakIds = [...new Set(diak_ids)];
      const diakok = await this.db.Diak.findAll({
        where: {
          diak_id: uniqueDiakIds
        },
        transaction
      });

      const foundDiakIds = diakok.map(d => d.diak_id);
      const missingDiakIds = uniqueDiakIds.filter(id => !foundDiakIds.includes(id));
      
      if (missingDiakIds.length > 0) {
        throw new Error(`A következő diák ID-k nem találhatók: ${missingDiakIds.join(', ')}`);
      }

      // 4. Ellenőrizzük, hogy a diákok már nincsenek-e ebben a szobában
      const existingBekoltozesek = await this.SzobaBekoltozes.findAll({
        where: {
          diak_id: uniqueDiakIds,
          szoba_id: szoba_id,
          kikoltozes_datum: null
        },
        transaction
      });

      const existingDiakIds = existingBekoltozesek.map(b => b.diak_id);
      if (existingDiakIds.length > 0) {
        throw new Error(`A következő diák ID-k már be vannak költözve ebbe a szobába: ${existingDiakIds.join(', ')}`);
      }

      // 5. Diákok szétválasztása aktív és inaktív csoportokra
      const activeBekoltozesek = await this.SzobaBekoltozes.findAll({
        where: {
          diak_id: uniqueDiakIds,
          kikoltozes_datum: null
        },
        include: [{
          model: this.Szoba,
          as: 'szoba'
        }],
        transaction
      });

      const activeDiakIds = new Set(activeBekoltozesek.map(b => b.diak_id));
      const inactiveDiakIds = uniqueDiakIds.filter(id => !activeDiakIds.has(id));

      // 6. ELLENŐRZÉS: Ha van már a szobában diák, csak azonos nemű költözhet be
      if (currentOccupancy > 0) {
        // Lekérdezzük a szobában lakó első diák nemét
        const existingResident = await this.SzobaBekoltozes.findOne({
          where: {
            szoba_id: szoba_id,
            kikoltozes_datum: null
          },
          include: [{
            model: this.db.Diak,
            as: 'diak',
            attributes: ['nem']
          }],
          transaction
        });

        if (existingResident) {
          const roomGender = existingResident.diak.nem;
          // Ellenőrizzük, hogy minden beköltöző diák azonos nemű-e
          const invalidDiakok = diakok.filter(d => d.nem !== roomGender);
          if (invalidDiakok.length > 0) {
            throw new Error(`A szobában már ${roomGender} diák(ok) laknak. Csak azonos nemű diák költözhet be! Hibás diákok: ${invalidDiakok.map(d => d.diak_id).join(', ')}`);
          }
        }
      } else {
        // Ha a szoba üres, ellenőrizzük, hogy az összes beköltöző diák azonos nemű-e
        const uniqueGenders = [...new Set(diakok.map(d => d.nem))];
        if (uniqueGenders.length > 1) {
          throw new Error(`A beköltöző diákok nem azonos neműek! Különböző nemeik: ${uniqueGenders.join(', ')}`);
        }
      }

      // 7. AKTÍV DIÁKOK ÁTKÖLTÖZTETÉSE - régi beköltözések lezárása
      for (const bekoltozes of activeBekoltozesek) {
        await bekoltozes.update({
          kikoltozes_datum: bekoltozes_datum
        }, { transaction });
      }

      // 8. Új beköltözések létrehozása (mind aktív, mind inaktív diákoknak)
      const bekoltozesekData = uniqueDiakIds.map(diak_id => ({
        diak_id,
        szoba_id,
        bekoltozes_datum
      }));

      const createdBekoltozesek = await this.SzobaBekoltozes.bulkCreate(bekoltozesekData, { transaction });

      // 9. Részletes eredmény visszaadása
      const transfers = [];
      for (const bekoltozes of createdBekoltozesek) {
        const isTransfer = activeDiakIds.has(bekoltozes.diak_id);
        const oldBekoltozes = activeBekoltozesek.find(b => b.diak_id === bekoltozes.diak_id);
        
        transfers.push({
          diak_id: bekoltozes.diak_id,
          bekoltozes_id: bekoltozes.bekoltozes_id,
          status: 'success',
          type: isTransfer ? 'transfer' : 'move_in',
          previous_room: isTransfer && oldBekoltozes ? oldBekoltozes.szoba.szoba_szama : null
        });
      }

      return {
        szoba_id: szoba_id,
        szoba_szama: szoba.szoba_szama,
        bekoltozes_datum: bekoltozes_datum,
        total_students: uniqueDiakIds.length,
        new_move_ins: inactiveDiakIds.length,
        transfer_count: activeDiakIds.size,
        transfers: transfers
      };
    });
  }
}

module.exports = SzobaRepository;
