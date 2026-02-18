const { validationResult } = require('express-validator');
const DiakService = require('../services/DiakService');
const DiakRepository = require('../repositories/DiakRepository');

class DiakController {
  constructor(db) {
    this.db = db;
    this.diakRepository = new DiakRepository(db);
    this.diakService = new DiakService(db, { repository: this.diakRepository });
  }

  /**
   * GET /api/diaks
   * Összes diák lekérése
   */
  async getAllDiaks(req, res) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        sort = 'nev', 
        order = 'ASC',
        includeRelations = 'true' 
      } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sort,
        order,
        includeRelations: includeRelations !== 'false'
      };

      const diaks = await this.diakService.repository.findAll(options);
      
      res.json({
        success: true,
        data: diaks,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: diaks.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/diaks/:id
   * Egy diák lekérése ID alapján
   */
  async getDiakById(req, res) {
    try {
      const { id } = req.params;
      const { includeRelations = true } = req.query;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen diák ID'
        });
      }

      const diak = await this.diakService.getStudentWithFullHistory(parseInt(id));
      
      if (!diak) {
        return res.status(404).json({
          success: false,
          error: 'A diák nem található'
        });
      }

      // Computed fields hozzáadása (ugyanaz a logika, mint DiakRepository.findAll post-processing)
      const diakJSON = diak.toJSON();
      const activeBekoltozes = diakJSON.bekoltozesek?.find(b => b.kikoltozes_datum === null);
      diakJSON.aktiv = !!activeBekoltozes;
      diakJSON.szoba = activeBekoltozes?.szoba || null;

      res.json({
        success: true,
        data: diakJSON
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/diaks
   * Új diák létrehozása
   */
  async createDiak(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const diakData = req.body;
      const diak = await this.diakService.repository.create(diakData);

      res.status(201).json({
        success: true,
        data: diak,
        message: 'Diák sikeresen létrehozva'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/diaks/:id
   * Diák frissítése
   */
  async updateDiak(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const updates = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen diák ID'
        });
      }

      const diak = await this.diakService.updateDiak(parseInt(id), updates);

      res.json({
        success: true,
        data: diak,
        message: 'Diák sikeresen frissítve'
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * DELETE /api/diaks/:id
   * Diák törlése
   */
  async deleteDiak(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen diák ID'
        });
      }

      await this.diakService.repository.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Diák sikeresen törölve'
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error.message.includes('aktív beköltözése')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * POST /api/diaks/enroll
   * Teljes diák beiratkozás folyamat
   */
  async enrollStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const enrollmentData = req.body;
      const enrolledStudent = await this.diakService.enrollStudent(enrollmentData);

      res.status(201).json({
        success: true,
        data: enrolledStudent,
        message: 'Diák sikeresen beiratkozva'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/diaks/:id/transfer
   * Diák átcsatolása másik szobába
   */
  async transferStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { uj_szoba_id, atcsatolas_datum } = req.body;

      if (!id || isNaN(id) || !uj_szoba_id || isNaN(uj_szoba_id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen ID paraméterek'
        });
      }

      const transferredStudent = await this.diakService.transferStudent(
        parseInt(id),
        parseInt(uj_szoba_id),
        atcsatolas_datum ? new Date(atcsatolas_datum) : new Date()
      );

      res.json({
        success: true,
        data: transferredStudent,
        message: 'Diák sikeresen átcsatolva'
      });
    } catch (error) {
      if (error.message.includes('nem található') || error.message.includes('nincs aktív beköltözése')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error.message.includes('teljes')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * POST /api/diaks/:id/move-out
   * Diák kiköltöztetése
   */
  async moveOutStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { kikoltozes_datum } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen diák ID'
        });
      }

      const movedOutStudent = await this.diakService.moveOutStudent(
        parseInt(id),
        kikoltozes_datum ? new Date(kikoltozes_datum) : new Date()
      );

      res.json({
        success: true,
        data: movedOutStudent,
        message: 'Diák sikeresen kiköltöztetve'
      });
    } catch (error) {
      if (error.message.includes('nem található') || error.message.includes('nincs aktív beköltözése')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * GET /api/diaks/:id/report
   * Diák jelentés generálása
   */
  async generateStudentReport(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen diák ID'
        });
      }

      const report = await this.diakService.generateStudentReport(parseInt(id));

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * GET /api/diaks/statistics
   * Diákok statisztikája
   */
  async getStatistics(req, res) {
    try {
      const statistics = await this.diakService.getDetailedStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/diaks/search
   * Diákok keresése
   */
  async searchStudents(req, res) {
    try {
      const { nev, email, szoba_szama, kapcsolat_tipusa, aktiv } = req.query;

      const searchCriteria = {};
      if (nev) searchCriteria.nev = nev;
      if (email) searchCriteria.email = email;
      if (szoba_szama) searchCriteria.szoba_szama = szoba_szama;
      if (kapcsolat_tipusa) searchCriteria.kapcsolat_tipusa = kapcsolat_tipusa;
      if (aktiv !== undefined) searchCriteria.aktiv = aktiv === 'true';

      const students = await this.diakService.searchStudents(searchCriteria);

      res.json({
        success: true,
        data: students,
        searchCriteria,
        count: students.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/diaks/bulk-enroll
   * Diákok tömeges beiratkozása
   */
  async bulkEnrollStudents(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const { studentsData } = req.body;

      if (!Array.isArray(studentsData)) {
        return res.status(400).json({
          success: false,
          error: 'A studentsData paraméternek tömbnek kell lennie'
        });
      }

      const results = await this.diakService.bulkEnrollStudents(studentsData);

      res.status(201).json({
        success: true,
        data: results,
        summary: {
          successful: results.successful.length,
          failed: results.failed.length,
          total: studentsData.length
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/diaks/active
   * Aktív diákok lekérése
   */
  async getActiveStudents(req, res) {
    try {
      const activeStudents = await this.diakService.repository.findActive();

      res.json({
        success: true,
        data: activeStudents,
        count: activeStudents.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/diaks/:id/room
   * Diák szobájának lekérése (szobatársakkal együtt)
   */
  async getStudentRoom(req, res) {
    try {
      const { id } = req.params;
      const diakId = parseInt(id);

      if (!id || isNaN(diakId)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen diák ID'
        });
      }

      const student = await this.diakService.getStudentWithFullHistory(diakId);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'A diák nem található'
        });
      }

      // Ellenőrizzük, hogy van-e egyáltalán beköltözési rekord
      if (!student.bekoltozesek || student.bekoltozesek.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'A diáknak nincs szobabeosztása'
        });
      }

      // Keresünk aktív beköltözést (nincs kiköltözési dátum)
      const currentBekoltozes = student.bekoltozesek.find(b => !b.kikoltozes_datum);

      if (!currentBekoltozes) {
        return res.status(404).json({
          success: false,
          error: 'A diáknak nincs aktív szobája (már kiköltözött)'
        });
      }

      const szoba = currentBekoltozes.szoba;

      // Szobatársak lekérése (mindenki ugyanabban a szobában, kivéve az aktuális diák)
      const { Op } = require('sequelize');
      const szobatarsBekoltozesek = await this.db.SzobaBekoltozes.findAll({
        where: {
          szoba_id: szoba.szoba_id,
          kikoltozes_datum: null,
          diak_id: { [Op.ne]: diakId }
        },
        include: [{
          model: this.db.Diak,
          as: 'diak',
          attributes: ['nev', 'email', 'telefonszam']
        }]
      });

      const szobatarsak = szobatarsBekoltozesek.map(b => ({
        nev: b.diak.nev,
        email: b.diak.email,
        telefonszam: b.diak.telefonszam
      }));

      res.json({
        success: true,
        data: {
          diak: {
            id: student.diak_id,
            nev: student.nev,
            email: student.email,
            telefonszam: student.telefonszam
          },
          szoba: {
            id: szoba.szoba_id,
            szoba_szama: szoba.szoba_szama,
            osszes_hely: szoba.osszes_hely
          },
          szobatarsak,
          bekoltozes_datum: currentBekoltozes.bekoltozes_datum
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/diaks/:id/room-history
   * Diák szobaváltási történetének lekérése
   *
   * MEGJEGYZÉS: A Diak modell nem definiál hasMany(SzobaValtoztatas) asszociációt,
   * ezért getStudentWithFullHistory() nem tudja betölteni – közvetlen lekérdezéssel
   * dolgozunk, hogy ne függjünk a hiányzó asszociációtól.
   */
  async getStudentRoomHistory(req, res) {
    try {
      const { id } = req.params;
      const diakId = parseInt(id);

      if (!id || isNaN(diakId)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen diák ID'
        });
      }

      // Ellenőrizzük, hogy a diák létezik-e
      const diak = await this.db.Diak.findByPk(diakId);
      if (!diak) {
        return res.status(404).json({
          success: false,
          error: 'A diák nem található'
        });
      }

      // Közvetlen lekérdezés – nem függ a Diak<->SzobaValtoztatas asszociációtól
      const roomChanges = await this.db.SzobaValtoztatas.findAll({
        where: { diak_id: diakId },
        include: [
          { model: this.db.Szoba, as: 'jelenlegi_szoba', attributes: ['szoba_id', 'szoba_szama', 'osszes_hely'] },
          { model: this.db.Szoba, as: 'kivant_szoba',    attributes: ['szoba_id', 'szoba_szama', 'osszes_hely'] }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: roomChanges
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/diaks/:id/room-change
   * Diák szobaváltási kérelem benyújtása
   */
  async submitRoomChangeRequest(req, res) {
    try {
      const { id } = req.params;
      const { kivant_szoba_id, indok } = req.body;

      if (!id || isNaN(id) || !kivant_szoba_id || isNaN(kivant_szoba_id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen paraméterek'
        });
      }

      // Ellenőrizzük, hogy a diák létezik-e
      const student = await this.diakService.getStudentWithFullHistory(parseInt(id));
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'A diák nem található'
        });
      }

      // Ellenőrizzük, hogy van-e aktív beköltözése
      const currentBekoltozes = student.bekoltozesek.find(b => !b.kikoltozes_datum);
      if (!currentBekoltozes) {
        return res.status(400).json({
          success: false,
          error: 'A diáknak nincs aktív szobája'
        });
      }

      // Ellenőrizzük a szobaváltási korlátot – közvetlen DB lekérdezés,
      // mert getStudentWithFullHistory() nem tölti be a szobavaltoztatasok asszociációt
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;
      const pendingOrApprovedCount = await this.db.SzobaValtoztatas.count({
        where: {
          diak_id: parseInt(id),
          academic_year: academicYear,
          statusz: ['pending', 'approved']
        }
      });

      if (pendingOrApprovedCount >= 3) {
        return res.status(400).json({
          success: false,
          error: 'Elérte a félévi szobaváltási korlátot (3 alkalom)'
        });
      }

      // Létrehozzuk a szobaváltási kérelmet
      const SzobaValtoztatas = this.db.SzobaValtoztatas;
      const roomChange = await SzobaValtoztatas.create({
        diak_id: parseInt(id),
        jelenlegi_szoba_id: currentBekoltozes.szoba_id,
        kivant_szoba_id: parseInt(kivant_szoba_id),
        indok: indok || null,
        statusz: 'pending',
        academic_year: academicYear
      });

      res.status(201).json({
        success: true,
        data: roomChange,
        message: 'Szobaváltási kérelem sikeresen benyújtva'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/diaks/:id/notifications
   * Diák értesítéseinek lekérése
   */
  async getStudentNotifications(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen diák ID'
        });
      }

      // Ellenőrizzük, hogy a diák létezik-e
      const student = await this.diakService.getStudentWithFullHistory(parseInt(id));
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'A diák nem található'
        });
      }

      // Használjuk a megfelelő modelleket a db objektumból
      const Notification = this.db.Notification;
      const notifications = await Notification.findAll({
        where: { diak_id: parseInt(id) },
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/diaks/:id/notifications/:notificationId/read
   * Értesítés olvasottnak jelölése
   */
  async markNotificationAsRead(req, res) {
    try {
      const { id, notificationId } = req.params;

      if (!id || isNaN(id) || !notificationId || isNaN(notificationId)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen paraméterek'
        });
      }

      // Használjuk a megfelelő modelleket a db objektumból
      const Notification = this.db.Notification;
      const notification = await Notification.findByPk(parseInt(notificationId));
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Az értesítés nem található'
        });
      }

      // Ellenőrizzük, hogy az értesítés a megfelelő diákhoz tartozik-e
      if (notification.diak_id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          error: 'Nincs jogosultsága az értesítés elolvasásához'
        });
      }

      await notification.update({ elolvasva: true });

      res.json({
        success: true,
        message: 'Értesítés sikeresen olvasottnak jelölve'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/diaks/:id/notifications/read-all
   * Összes értesítés olvasottnak jelölése
   */
  async markAllNotificationsAsRead(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen diák ID'
        });
      }

      // Ellenőrizzük, hogy a diák létezik-e
      const student = await this.diakService.getStudentWithFullHistory(parseInt(id));
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'A diák nem található'
        });
      }

      // Használjuk a megfelelő modelleket a db objektumból
      const Notification = this.db.Notification;
      await Notification.update(
        { elolvasva: true },
        { where: { diak_id: parseInt(id), elolvasva: false } }
      );

      res.json({
        success: true,
        message: 'Összes értesítés sikeresen olvasottnak jelölve'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = DiakController;
