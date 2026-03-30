const { Op } = require('sequelize');
const cacheService = require('./CacheService');
const { hashPassword } = require('../utils/authUtils');

class DiakService {
  constructor(db, options = {}) {
    this.db = db;
    this.Diak = db.Diak;
    this.Szulo = db.Szulo;
    this.Lakcim = db.Lakcim;
    this.SzobaBekoltozes = db.SzobaBekoltozes;
    this.Szoba = db.Szoba;
    this.Felhasznalo = db.Felhasznalo;
    this.Notification = db.Notification;
    this.repository = options.repository;
  }

  /**
   * Diák lekérése minden kapcsolódó adattal
   * OPTIMALIZÁLVA: N+1 query probléma elkerülése JOIN-okkal
   * @param {number} id - diák ID
   * @returns {Promise<Object>} - teljes diák profil
   */
  async getStudentWithFullHistory(id) {
    try {
      // Cache student profiles
      const cacheKey = cacheService.generateKey(cacheService.keyPatterns.SINGLE_STUDENT, { id });
      
      return await cacheService.getOrCompute(cacheKey, async () => {
        // OPTIMALIZÁLVA: subQuery: false és separate: false használata JOIN-ok kényszerítéséhez
        // Ez egyetlen SQL lekérdezést eredményez az N+1 különálló lekérdezés helyett
        return await this.Diak.findByPk(id, {
          subQuery: false, // Megakadályozza a Sequelize-t, hogy al-lekérdezéseket használjon
          include: [
            {
              model: this.Szulo,
              as: 'szulo',
              required: false, // LEFT JOIN - diák lehet szülő nélkül
              separate: false, // JOIN használata külön lekérdezés helyett
              include: [{
                model: this.Lakcim,
                as: 'lakcim',
                required: false,
                separate: false
              }]
            },
            {
              model: this.Lakcim,
              as: 'lakcim',
              required: false,
              separate: false
            },
            {
              model: this.SzobaBekoltozes,
              as: 'bekoltozesek',
              required: false,
              separate: false, // JOIN használata a beköltözésekhez is
              include: [{
                model: this.Szoba,
                as: 'szoba',
                required: false,
                separate: false
              }],
              order: [['bekoltozes_datum', 'DESC']]
            }
          ]
        });
      }, cacheService.defaultTTL);
    } catch (error) {
      throw new Error(`Hiba a diák teljes profiljának lekérésében: ${error.message}`);
    }
  }

