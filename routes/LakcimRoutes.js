const express = require('express');
const { body, param, query } = require('express-validator');
const LakcimController = require('../controllers/LakcimController');

const router = express.Router();

// Validation middleware
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Az ID pozitív egész számnak kell legyen')
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
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('A limit 1-100 közötti számnak kell legyen'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Az offset nemnegatív számnak kell legyen'),
  query('sort').optional().isString().withMessage('A sort paraméter szöveg formátumban kell legyen'),
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
router.get('/', validatePagination, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getAllLakcims(req, res);
});

router.get('/:id', validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getLakcimById(req, res);
});

router.post('/', validateCreateLakcim, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createLakcim(req, res);
});

router.put('/:id', validateId, validateUpdateLakcim, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateLakcim(req, res);
});

router.delete('/:id', validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteLakcim(req, res);
});

router.get('/city/:varos', (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getLakcimsByCity(req, res);
});

module.exports = router;