const express = require('express');
const { body, param, query } = require('express-validator');
const ErtesitesController = require('../controllers/ErtesitesController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation middleware
const validateNotificationId = [
  param('id').isInt({ min: 1 }).withMessage('Az ID pozitív egész számnak kell legyen')
];

const validateCreateAnnouncement = [
  body('cimzett_tipus')
    .isIn(['diak', 'szulo', 'admin', 'mindenki'])
    .withMessage('A címzett típus csak diak, szulo, admin vagy mindenki lehet'),
  body('cim')
    .notEmpty().withMessage('A cím kötelező')
    .isLength({ max: 200 }).withMessage('A cím maximum 200 karakter lehet'),
  body('uzenet')
    .notEmpty().withMessage('Az üzenet kötelező')
    .isLength({ max: 5000 }).withMessage('Az üzenet maximum 5000 karakter lehet')
];

const validateCustomNotification = [
  body('cimzett_id')
    .isInt({ min: 1 }).withMessage('A címzett_id pozitív egész számnak kell legyen'),
  body('cimzett_tipus')
    .isIn(['diak', 'szulo', 'admin'])
    .withMessage('A címzett típus csak diak, szulo vagy admin lehet'),
  body('cim')
    .notEmpty().withMessage('A cím kötelező')
    .isLength({ max: 200 }).withMessage('A cím maximum 200 karakter lehet'),
  body('uzenet')
    .notEmpty().withMessage('Az üzenet kötelező')
    .isLength({ max: 5000 }).withMessage('Az üzenet maximum 5000 karakter lehet')
];

const validateQueryParams = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('A limit 1-100 közötti számnak kell legyen'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Az offset nemnegatív számnak kell legyen'),
  query('tipus').optional().isIn(['szobavaltas', 'hatarido', 'rendszer', 'egyeb']).withMessage('Érvénytelen típus'),
  query('olvasva').optional().isBoolean().withMessage('Az olvasva paraméter boolean típusú kell legyen')
];

// Initialize controller with database
let ertesitesController = null;

const initializeController = (db) => {
  if (!ertesitesController) {
    ertesitesController = new ErtesitesController(db);
  }
  return ertesitesController;
};

// ==========================================
// ROUTE DEFINITIONS
// ==========================================

/**
 * GET /api/ertesitesek/unread-count
 * Olvasatlan értesítések számának lekérése
 * Minden bejelentkezett felhasználó
 */
router.get('/unread-count', authenticate, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getUnreadCount(req, res);
});

/**
 * GET /api/ertesitesek
 * Felhasználó értesítéseinek lekérése
 * Minden bejelentkezett felhasználó
 */
router.get('/', authenticate, validateQueryParams, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getNotifications(req, res);
});

/**
 * PUT /api/ertesitesek/:id/read
 * Értesítés olvasottnak jelölése
 * Minden bejelentkezett felhasználó (saját értesítés)
 */
router.put('/:id/read', authenticate, validateNotificationId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.markAsRead(req, res);
});

/**
 * PUT /api/ertesitesek/read-all
 * Összes értesítés olvasottnak jelölése
 * Minden bejelentkezett felhasználó
 */
router.put('/read-all', authenticate, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.markAllAsRead(req, res);
});

/**
 * DELETE /api/ertesitesek/:id
 * Értesítés törlése
 * Minden bejelentkezett felhasználó (saját értesítés)
 */
router.delete('/:id', authenticate, validateNotificationId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteNotification(req, res);
});

/**
 * POST /api/ertesitesek
 * Új értesítés/állomány közzététele (broadcast)
 * Csak admin
 */
router.post('/', authenticate, isAdmin, validateCreateAnnouncement, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createAnnouncement(req, res);
});

/**
 * POST /api/ertesitesek/custom
 * Egyéni értesítés küldése konkrét címzettnek
 * Csak admin
 */
router.post('/custom', authenticate, isAdmin, validateCustomNotification, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.sendCustomNotification(req, res);
});

module.exports = router;