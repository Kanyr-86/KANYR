const express = require('express');
const { body, param, query } = require('express-validator');
const DiakController = require('../controllers/DiakController');
const { createDiakValidator, updateDiakValidator, getDiakValidator } = require('../validators/diakValidators');
const validationHandler = require('../middleware/validationHandler');
const { requireRole, requireSelfOrRole } = require('../middleware/requireRole');
const asyncHandler = require('../utils/asyncHandler');

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
  query('aktiv').optional().isBoolean().withMessage('Az aktiv paraméter boolean típusú kell legyen')
];

const validateEnroll = [
  body('diakData').notEmpty().withMessage('A diák adatai kötelezők'),
  body('szuloData').notEmpty().withMessage('A szülő adatai kötelezők'),
  body('szoba_id').isInt({ min: 1 }).withMessage('A szoba ID pozitív egész számnak kell lennie')
];

// Initialize controller with database
let diakController = null;

const initializeController = (db) => {
  if (!diakController) {
    diakController = new DiakController(db);
  }
  return diakController;
};

// Import authentication middleware
const { authenticate, isAdmin, canModify } = require('../middleware/authMiddleware');

// Route definitions

// Listázások - minden bejelentkezett felhasználó (főtitkár és titkár is)
router.get('/', authenticate, getDiakValidator, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getAllDiaks(req, res);
}));

router.get('/active', authenticate, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getActiveStudents(req, res);
}));

router.get('/search', authenticate, validateSearch, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.searchStudents(req, res);
}));

// Statisztikák és riportok - csak főtitkár
router.get('/statistics', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getStatistics(req, res);
}));

// Student dashboard endpoint - gets current room for authenticated student
// FONTOS: Ezeknek a /students/* route-oknak a /:id ELŐTT kell lenniük,
// különben az Express a "students" szót ID-ként értelmezi!
router.get('/students/room', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getStudentRoom({ params: { id: req.diakId } }, res);
}));

// Student room history endpoint
router.get('/students/room-history', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getStudentRoomHistory({ params: { id: req.diakId } }, res);
}));

// Student room change request endpoint
router.post('/students/room-change', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.submitRoomChangeRequest({ params: { id: req.diakId }, body: req.body }, res);
}));

// Student notifications endpoint
router.get('/students/notifications', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getStudentNotifications({ params: { id: req.diakId } }, res);
}));

// Mark notification as read endpoint
router.put('/students/notifications/:notificationId/read', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.markNotificationAsRead({ params: { id: req.diakId, notificationId: req.params.notificationId } }, res);
}));

// Mark all notifications as read endpoint
router.put('/students/notifications/read-all', authenticate, resolveDiakId, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.markAllNotificationsAsRead({ params: { id: req.diakId } }, res);
}));

// Részletes nézet - minden bejelentkezett felhasználó
router.get('/:id', authenticate, requireSelfOrRole('id', 'titkár'), validateId, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getDiakById(req, res);
}));

router.get('/:id/report', authenticate, isAdmin, validateId, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.generateStudentReport(req, res);
}));

router.get('/:id/room', authenticate, validateId, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getStudentRoom(req, res);
}));

// Teljes beiratkozás (diák + szülő + lakcím + szoba) - főtitkár és titkár is
router.post('/enroll', authenticate, canModify, validateEnroll, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.enrollStudent(req, res);
}));

// Tömeges beiratkozás - csak főtitkár
router.post('/bulk-enroll', authenticate, isAdmin, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.bulkEnrollStudents(req, res);
}));

// Létrehozás, módosítás, törlés - csak főtitkár
router.post('/', authenticate, requireRole('titkár'), createDiakValidator, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createDiak(req, res);
}));

router.put('/:id', authenticate, canModify, updateDiakValidator, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateDiak(req, res);
}));

router.delete('/:id', authenticate, isAdmin, validateId, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteDiak(req, res);
}));

// Költöztetési műveletek - minden bejelentkezett felhasználó (főtitkár és titkár is)
router.post('/:id/transfer', authenticate, validateId, validateTransferStudent, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.transferStudent(req, res);
}));

router.post('/:id/move-out', authenticate, validateId, validateMoveOut, validationHandler, asyncHandler(async (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.moveOutStudent(req, res);
}));

module.exports = router;