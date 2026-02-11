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

      res.json({
        success: true,
        data: diak
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
   * Diák szobájának lekérése
   */
  async getStudentRoom(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen diák ID'
        });
      }

      const student = await this.diakService.getStudentWithFullHistory(parseInt(id));
      
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'A diák nem található'
        });
      }

      const currentBekoltozes = student.bekoltozesek.find(b => !b.kikoltozes_datum);

      if (!currentBekoltozes) {
        return res.status(404).json({
          success: false,
          error: 'A diáknak nincs aktív szobája'
        });
      }

      res.json({
        success: true,
        data: {
          diak: {
            id: student.diak_id,
            név: student.nev
          },
          szoba: {
            id: currentBekoltozes.szoba.szoba_id,
            szoba_szama: currentBekoltozes.szoba.szoba_szama,
            osszes_hely: currentBekoltozes.szoba.osszes_hely
          },
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
}

module.exports = DiakController;
