const express = require('express');
const { body, param, query } = require('express-validator');
const LakcimController = require('../controllers/LakcimController');
const { authenticate, isAdmin, canModify } = require('../middleware/authMiddleware');
const { attachDiakId, requireLakcimOwnership } = require('../middleware/ownershipMiddleware');

const router = express.Router();

// Validation middleware
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Az ID pozitív egész számnak kell lennie')
];

const validateCreateLakcim = [
  body('orszag').notEmpty().withMessage('Az ország kötelező'),
  body('iranyitoszam').notEmpty().withMessage('Az irányítószám kötelező'),
  body('varos').notEmpty().withMessage('A város kötelező'),
  body('utca_hazszam').notEmpty().withMessage('Az utca és házszám kötelező')
];

const validateUpdateLakcim = [
  body('orszag').optional().notEmpty().withMessage('Az ország nem lehet üres'),
  body('iranyitoszam').optional().notEmpty().withMessage('Az irányítószám nem lehet üres'),
  body('varos').optional().notEmpty().withMessage('A város nem lehet üres'),
  body('utca_hazszam').optional().notEmpty().withMessage('Az utca és házszám nem lehet üres')
];

const validatePagination = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('A limit 1-100 közötti számnak kell lennie'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Az offset nemnegatív számnak kell lennie'),
  query('sort').optional().isString().withMessage('A sort paraméter szöveg formátumban kell lennie'),
  query('order').optional().isIn(['ASC', 'DESC']).withMessage('A rendelés csak ASC vagy DESC lehet'),
  query('includeRelations').optional().isBoolean().withMessage('A includeRelations paraméter boolean típusú kell legyen')
];

// Initialize controller with database
let lakcimController = null;

const initializeController = (db) => {
  if (!lakcimController) {
    lakcimController = new LakcimController(db);
  }
  return lakcimController;
};

// Route definitions

// Listázások - csak titkár/főtitkár (students shouldn't see all addresses)
router.get('/', authenticate, canModify, validatePagination, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getAllLakcims(req, res);
});

// Részletes nézet - students can only view their own address data, admins can view any
router.get('/:id', authenticate, attachDiakId, requireLakcimOwnership('id'), validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getLakcimById(req, res);
});

// Város szerinti keresés - csak titkár/főtitkár
router.get('/city/:varos', authenticate, canModify, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getLakcimsByCity(req, res);
});

// Létrehozás, módosítás, törlés - csak főtitkár
router.post('/', authenticate, canModify, validateCreateLakcim, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createLakcim(req, res);
});

router.put('/:id', authenticate, canModify, validateId, validateUpdateLakcim, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateLakcim(req, res);
});

router.delete('/:id', authenticate, isAdmin, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteLakcim(req, res);
});

module.exports = router;