  /**
   * Teljes diák beiratkozás folyamat
   * @param {Object} enrollmentData - beiratkozási adatok
   * @returns {Promise<Object>} - beiratkozott diák
   */
  async enrollStudent(enrollmentData) {
    const {
      diakData,
      szuloData,
      lakcimData,
      szoba_id,
      bekoltozes_datum,
      password // Optional custom password for user account
    } = enrollmentData;

    const transaction = await this.db.sequelize.transaction();
    
    try {
      // 1. Lakcím létrehozása vagy megtalálása (csak ha van lakcimData)
      let lakcim = null;
      if (lakcimData) {
        lakcim = await this.Lakcim.findOne({
          where: {
            orszag: lakcimData.orszag,
            iranyitoszam: lakcimData.iranyitoszam,
            varos: lakcimData.varos,
            utca_hazszam: lakcimData.utca_hazszam
          }
        });

        if (!lakcim) {
          lakcim = await this.Lakcim.create(lakcimData, { transaction });
        }
      }

      // 2. Szülő kezelése - lehet meglévő (szulo_id) vagy új (email alapján)
      let szulo;
      if (szuloData.szulo_id) {
        // Meglévő szülő használata
        szulo = await this.Szulo.findByPk(szuloData.szulo_id);
        if (!szulo) {
          throw new Error('A megadott szülő nem található!');
        }
      } else {
        // Új szülő létrehozása vagy megtalálása email alapján
        szulo = await this.Szulo.findOne({
          where: { email: szuloData.email }
        });

        if (!szulo) {
          szulo = await this.Szulo.create({
            ...szuloData,
            cim_id: lakcim ? lakcim.cim_id : null
          }, { transaction });
        }
      }

      // 3. Diák létrehozása
      const diak = await this.Diak.create({
        ...diakData,
        szulo_id: szulo.szulo_id,
        cim_id: lakcim ? lakcim.cim_id : null
      }, { transaction });

      // 4. Felhasználói fiók létrehozása a diáknak
      const defaultPassword = password || 'Student123!';
      const hashedPassword = await hashPassword(defaultPassword);
      
      // Generate username from email (part before @)
      const username = diakData.email.split('@')[0];
      
      // Check if username already exists, if so append student ID
      let finalUsername = username;
      const existingUser = await this.Felhasznalo.findOne({
        where: { username: finalUsername },
        transaction
      });
      
      if (existingUser) {
        finalUsername = `${username}_${diak.diak_id}`;
      }

      const felhasznalo = await this.Felhasznalo.create({
        username: finalUsername,
        email: diakData.email,
        password: hashedPassword,
        admin: false,
        diak_id: diak.diak_id
      }, { transaction });

      // 5. Értesítés létrehozása a jelszó módosításáról
      await this.Notification.create({
        diak_id: diak.diak_id,
        tipus: 'password_reset_required',
        cimzettkor: 'student',
        prioritas: 'high',
        uzenet: `Üdvözlünk a kollégiumi rendszerben! A bejelentkezéshez használd az email címedet (${diakData.email}) és az ideiglenes jelszót: ${defaultPassword}. Kérjük, az első bejelentkezés után változtasd meg a jelszavadat a biztonság érdekében.`,
        elolvasva: false
      }, { transaction });

      // 6. Szoba kezelése (opcionális)
      if (szoba_id) {
        // Szoba elérhetőség ellenőrzése (tranzakcióban, a race condition elkerüléséhez)
        await this.checkRoomAvailability(szoba_id, transaction);

        // Beköltözés rögzítése
        await this.SzobaBekoltozes.create({
          diak_id: diak.diak_id,
          szoba_id: szoba_id,
          bekoltozes_datum: bekoltozes_datum || new Date(),
          kikoltozes_datum: null
        }, { transaction });
      }

      await transaction.commit();

      // Invalidate caches after successful enrollment
      cacheService.invalidateStudentCache();
      cacheService.invalidateRoomCache();
      cacheService.invalidateStatisticsCache();

      // Teljes profil visszaadása
      return await this.getStudentWithFullHistory(diak.diak_id);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Hiba a beiratkozás során: ${error.message}`);
    }
  }

  /**
   * Diák átcsatolása másik szobába
   * @param {number} diak_id - diák ID
   * @param {number} uj_szoba_id - új szoba ID
   * @param {Date} atcsatolas_datum - átcsatolás dátuma
   * @returns {Promise<Object>} - frissített diák profil
   */
  async transferStudent(diak_id, uj_szoba_id, atcsatolas_datum = new Date()) {
    const transaction = await this.db.sequelize.transaction();
    
    try {
      const diak = await this.Diak.findByPk(diak_id);
      if (!diak) {
        throw new Error('A diák nem található!');
      }

      // Aktív beköltözés lezárása (ha létezik)
      const activeBekoltozes = await this.SzobaBekoltozes.findOne({
        where: {
          diak_id,
          kikoltozes_datum: null
        }
      });

      // Ha van aktív beköltözés, lezárjuk
      if (activeBekoltozes) {
        await activeBekoltozes.update({
          kikoltozes_datum: atcsatolas_datum
        }, { transaction });
      }

      // Új szoba elérhetőség ellenőrzése (tranzakcióban, a race condition elkerüléséhez)
      await this.checkRoomAvailability(uj_szoba_id, transaction);

      // Új beköltözés létrehozása
      await this.SzobaBekoltozes.create({
        diak_id,
        szoba_id: uj_szoba_id,
        bekoltozes_datum: atcsatolas_datum,
        kikoltozes_datum: null
      }, { transaction });

      await transaction.commit();

      // Invalidate caches after transfer
      cacheService.invalidateStudentCache();
      cacheService.invalidateRoomCache();
      cacheService.invalidateStatisticsCache();

      return await this.getStudentWithFullHistory(diak_id);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Hiba az átcsatolás során: ${error.message}`);
    }
  }

  /**
   * Diák kiköltöztetése
   * @param {number} diak_id - diák ID
   * @param {Date} kikoltozes_datum - kiköltözés dátuma
   * @returns {Promise<Object>} - frissített diák profil
   */
  async moveOutStudent(diak_id, kikoltozes_datum = new Date()) {
    const transaction = await this.db.sequelize.transaction();
    
    try {
      const activeBekoltozes = await this.SzobaBekoltozes.findOne({
        where: {
          diak_id,
          kikoltozes_datum: null
        }
      });

      if (!activeBekoltozes) {
        throw new Error('A diáknak nincs aktív beköltözése!');
      }

      await activeBekoltozes.update({
        kikoltozes_datum: kikoltozes_datum
      }, { transaction });

      await transaction.commit();

      // Invalidate caches after move out
      cacheService.invalidateStudentCache();
      cacheService.invalidateRoomCache();
      cacheService.invalidateStatisticsCache();

      return await this.getStudentWithFullHistory(diak_id);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Hiba a kiköltöztetés során: ${error.message}`);
    }
  }

  /**
   * Szoba elérhetőségének ellenőrzése
   * @param {number} szoba_id - szoba ID
   * @param {Object|null} transaction - Sequelize tranzakció (opcionális, de szükséges a race condition elkerüléséhez)
   * @returns {Promise<boolean>} - elérhető-e
   */
  async checkRoomAvailability(szoba_id, transaction = null) {
    try {
      // OPTIMALIZÁLVA: Row locking a race condition elkerüléséhez
      const szoba = await this.Szoba.findByPk(szoba_id, {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined
      });
      
      if (!szoba) {
        throw new Error('A szoba nem található!');
      }

      const currentOccupancy = await this.SzobaBekoltozes.count({
        where: {
          szoba_id,
          kikoltozes_datum: null
        },
        transaction
      });

      if (currentOccupancy >= szoba.osszes_hely) {
        throw new Error(`A szoba teljes (${currentOccupancy}/${szoba.osszes_hely} hely)!`);
      }

      return true;
    } catch (error) {
      throw new Error(`Hiba a szoba elérhetőségének ellenőrzésében: ${error.message}`);
    }
  }

  /**
   * Diákok listázása szoba alapján
   * @param {number} szoba_id - szoba ID
   * @returns {Promise<Array>} - diákok listája a szobában
   */
  async getStudentsInRoom(szoba_id) {
    try {
      // Cache students in room
      const cacheKey = cacheService.generateKey('students:in_room', { szoba_id });
      return await cacheService.getOrCompute(cacheKey, async () => {
        return await this.SzobaBekoltozes.findAll({
          where: {
            szoba_id,
            kikoltozes_datum: null
          },
          include: [{
            model: this.Diak,
            as: 'diak',
            include: [{
              model: this.Szulo,
              as: 'szulo'
            }]
          }]
        });
      }, cacheService.defaultTTL);
    } catch (error) {
      throw new Error(`Hiba a szoba diákjainak lekérésében: ${error.message}`);
    }
  }

  /**
   * Diákok statisztikája
   * @returns {Promise<Object>} - részletes statisztikák
   */
  async getDetailedStatistics() {
    try {
      // Cache statistics with shorter TTL
      return await cacheService.getOrCompute(
        cacheService.keyPatterns.STUDENTS_STATISTICS,
        async () => {
          const { sequelize } = this.db;

          // OPTIMALIZÁLVA: Párhuzamos lekérdezések Promise.all-lal
          const [totalStudents, activeStudents, totalRooms, allRooms, occupancyData, latestMoveInRecord, latestMoveOutRecord] = await Promise.all([
            // Összes diák
            this.Diak.count(),
            
            // Aktív diákok
            this.Diak.count({
              include: [{
                model: this.SzobaBekoltozes,
                as: 'bekoltozesek',
                where: { kikoltozes_datum: null },
                required: true
              }]
            }),

            // Szobák száma
            this.Szoba.count(),

            // Összes szoba kapacitás
            this.Szoba.findAll({ attributes: ['szoba_id', 'szoba_szama', 'osszes_hely'] }),

            // OPTIMALIZÁLVA: Egyetlen GROUP BY lekérdezés (N+1 probléma megoldva)
            this.SzobaBekoltozes.findAll({
              attributes: [
                'szoba_id',
                [sequelize.fn('COUNT', sequelize.col('bekoltozes_id')), 'occupancy']
              ],
              where: { kikoltozes_datum: null },
              group: ['szoba_id'],
              raw: true
            }),

            // Legutóbbi beköltözés
            this.SzobaBekoltozes.findOne({
              order: [['bekoltozes_datum', 'DESC']]
            }),

            // Legutóbbi kiköltözés
            this.SzobaBekoltozes.findOne({
              where: { kikoltozes_datum: { [Op.ne]: null } },
              order: [['kikoltozes_datum', 'DESC']]
            })
          ]);

          // Occupancy adatok map-elése gyors kereséshez
          const occupancyMap = new Map();
          occupancyData.forEach(item => {
            occupancyMap.set(item.szoba_id, parseInt(item.occupancy) || 0);
          });

          // Statisztikák kiszámítása
          let totalCapacity = 0;
          let totalOccupied = 0;
          let mostOccupiedRoom = null;
          let maxOccupancyPercentage = -1;

          for (const szoba of allRooms) {
            totalCapacity += szoba.osszes_hely;
            const occupancy = occupancyMap.get(szoba.szoba_id) || 0;
            totalOccupied += occupancy;

            // Legmagasabb foglaltságú szoba meghatározása
            const occupancyPercentage = szoba.osszes_hely > 0 ? (occupancy / szoba.osszes_hely) * 100 : 0;
            if (occupancyPercentage > maxOccupancyPercentage) {
              maxOccupancyPercentage = occupancyPercentage;
              mostOccupiedRoom = szoba.szoba_szama;
            }
          }

          // Szabad helyek száma
          const availableSpaces = totalCapacity - totalOccupied;

          // Átlagos foglaltsági ráta százalékban
          const averageOccupancy = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

          const latestMoveIn = latestMoveInRecord 
            ? new Date(latestMoveInRecord.bekoltozes_datum).toLocaleDateString('hu-HU')
            : 'N/A';
          
          const latestMoveOut = latestMoveOutRecord 
            ? new Date(latestMoveOutRecord.kikoltozes_datum).toLocaleDateString('hu-HU')
            : 'N/A';

          return {
            totalStudents,
            activeStudents,
            totalRooms,
            availableSpaces,
            averageOccupancy,
            mostOccupiedRoom: mostOccupiedRoom || 'N/A',
            latestMoveIn,
            latestMoveOut
          };
        },
        cacheService.statisticsTTL
      );
    } catch (error) {
      throw new Error(`Hiba a részletes statisztikák lekérésében: ${error.message}`);
    }
  }

  /**
   * Diák keresése több feltétel alapján
   * @param {Object} searchCriteria - keresési feltételek
   * @param {Object} paginationOptions - lapozási opciók (limit, offset, sort, order)
   * @returns {Promise<Object>} - talált diákok és összesítő adatok
   */
  async searchStudents(searchCriteria, paginationOptions = {}) {
    try {
      const { nev, email, szoba_szama, kapcsolat_tipusa, aktiv } = searchCriteria;
      const { 
        limit = 50, 
        offset = 0, 
        sort = 'nev', 
        order = 'ASC' 
      } = paginationOptions;

      // Generate cache key for search
      const cacheKey = cacheService.generateKey(cacheService.keyPatterns.STUDENTS_LIST, {
        nev: nev || 'all',
        email: email || 'all',
        szoba_szama: szoba_szama || 'all',
        kapcsolat_tipusa: kapcsolat_tipusa || 'all',
        aktiv: aktiv !== undefined ? aktiv : 'all',
        limit, offset, sort, order
      });
      
      return await cacheService.getOrCompute(cacheKey, async () => {
        const queryOptions = {
          include: [
            {
              model: this.Szulo,
              as: 'szulo'
            },
            {
              model: this.SzobaBekoltozes,
              as: 'bekoltozesek',
              where: aktiv === true ? { kikoltozes_datum: null } : undefined,
              required: false
            }
          ],
          order: [[sort, order]],
          limit,
          offset
        };

        const whereConditions = {};

        if (nev) {
          whereConditions.nev = { [Op.like]: `%${nev}%` };
        }

        if (email) {
          whereConditions.email = { [Op.like]: `%${email}%` };
        }

        if (kapcsolat_tipusa) {
          whereConditions.kapcsolat_tipusa = kapcsolat_tipusa;
        }

        queryOptions.where = whereConditions;

        // Get total count for pagination metadata
        const totalCount = await this.Diak.count({
          where: whereConditions,
          include: [
            {
              model: this.SzobaBekoltozes,
              as: 'bekoltozesek',
              where: aktiv === true ? { kikoltozes_datum: null } : undefined,
              required: false
            }
          ]
        });

        const students = await this.Diak.findAll(queryOptions);

        return {
          rows: students,
          count: totalCount
        };
      }, cacheService.listsTTL);
    } catch (error) {
      throw new Error(`Hiba a diákok keresése során: ${error.message}`);
    }
  }

  /**
   * Diákok tömeges beiratkozása CSV-ből vagy JSON-ből
   * Megjegyzés: minden egyes enrollStudent() saját tranzakcióban fut,
   * ezért az eredmények függetlenek egymástól (partial success lehetséges).
   * @param {Array} studentsData - diákok adatok tömbje
   * @returns {Promise<Object>} - beiratkozás eredménye
   */
  async bulkEnrollStudents(studentsData) {
    const results = {
      successful: [],
      failed: []
    };

    for (const studentData of studentsData) {
      try {
        const result = await this.enrollStudent(studentData);
        results.successful.push({
          student: result.nev,
          id: result.diak_id,
          status: 'success'
        });
      } catch (error) {
        results.failed.push({
          student: studentData.diakData?.nev || 'Unknown',
          error: error.message,
          status: 'failed'
        });
      }
    }

    return results;
  }

  /**
   * Diák jelentés generálása
   * @param {number} diak_id - diák ID
   * @returns {Promise<Object>} - diák jelentés
   */
  async generateStudentReport(diak_id) {
    try {
      // Cache reports with longer TTL as they are less likely to change frequently
      const cacheKey = cacheService.generateKey('students:report', { id: diak_id });
      
      return await cacheService.getOrCompute(cacheKey, async () => {
        const student = await this.getStudentWithFullHistory(diak_id);
        if (!student) {
          throw new Error('A diák nem található!');
        }

        const currentBekoltozes = student.bekoltozesek.find(b => !b.kikoltozes_datum);
        const totalMoveIns = student.bekoltozesek.length;
        
        let totalDaysInDormitory = 0;
        student.bekoltozesek.forEach(bekoltozes => {
          if (bekoltozes.kikoltozes_datum) {
            const endDate = new Date(bekoltozes.kikoltozes_datum);
            const startDate = new Date(bekoltozes.bekoltozes_datum);
            const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            totalDaysInDormitory += daysDiff;
          }
        });

        return {
          diak: {
            id: student.diak_id,
            név: student.nev,
            email: student.email,
            telefon: student.telefonszam,
            születési_dátum: student.szuletesi_datum
          },
          kapcsolattarto: {
            név: student.szulo.nev,
            email: student.szulo.email,
            telefon: student.szulo.telefonszam,
            kapcsolat_típusa: student.kapcsolat_tipusa
          },
          aktuális_elhelyezés: currentBekoltozes ? {
            szoba: currentBekoltozes.szoba.szoba_szama,
            beköltözés_dátuma: currentBekoltozes.bekoltozes_datum,
            összes_hely: currentBekoltozes.szoba.osszes_hely
          } : null,
          statisztikák: {
            összes_beköltözés: totalMoveIns,
            összes_nap_a_kollégiumban: totalDaysInDormitory,
            jelenleg_kollégiumban: !!currentBekoltozes
          },
          előzmények: student.bekoltozesek.map(bekoltozes => ({
            szoba: bekoltozes.szoba.szoba_szama,
            beköltözés: bekoltozes.bekoltozes_datum,
            kiköltözés: bekoltozes.kikoltozes_datum || 'Jelenleg is lakik'
          })),
          jelentés_dátuma: new Date().toISOString()
        };
      }, cacheService.listsTTL);
    } catch (error) {
      throw new Error(`Hiba a diák jelentés generálásában: ${error.message}`);
    }
  }

  /**
   * Diák frissítése szülő és lakcím adatokkal
   * @param {number} id - diák ID
   * @param {Object} updates - frissítendő adatok (diakData, szuloData, lakcimData stb.)
   * @returns {Promise<Object>} - frissített diák profil
   */
  async updateDiak(id, updates) {
    const transaction = await this.db.sequelize.transaction();
    
    try {
      const diak = await this.Diak.findByPk(id);
      if (!diak) {
        throw new Error('A diák nem található!');
      }

      // Szülő kezelése
      if (updates.szuloData) {
        // Új szülő adatok, létrehozunk vagy frissítünk egy szülőt
        let szulo = await this.Szulo.findOne({
          where: { email: updates.szuloData.email }
        });

        let cimId = null;

        // Lakcím kezelése szülőhöz
        if (updates.lakcimData) {
          let lakcim = await this.Lakcim.findOne({
            where: {
              orszag: updates.lakcimData.orszag,
              iranyitoszam: updates.lakcimData.iranyitoszam,
              varos: updates.lakcimData.varos,
              utca_hazszam: updates.lakcimData.utca_hazszam
            }
          });

          if (!lakcim) {
            lakcim = await this.Lakcim.create(updates.lakcimData, { transaction });
          }

          cimId = lakcim.cim_id;
        }

        if (!szulo) {
          // Új szülő létrehozása
          szulo = await this.Szulo.create({
            ...updates.szuloData,
            cim_id: cimId
          }, { transaction });
        } else {
          // Meglévő szülő frissítése
          await szulo.update({
            ...updates.szuloData,
            cim_id: cimId || szulo.cim_id
          }, { transaction });
        }

        updates.szulo_id = szulo.szulo_id;
        delete updates.szuloData;
      }

      // Diák lakcím kezelése (ha nem szülővel összekapcsolt)
      if (updates.lakcimData && !updates.szuloData) {
        let lakcim = await this.Lakcim.findOne({
          where: {
            orszag: updates.lakcimData.orszag,
            iranyitoszam: updates.lakcimData.iranyitoszam,
            varos: updates.lakcimData.varos,
            utca_hazszam: updates.lakcimData.utca_hazszam
          }
        });

        if (!lakcim) {
          lakcim = await this.Lakcim.create(updates.lakcimData, { transaction });
        }

        updates.cim_id = lakcim.cim_id;
        delete updates.lakcimData;
      }

      // Maradék adatok frissítése
      if (updates.szoba_id) {
        // Szoba módosítás nem a repository-val, hanem saját logikával
        delete updates.szoba_id;
      }

      await diak.update(updates, { transaction });
      
      await transaction.commit();

      // Invalidate caches after update
      cacheService.invalidateStudentCache();
      cacheService.invalidateParentCache();
      cacheService.delete(cacheService.generateKey(cacheService.keyPatterns.SINGLE_STUDENT, { id }));

      return await this.getStudentWithFullHistory(id);
    } catch (error) {
      await transaction.rollback();
      if (error.message.includes('nem található')) {
        throw error;
      }
      throw new Error(`Hiba a diák frissítésében: ${error.message}`);
    }
  }
}

module.exports = DiakService;
