const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { authenticate, isAdmin, canModify } = require('../middleware/authMiddleware');

// Szoba controller inicializálása
let SzobaController;
function initController(db) {
  SzobaController = new (require('../controllers/SzobaController'))(db);
  return router;
}

// Validációk
const validateCreateSzoba = [
  body('szoba_szama')
    .notEmpty().withMessage('A szoba száma kötelező')
    .isString().withMessage('A szoba száma szövegnek kell lennie')
    .isLength({ max: 10 }).withMessage('A szoba száma maximum 10 karakter lehet'),

  body('osszes_hely')
    .notEmpty().withMessage('A férőhely szám kötelező')
    .isInt({ min: 1 }).withMessage('A férőhely szám egész számnak kell lennie és legalább 1-nek kell lennie')
];

const validateUpdateSzoba = [
  param('id')
    .isInt({ min: 1 }).withMessage('A szoba ID pozitív egész számnak kell lennie'),

  body('szoba_szama')
    .optional()
    .isString().withMessage('A szoba száma szövegnek kell lennie')
    .isLength({ max: 10 }).withMessage('A szoba száma maximum 10 karakter lehet'),

  body('osszes_hely')
    .optional()
    .isInt({ min: 1 }).withMessage('A férőhely szám egész számnak kell lennie és legalább 1-nek kell lennie')
];

const validateIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('A szoba ID pozitív egész számnak kell lennie')
];

const validateQueryParams = [
  query('limit')
    .optional()
    .isInt({ min: 1 }).withMessage('A limit pozitív egész számnak kell lennie'),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Az offset nem negatív egész számnak kell lennie'),

  query('sort')
    .optional()
    .isString().withMessage('A rendezési mező szövegnek kell lennie'),

  query('order')
    .optional()
    .isIn(['ASC', 'DESC']).withMessage('A rendezési irány ASC vagy DESC lehet'),

  query('prefix')
    .optional()
    .isString().withMessage('A prefix szövegnek kell lennie')
];

// Validáció beköltözés létrehozásához
const validateCreateBekoltozes = [
  body('diak_id')
    .notEmpty().withMessage('A diák ID kötelező')
    .isInt({ min: 1 }).withMessage('A diák ID pozitív egész számnak kell lennie'),

  body('szoba_id')
    .notEmpty().withMessage('A szoba ID kötelező')
    .isInt({ min: 1 }).withMessage('A szoba ID pozitív egész számnak kell lennie'),

  body('bekoltozes_datum')
    .notEmpty().withMessage('A beköltözés dátuma kötelező')
    .isISO8601().withMessage('Érvényes dátumot adjon meg (YYYY-MM-DD formátum)')
];

// Validáció tömeges beköltözés létrehozásához
const validateCreateBulkBekoltozes = [
  body('szoba_id')
    .notEmpty().withMessage('A szoba ID kötelező')
    .isInt({ min: 1 }).withMessage('A szoba ID pozitív egész számnak kell lennie'),

  body('bekoltozes_datum')
    .notEmpty().withMessage('A beköltözés dátuma kötelező')
    .isISO8601().withMessage('Érvényes dátumot adjon meg (YYYY-MM-DD formátum)'),

  body('diak_ids')
    .notEmpty().withMessage('A diák ID-k listája kötelező')
    .isArray({ min: 1 }).withMessage('Legalább egy diák ID-t meg kell adni')
    .custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('A diák ID-k listájának tömbnek kell lennie');
      }
      for (let i = 0; i < value.length; i++) {
        if (!Number.isInteger(value[i]) || value[i] < 1) {
          throw new Error(`A(z) ${i + 1}. diák ID-nek pozitív egész számnak kell lennie`);
        }
      }
      return true;
    })
];

// Útvonalak

// Listázások - minden bejelentkezett felhasználó
router.get(
  '/',
  authenticate,
  validateQueryParams,
  async (req, res) => SzobaController.getAllSzobas(req, res)
);

// Elérhető szobák végpont - minden bejelentkezett felhasználó
router.get(
  '/available',
  authenticate,
  validateQueryParams,
  async (req, res) => SzobaController.getAvailableRooms(req, res)
);

// Statisztika végpont - csak főtitkár
router.get(
  '/statistics',
  authenticate,
  isAdmin,
  async (req, res) => SzobaController.getRoomStatistics(req, res)
);

// Beköltözések lekérdezése szűréssel - csak főtitkár
router.get(
  '/bekoltozesek',
  authenticate,
  isAdmin,
  async (req, res) => SzobaController.getBekoltozesekWithFilters(req, res)
);

// Részletes nézet és szobában lakók - minden bejelentkezett felhasználó
router.get(
  '/:id',
  authenticate,
  validateIdParam,
  async (req, res) => SzobaController.getSzobaById(req, res)
);

router.get(
  '/:id/occupants',
  authenticate,
  validateIdParam,
  async (req, res) => SzobaController.getStudentsInRoom(req, res)
);

// Szoba kihasználtság - minden bejelentkezett felhasználó
router.get(
  '/:id/occupancy',
  authenticate,
  validateIdParam,
  async (req, res) => SzobaController.getRoomOccupancy(req, res)
);

// Szoba létrehozás, módosítás, törlés - csak főtitkár
router.post(
  '/',
  authenticate,
  canModify,
  validateCreateSzoba,
  async (req, res) => SzobaController.createSzoba(req, res)
);

router.put(
  '/:id',
  authenticate,
  canModify,
  validateUpdateSzoba,
  async (req, res) => SzobaController.updateSzoba(req, res)
);

router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validateIdParam,
  async (req, res) => SzobaController.deleteSzoba(req, res)
);

// Beköltözési műveletek - minden bejelentkezett felhasználó (főtitkár és titkár is)
router.post(
  '/bekoltozes',
  authenticate,
  validateCreateBekoltozes,
  async (req, res) => SzobaController.createBekoltozes(req, res)
);

router.post(
  '/bulk-bekoltozes',
  authenticate,
  validateCreateBulkBekoltozes,
  async (req, res) => SzobaController.createBulkBekoltozes(req, res)
);

module.exports = initController;
