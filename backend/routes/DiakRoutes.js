const express = require('express');
const { body, param, query } = require('express-validator');
const { createDiakValidator, updateDiakValidator, getDiakValidator } = require('../validators/diakValidators');
const validationHandler = require('../middleware/validationHandler');
const { requireRole } = require('../middleware/requireRole');
const { attachDiakId, requireDiakOwnership } = require('../middleware/ownershipMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/roles');

const router = express.Router();

/**
 * Middleware to resolve user to diak_id
 * Looks up the user's diak_id from Felhasznalo table and attaches it to req.diakId
 */
const resolveDiakId = asyncHandler(async (req, res, next) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'Nem sikerült azonosítani a felhasználót'
    });
  }

  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({
      success: false,
      error: 'Az adatbázis még nem elérhető'
    });
  }

  const user = await db.Felhasznalo.findByPk(userId);

  if (!user || !user.diak_id) {
    return res.status(400).json({
      success: false,
      error: 'A felhasználóhoz nem tartozik diák azonosító'
    });
  }

  req.diakId = user.diak_id;
  next();
});

// Validation middleware for routes not covered by diakValidators
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Az ID pozitív egész számnak kell legyen')
];

const validateTransferStudent = [
  body('uj_szoba_id').isInt({ min: 1 }).withMessage('Az új szoba ID pozitív egész számnak kell legyen'),
  body('atcsatolas_datum').optional().isISO8601().withMessage('Érvényes dátum formátum')
];

const validateMoveOut = [
  body('kikoltozes_datum').optional().isISO8601().withMessage('Érvényes dátum formátum')
];

const validateSearch = [
  query('nev').optional().isString().withMessage('A név szöveg formátumban kell legyen'),
  query('email').optional().isEmail().withMessage('Érvényes email címet adjon meg'),
  query('kapcsolat_tipusa').optional().isIn(['anya', 'apa', 'gondviselo']).withMessage('A kapcsolat típusa csak anya, apa vagy gondviselo lehet'),
  query('aktiv').optional().isBoolean().withMessage('Az aktiv paraméter boolean típusú kell legyen'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('A limit 1 és 100 közötti egész szám lehet'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Az offset nemnegatív egész szám kell legyen'),
  query('sort').optional().isIn(['nev', 'email', 'szuletesi_datum', 'created_at']).withMessage('Érvénytelen rendezési mező'),
  query('order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('A sorrend csak ASC vagy DESC lehet')
];

const validatePagination = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('A limit 1 és 100 közötti egész szám lehet'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Az offset nemnegatív egész szám kell legyen'),
  query('sort').optional().isIn(['nev', 'email', 'szuletesi_datum', 'created_at']).withMessage('Érvénytelen rendezési mező'),
  query('order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('A sorrend csak ASC vagy DESC lehet')
];

const validateEnroll = [
  body('diakData').notEmpty().withMessage('A diák adatai kötelezők'),
  body('szuloData').notEmpty().withMessage('A szülő adatai kötelezők'),
  body('szoba_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('A szoba ID pozitív egész számnak kell lennie')
];

// Controllers are now injected via app.locals.controllers
// No need for lazy initialization anymore

// Import authentication middleware
const { authenticate, isAdmin, canModify } = require('../middleware/authMiddleware');

// Route definitions

// Listázások - minden bejelentkezett felhasználó (főtitkár és titkár is)
router.get('/', authenticate, getDiakValidator, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.getAllDiaks(req, res);
}));

router.get('/active', authenticate, validatePagination, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.getActiveStudents(req, res);
}));

router.get('/search', authenticate, validateSearch, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.searchStudents(req, res);
}));

// Statisztikák és riportok - csak főtitkár
router.get('/statistics', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.getStatistics(req, res);
}));

// Student profile endpoint - gets authenticated student's profile including gender
// FONTOS: Ezeknek a route-oknak a /:id ELŐTT kell lenniük,
// különben az Express a "room" stb. szavakat ID-ként értelmezi!
router.get('/profile', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.getStudentProfile({ params: { id: req.diakId } }, res);
}));

// Student dashboard endpoint - gets current room for authenticated student
router.get('/room', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.getStudentRoom({ params: { id: req.diakId } }, res);
}));

// Student room history endpoint
router.get('/room-history', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.getStudentRoomHistory({ params: { id: req.diakId } }, res);
}));

// Student room change request endpoint
router.post('/room-change', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.szobaValtoztatasController;
  return controller.requestRoomChange({ params: { id: req.diakId }, body: req.body, user: req.user }, res);
}));

// Student notifications endpoint
router.get('/notifications', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.getStudentNotifications({ params: { id: req.diakId } }, res);
}));

// Mark notification as read endpoint
router.put('/notifications/:notificationId/read', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.markNotificationAsRead({ params: { id: req.diakId, notificationId: req.params.notificationId } }, res);
}));

// Mark all notifications as read endpoint
router.put('/notifications/read-all', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.markAllNotificationsAsRead({ params: { id: req.diakId } }, res);
}));

// Részletes nézet - students can only view their own data, admins can view any
router.get('/:id', authenticate, attachDiakId, requireDiakOwnership('id'), validateId, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.getDiakById(req, res);
}));

router.get('/:id/report', authenticate, isAdmin, validateId, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.generateStudentReport(req, res);
}));

router.get('/:id/room', authenticate, attachDiakId, requireDiakOwnership('id'), validateId, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.getStudentRoom(req, res);
}));

// Teljes beiratkozás (diák + szülő + lakcím + szoba) - főtitkár és titkár is
router.post('/enroll', authenticate, canModify, validateEnroll, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.enrollStudent(req, res);
}));

// Tömeges beiratkozás - csak főtitkár
router.post('/bulk-enroll', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.bulkEnrollStudents(req, res);
}));

// Létrehozás, módosítás, törlés - csak főtitkár és titkár
router.post('/', authenticate, requireRole(ROLES.TITKAR, ROLES.FOTITKAR), createDiakValidator, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.createDiak(req, res);
}));

router.put('/:id', authenticate, canModify, updateDiakValidator, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.updateDiak(req, res);
}));

router.delete('/:id', authenticate, isAdmin, validateId, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.deleteDiak(req, res);
}));

// Költöztetési műveletek - minden bejelentkezett felhasználó (főtitkár és titkár is)
router.post('/:id/transfer', authenticate, validateId, validateTransferStudent, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.transferStudent(req, res);
}));

router.post('/:id/move-out', authenticate, validateId, validateMoveOut, validationHandler, asyncHandler(async (req, res) => {
  const controller = req.app.locals.controllers.diakController;
  return controller.moveOutStudent(req, res);
}));

module.exports = router;