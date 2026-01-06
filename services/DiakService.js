const { Transaction } = require('sequelize');

class DiakService {
  constructor(db, options = {}) {
    this.db = db;
    this.Diak = db.Diak;
    this.Szulo = db.Szulo;
    this.Lakcim = db.Lakcim;
    this.SzobaBekoltozes = db.SzobaBekoltozes;
    this.Szoba = db.Szoba;
    this.transaction = options.transaction || null;
  }

  /**
   * Diák lekérése minden kapcsolódó adattal
   * @param {number} id - diák ID
   * @returns {Promise<Object>} - teljes diák profil
   */
  async getStudentWithFullHistory(id) {
    try {
      return await this.Diak.findByPk(id, {
        include: [
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
        ]
      });
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
      bekoltozes_datum
    } = enrollmentData;

    const transaction = await this.db.sequelize.transaction();
    
    try {
      // 1. Lakcím létrehozása vagy megtalálása
      let lakcim = await this.Lakcim.findOne({
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

      // 2. Szülő létrehozása vagy frissítése
      let szulo = await this.Szulo.findOne({
        where: { email: szuloData.email }
      });

      if (!szulo) {
        szulo = await this.Szulo.create({
          ...szuloData,
          cim_id: lakcim.cim_id
        }, { transaction });
      }

      // 3. Diák létrehozása
      const diak = await this.Diak.create({
        ...diakData,
        szulo_id: szulo.szulo_id,
        cim_id: lakcim.cim_id
      }, { transaction });

      // 4. Szoba elérhetőség ellenőrzése
      await this.checkRoomAvailability(szoba_id);

      // 5. Beköltözés rögzítése
      await this.SzobaBekoltozes.create({
        diak_id: diak.diak_id,
        szoba_id: szoba_id,
        bekoltozes_datum: bekoltozes_datum || new Date(),
        kikoltozes_datum: null
      }, { transaction });

      await transaction.commit();

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

      // Aktív beköltözés lezárása
      const activeBekoltozes = await this.SzobaBekoltozes.findOne({
        where: {
          diak_id,
          kikoltozes_datum: null
        }
      });

      if (!activeBekoltozes) {
        throw new Error('A diáknak nincs aktív beköltözése!');
      }

      // Lezárjuk az aktív beköltözést
      await activeBekoltozes.update({
        kikoltozes_datum: atcsatolas_datum
      }, { transaction });

      // Új szoba elérhetőség ellenőrzése
      await this.checkRoomAvailability(uj_szoba_id);

      // Új beköltözés létrehozása
      await this.SzobaBekoltozes.create({
        diak_id,
        szoba_id: uj_szoba_id,
        bekoltozes_datum: atcsatolas_datum,
        kikoltozes_datum: null
      }, { transaction });

      await transaction.commit();

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

      return await this.getStudentWithFullHistory(diak_id);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Hiba a kiköltöztetés során: ${error.message}`);
    }
  }

  /**
   * Szoba elérhetőségének ellenőrzése
   * @param {number} szoba_id - szoba ID
   * @returns {Promise<boolean>} - elérhető-e
   */
  async checkRoomAvailability(szoba_id) {
    try {
      const szoba = await this.Szoba.findByPk(szoba_id);
      if (!szoba) {
        throw new Error('A szoba nem található!');
      }

      const currentOccupancy = await this.SzobaBekoltozes.count({
        where: {
          szoba_id,
          kikoltozes_datum: null
        }
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
      const totalStudents = await this.Diak.count();
      
      const studentsWithActiveMoveIns = await this.Diak.count({
        include: [{
          model: this.SzobaBekoltozes,
          as: 'bekoltozesek',
          where: {
            kikoltozes_datum: null
          },
          required: true
        }]
      });

      const studentsWithoutActiveMoveIns = totalStudents - studentsWithActiveMoveIns;

      // Szoba kihasználtság
      const allRooms = await this.Szoba.findAll();
      const roomStatistics = await Promise.all(allRooms.map(async (szoba) => {
        const occupancy = await this.SzobaBekoltozes.count({
          where: {
            szoba_id: szoba.szoba_id,
            kikoltozes_datum: null
          }
        });
        
        return {
          szoba_id: szoba.szoba_id,
          szoba_szama: szoba.szoba_szama,
          osszes_hely: szoba.osszes_hely,
          aktualis_szam: occupancy,
          kihasznaltseg: ((occupancy / szoba.osszes_hely) * 100).toFixed(1) + '%'
        };
      }));

      // Kapcsolat típusok eloszlása
      const kapcsolatTipusok = await this.Diak.group('kapcsolat_tipusa', {
        attributes: ['kapcsolat_tipusa'],
        type: 'COUNT'
      });

      const kapcsolatStats = {};
      kapcsolatTipusok.forEach(item => {
        kapcsolatStats[item.kapcsolat_tipusa] = item.count;
      });

      return {
        diakok: {
          osszzesen: totalStudents,
          aktivan_bekoltözött: studentsWithActiveMoveIns,
          aktivan_nem_bekoltözött: studentsWithoutActiveMoveIns
        },
        szoba_kihasznaltseg: roomStatistics,
        kapcsolat_tipusok: kapcsolatStats,
        keszültség_dátum: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Hiba a részletes statisztikák lekérésében: ${error.message}`);
    }
  }

  /**
   * Diák keresése több feltétel alapján
   * @param {Object} searchCriteria - keresési feltételek
   * @returns {Promise<Array>} - talált diákok
   */
  async searchStudents(searchCriteria) {
    try {
      const { nev, email, szoba_szama, kapcsolat_tipusa, aktiv } = searchCriteria;
      
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
        ]
      };

      const whereConditions = {};

      if (nev) {
        whereConditions.nev = { [this.db.Sequelize.Op.like]: `%${nev}%` };
      }

      if (email) {
        whereConditions.email = { [this.db.Sequelize.Op.like]: `%${email}%` };
      }

      if (kapcsolat_tipusa) {
        whereConditions.kapcsolat_tipusa = kapcsolat_tipusa;
      }

      queryOptions.where = whereConditions;

      return await this.Diak.findAll(queryOptions);
    } catch (error) {
      throw new Error(`Hiba a diákok keresése során: ${error.message}`);
    }
  }

  /**
   * Diákok tömeges beiratkozása CSV-ből vagy JSON-ből
   * @param {Array} studentsData - diákok adatok tömbje
   * @returns {Promise<Object>} - beiratkozás eredménye
   */
  async bulkEnrollStudents(studentsData) {
    const transaction = await this.db.sequelize.transaction();
    const results = {
      successful: [],
      failed: []
    };

    try {
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

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Hiba a tömeges beiratkozás során: ${error.message}`);
    }
  }

  /**
   * Diák jelentés generálása
   * @param {number} diak_id - diák ID
   * @returns {Promise<Object>} - diák jelentés
   */
  async generateStudentReport(diak_id) {
    try {
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
    } catch (error) {
      throw new Error(`Hiba a diák jelentés generálásában: ${error.message}`);
    }
  }
}

module.exports = DiakService;
