const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const DiakService = require('../services/DiakService');
const DiakRepository = require('../repositories/DiakRepository');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError, ConflictError, ForbiddenError } = require('../utils/AppError');

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
  getAllDiaks = asyncHandler(async (req, res) => {
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
  });

  /**
   * GET /api/diaks/:id
   * Egy diák lekérése ID alapján
   */
  getDiakById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throw new ValidationError('Érvénytelen diák ID');
    }

    const diak = await this.diakService.getStudentWithFullHistory(parseInt(id));
    
    if (!diak) {
      throw new NotFoundError('Diák');
    }

    // Computed fields hozzáadása
    const diakJSON = diak.toJSON();
    const activeBekoltozes = diakJSON.bekoltozesek?.find(b => b.kikoltozes_datum === null);
    diakJSON.aktiv = !!activeBekoltozes;
    diakJSON.szoba = activeBekoltozes?.szoba || null;

    res.json({
      success: true,
      data: diakJSON
    });
  });

  /**
   * POST /api/diaks
   * Új diák létrehozása
   */
  createDiak = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new ValidationError('Validációs hiba');
      error.details = errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }));
      throw error;
    }

    const diakData = req.body;
    const diak = await this.diakService.repository.create(diakData);

    res.status(201).json({
      success: true,
      data: diak,
      message: 'Diák sikeresen létrehozva'
    });
  });

  /**
   * PUT /api/diaks/:id
   * Diák frissítése
   */
  updateDiak = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new ValidationError('Validációs hiba');
      error.details = errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }));
      throw error;
    }

    const { id } = req.params;

    if (!id || isNaN(id)) {
      throw new ValidationError('Érvénytelen diák ID');
    }

    const diak = await this.diakService.updateDiak(parseInt(id), req.body);

    res.json({
      success: true,
      data: diak,
      message: 'Diák sikeresen frissítve'
    });
  });

  /**
   * DELETE /api/diaks/:id
   * Diák törlése
   */
  deleteDiak = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throw new ValidationError('Érvénytelen diák ID');
    }

    await this.diakService.repository.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Diák sikeresen törölve'
    });
  });

  /**
   * POST /api/diaks/enroll
   * Teljes diák beiratkozás folyamat
   */
  enrollStudent = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new ValidationError('Validációs hiba');
      error.details = errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }));
      throw error;
    }

    const enrollmentData = req.body;
    const enrolledStudent = await this.diakService.enrollStudent(enrollmentData);

    res.status(201).json({
      success: true,
      data: enrolledStudent,
      message: 'Diák sikeresen beiratkozva'
    });
  });

  /**
   * POST /api/diaks/:id/transfer
   * Diák átcsatolása másik szobába
   */
  transferStudent = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new ValidationError('Validációs hiba');
      error.details = errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }));
      throw error;
    }

    const { id } = req.params;
    const { uj_szoba_id, atcsatolas_datum } = req.body;

    if (!id || isNaN(id) || !uj_szoba_id || isNaN(uj_szoba_id)) {
      throw new ValidationError('Érvénytelen ID paraméterek');
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
  });

  /**
   * POST /api/diaks/:id/move-out
   * Diák kiköltöztetése
   */
  moveOutStudent = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new ValidationError('Validációs hiba');
      error.details = errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }));
      throw error;
    }

    const { id } = req.params;
    const { kikoltozes_datum } = req.body;

    if (!id || isNaN(id)) {
      throw new ValidationError('Érvénytelen diák ID');
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
  });

  /**
   * GET /api/diaks/:id/report
   * Diák jelentés generálása
   */
  generateStudentReport = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throw new ValidationError('Érvénytelen diák ID');
    }

    const report = await this.diakService.generateStudentReport(parseInt(id));

    res.json({
      success: true,
      data: report
    });
  });

  /**
   * GET /api/diaks/statistics
   * Diákok statisztikája
   */
  getStatistics = asyncHandler(async (req, res) => {
    const statistics = await this.diakService.getDetailedStatistics();

    res.json({
      success: true,
      data: statistics
    });
  });

  /**
   * GET /api/diaks/search
   * Diákok keresése
   */
  searchStudents = asyncHandler(async (req, res) => {
    const { nev, email, szoba_szama, kapcsolat_tipusa, aktiv, limit, offset, sort, order } = req.query;

    const searchCriteria = {};
    if (nev) searchCriteria.nev = nev;
    if (email) searchCriteria.email = email;
    if (szoba_szama) searchCriteria.szoba_szama = szoba_szama;
    if (kapcsolat_tipusa) searchCriteria.kapcsolat_tipusa = kapcsolat_tipusa;
    if (aktiv !== undefined) searchCriteria.aktiv = aktiv === 'true';

    const paginationOptions = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      sort: sort || 'nev',
      order: order ? (order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') : 'ASC'
    };

    const result = await this.diakService.searchStudents(searchCriteria, paginationOptions);

    res.json({
      success: true,
      data: result.rows,
      searchCriteria,
      pagination: {
        limit: paginationOptions.limit,
        offset: paginationOptions.offset,
        total: result.count,
        hasMore: paginationOptions.offset + result.rows.length < result.count
      }
    });
  });

  /**
   * POST /api/diaks/bulk-enroll
   * Diákok tömeges beiratkozása
   */
  bulkEnrollStudents = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new ValidationError('Validációs hiba');
      error.details = errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }));
      throw error;
    }

    const { studentsData } = req.body;

    if (!Array.isArray(studentsData)) {
      throw new ValidationError('A studentsData paraméternek tömbnek kell lennie');
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
  });

  /**
   * GET /api/diaks/active
   * Aktív diákok lekérése
   */
  getActiveStudents = asyncHandler(async (req, res) => {
    const { 
      limit = 50, 
      offset = 0, 
      sort = 'nev', 
      order = 'ASC'
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort,
      order: order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    };

    const result = await this.diakService.repository.findActive(options);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: result.count,
        hasMore: options.offset + result.rows.length < result.count
      }
    });
  });

  /**
   * GET /api/diaks/:id/room
   * Diák szobájának lekérése (szobatársakkal együtt)
   */
  getStudentRoom = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const diakId = parseInt(id);

    if (!id || isNaN(diakId)) {
      throw new ValidationError('Érvénytelen diák ID');
    }

    const student = await this.diakService.getStudentWithFullHistory(diakId);
    
    if (!student) {
      throw new NotFoundError('Diák');
    }

    // Ellenőrizzük, hogy van-e egyáltalán beköltözési rekord
    if (!student.bekoltozesek || student.bekoltozesek.length === 0) {
      throw new NotFoundError('A diáknak nincs szobabeosztása');
    }

    // Keresünk aktív beköltözést
    const currentBekoltozes = student.bekoltozesek.find(b => !b.kikoltozes_datum);

    if (!currentBekoltozes) {
      throw new NotFoundError('A diáknak nincs aktív szobája (már kiköltözött)');
    }

    const szoba = currentBekoltozes.szoba;

    // Szobatársak lekérése
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
  });

  /**
   * GET /api/diaks/:id/room-history
   * Diák szobaváltási történetének lekérése
   */
  getStudentRoomHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const diakId = parseInt(id);

    if (!id || isNaN(diakId)) {
      throw new ValidationError('Érvénytelen diák ID');
    }

    // Ellenőrizzük, hogy a diák létezik-e
    const diak = await this.db.Diak.findByPk(diakId);
    if (!diak) {
      throw new NotFoundError('Diák');
    }

    // Közvetlen lekérdezés
    const roomChanges = await this.db.SzobaValtoztatas.findAll({
      where: { diak_id: diakId },
      include: [
        { model: this.db.Szoba, as: 'jelenlegi_szoba', attributes: ['szoba_id', 'szoba_szama', 'osszes_hely'] },
        { model: this.db.Szoba, as: 'kivant_szoba', attributes: ['szoba_id', 'szoba_szama', 'osszes_hely'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: roomChanges
    });
  });

  /**
   * POST /api/diaks/:id/room-change
   * Diák szobaváltási kérelem benyújtása
   */
  submitRoomChangeRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { kivant_szoba_id, indok } = req.body;

    if (!id || isNaN(id) || !kivant_szoba_id || isNaN(kivant_szoba_id)) {
      throw new ValidationError('Érvénytelen paraméterek');
    }

    // Ellenőrizzük, hogy a diák létezik-e
    const student = await this.diakService.getStudentWithFullHistory(parseInt(id));
    if (!student) {
      throw new NotFoundError('Diák');
    }

    // Ellenőrizzük, hogy van-e aktív beköltözése
    const currentBekoltozes = student.bekoltozesek.find(b => !b.kikoltozes_datum);
    if (!currentBekoltozes) {
      throw new ConflictError('A diáknak nincs aktív szobája');
    }

    // Ellenőrizzük a szobaváltási korlátot és hozzuk létre a kérelmet tranzakcióban
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    const roomChange = await this.db.sequelize.transaction(async (transaction) => {
      // Ellenőrizzük a szobaváltási korlátot (tranzakcióban a konzisztencia érdekében)
      const pendingOrApprovedCount = await this.db.SzobaValtoztatas.count({
        where: {
          diak_id: parseInt(id),
          academic_year: academicYear,
          statusz: ['pending', 'approved']
        },
        transaction
      });

      if (pendingOrApprovedCount >= 3) {
        throw new ConflictError('Elérte a félévi szobaváltási korlátot (3 alkalom)');
      }

      // Létrehozzuk a szobaváltási kérelmet
      const SzobaValtoztatas = this.db.SzobaValtoztatas;
      return await SzobaValtoztatas.create({
        diak_id: parseInt(id),
        jelenlegi_szoba_id: currentBekoltozes.szoba_id,
        kivant_szoba_id: parseInt(kivant_szoba_id),
        indok: indok || null,
        statusz: 'pending',
        academic_year: academicYear
      }, { transaction });
    });

    res.status(201).json({
      success: true,
      data: roomChange,
      message: 'Szobaváltási kérelem sikeresen benyújtva'
    });
  });

  /**
   * GET /api/diaks/:id/notifications
   * Diák értesítéseinek lekérése
   */
  getStudentNotifications = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throw new ValidationError('Érvénytelen diák ID');
    }

    // Ellenőrizzük, hogy a diák létezik-e
    const student = await this.diakService.getStudentWithFullHistory(parseInt(id));
    if (!student) {
      throw new NotFoundError('Diák');
    }

    const Notification = this.db.Notification;
    const notifications = await Notification.findAll({
      where: { diak_id: parseInt(id) },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: notifications
    });
  });

  /**
   * PUT /api/diaks/:id/notifications/:notificationId/read
   * Értesítés olvasottnak jelölése
   */
  markNotificationAsRead = asyncHandler(async (req, res) => {
    const { id, notificationId } = req.params;

    if (!id || isNaN(id) || !notificationId || isNaN(notificationId)) {
      throw new ValidationError('Érvénytelen paraméterek');
    }

    const Notification = this.db.Notification;
    const notification = await Notification.findByPk(parseInt(notificationId));
    
    if (!notification) {
      throw new NotFoundError('Értesítés');
    }

    // Ellenőrizzük, hogy az értesítés a megfelelő diákhoz tartozik-e
    if (notification.diak_id !== parseInt(id)) {
      throw new ForbiddenError('Nincs jogosultsága az értesítés elolvasásához');
    }

    await notification.update({ elolvasva: true });

    res.json({
      success: true,
      message: 'Értesítés sikeresen olvasottnak jelölve'
    });
  });

  /**
   * PUT /api/diaks/:id/notifications/read-all
   * Összes értesítés olvasottnak jelölése
   */
  markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throw new ValidationError('Érvénytelen diák ID');
    }

    // Ellenőrizzük, hogy a diák létezik-e
    const student = await this.diakService.getStudentWithFullHistory(parseInt(id));
    if (!student) {
      throw new NotFoundError('Diák');
    }

    const Notification = this.db.Notification;
    await Notification.update(
      { elolvasva: true },
      { where: { diak_id: parseInt(id), elolvasva: false } }
    );

    res.json({
      success: true,
      message: 'Összes értesítés sikeresen olvasottnak jelölve'
    });
  });
}

module.exports = DiakController;
