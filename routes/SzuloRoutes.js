const express = require('express');
const { body, param, query } = require('express-validator');
const SzuloController = require('../controllers/SzuloController');

const router = express.Router();

// Validation middleware
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Az ID pozitív egész számnak kell legyen')
];

const validateCreateSzulo = [
  body('nev').notEmpty().withMessage('A név kötelező').isLength({ min: 2, max: 100 }).withMessage('A névnek 2-100 karakter között kell lennie'),
  body('email').isEmail().withMessage('Érvényes email címet adjon meg'),
  body('telefonszam').notEmpty().withMessage('A telefonszám kötelező'),
  body('szemelyi_igazolvany_szam').notEmpty().withMessage('A személyi igazolvány szám kötelező'),
  body('cim_id').isInt({ min: 1 }).withMessage('A cím ID pozitív egész számnak kell legyen')
];

const validateUpdateSzulo = [
  body('nev').optional().isLength({ min: 2, max: 100 }).withMessage('A névnek 2-100 karakter között kell lennie'),
  body('email').optional().isEmail().withMessage('Érvényes email címet adjon meg'),
  body('telefonszam').optional().notEmpty().withMessage('A telefonszám nem lehet üres'),
  body('szemelyi_igazolvany_szam').optional().notEmpty().withMessage('A személyi igazolvány szám nem lehet üres'),
  body('cim_id').optional().isInt({ min: 1 }).withMessage('A cím ID pozitív egész számnak kell legyen')
];

const validatePagination = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('A limit 1-100 közötti számnak kell legyen'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Az offset nemnegatív számnak kell legyen'),
  query('sort').optional().isString().withMessage('A sort paraméter szöveg formátumban kell legyen'),
  query('order').optional().isIn(['ASC', 'DESC']).withMessage('A rendelés csak ASC vagy DESC lehet'),
  query('includeRelations').optional().isBoolean().withMessage('A includeRelations paraméter boolean típusú kell legyen')
];

// Initialize controller with database
let szuloController = null;

const initializeController = (db) => {
  if (!szuloController) {
    szuloController = new SzuloController(db);
  }
  return szuloController;
};

// Route definitions
router.get('/', validatePagination, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getAllSzulos(req, res);
});

router.get('/:id', validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getSzuloById(req, res);
});

router.post('/', validateCreateSzulo, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createSzulo(req, res);
});

router.put('/:id', validateId, validateUpdateSzulo, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateSzulo(req, res);
});

router.delete('/:id', validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteSzulo(req, res);
});

module.exports = router;