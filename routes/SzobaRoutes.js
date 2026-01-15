const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

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

// Útvonalak
router.post(
  '/',
  validateCreateSzoba,
  async (req, res) => SzobaController.createSzoba(req, res)
);

router.get(
  '/',
  validateQueryParams,
  async (req, res) => SzobaController.getAllSzobas(req, res)
);

router.get(
  '/:id',
  validateIdParam,
  async (req, res) => SzobaController.getSzobaById(req, res)
);

router.put(
  '/:id',
  validateUpdateSzoba,
  async (req, res) => SzobaController.updateSzoba(req, res)
);

router.delete(
  '/:id',
  validateIdParam,
  async (req, res) => SzobaController.deleteSzoba(req, res)
);

router.get(
  '/:id/occupants',
  validateIdParam,
  async (req, res) => SzobaController.getStudentsInRoom(req, res)
);

router.get(
  '/statistics',
  async (req, res) => SzobaController.getRoomStatistics(req, res)
);

// Új beköltözés végpont
router.post(
  '/bekoltozes',
  validateCreateBekoltozes,
  async (req, res) => SzobaController.createBekoltozes(req, res)
);

module.exports = initController;
