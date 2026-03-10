const express = require('express');
const { body, param, query } = require('express-validator');
const SzuloController = require('../controllers/SzuloController');
const { authenticate, isAdmin, canModify } = require('../middleware/authMiddleware');
const { attachDiakId, requireSzuloOwnership } = require('../middleware/ownershipMiddleware');

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
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('A limit 1-100 közötti számnak kell lennie'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Az offset nemnegatív számnak kell legyen'),
  query('sort').optional().isString().withMessage('A sort paraméter szöveg formátumban kell lennie'),
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

// Listázások - minden bejelentkezett felhasználó (csak titkár/főtitkár)
router.get('/', authenticate, canModify, validatePagination, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getAllSzulos(req, res);
});

// Részletes nézet - students can only view their own parent's data, admins can view any
router.get('/:id', authenticate, attachDiakId, requireSzuloOwnership('id'), validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getSzuloById(req, res);
});

// Létrehozás, módosítás, törlés - csak főtitkár
router.post('/', authenticate, canModify, validateCreateSzulo, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createSzulo(req, res);
});

router.put('/:id', authenticate, canModify, validateId, validateUpdateSzulo, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateSzulo(req, res);
});

router.delete('/:id', authenticate, isAdmin, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteSzulo(req, res);
});

module.exports = router;
