const express = require('express');
const { body, param, query } = require('express-validator');
const DiakController = require('../controllers/DiakController');

const router = express.Router();

// Validation middleware
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Az ID pozitív egész számnak kell legyen')
];

const validateCreateDiak = [
  body('nev').notEmpty().withMessage('A név kötelező').isLength({ min: 2, max: 100 }).withMessage('A névnek 2-100 karakter között kell lennie'),
  body('email').isEmail().withMessage('Érvényes email címet adjon meg'),
  body('telefonszam').notEmpty().withMessage('A telefonszám kötelező'),
  body('szuletesi_datum').isISO8601().withMessage('Érvényes dátum formátum (YYYY-MM-DD)'),
  body('szemelyi_igazolvany_szam').notEmpty().withMessage('A személyi igazolvány szám kötelező'),
  body('taj_szam').notEmpty().withMessage('A TAJ szám kötelező'),
  body('diakigazolvany_szam').notEmpty().withMessage('A diákigazolvány szám kötelező'),
  body('szulo_id').isInt({ min: 1 }).withMessage('A szülő ID pozitív egész számnak kell legyen'),
  body('kapcsolat_tipusa').isIn(['anya', 'apa', 'gondviselo']).withMessage('A kapcsolat típusa csak anya, apa vagy gondviselo lehet'),
  body('cim_id').isInt({ min: 1 }).withMessage('A cím ID pozitív egész számnak kell legyen')
];

const validateUpdateDiak = [
  body('nev').optional().isLength({ min: 2, max: 100 }).withMessage('A névnek 2-100 karakter között kell lennie'),
  body('email').optional().isEmail().withMessage('Érvényes email címet adjon meg'),
  body('telefonszam').optional().notEmpty().withMessage('A telefonszám nem lehet üres'),
  body('szuletesi_datum').optional().isISO8601().withMessage('Érvényes dátum formátum (YYYY-MM-DD)'),
  body('szemelyi_igazolvany_szam').optional().notEmpty().withMessage('A személyi igazolvány szám nem lehet üres'),
  body('taj_szam').optional().notEmpty().withMessage('A TAJ szám nem lehet üres'),
  body('diakigazolvany_szam').optional().notEmpty().withMessage('A diákigazolvány szám nem lehet üres'),
  body('szulo_id').optional().isInt({ min: 1 }).withMessage('A szülő ID pozitív egész számnak kell legyen'),
  body('kapcsolat_tipusa').optional().isIn(['anya', 'apa', 'gondviselo']).withMessage('A kapcsolat típusa csak anya, apa vagy gondviselo lehet'),
  body('cim_id').optional().isInt({ min: 1 }).withMessage('A cím ID pozitív egész számnak kell legyen')
];

const validateEnrollStudent = [
  body('diakData').isObject().withMessage('A diák adatok objektum formátumban kell lennie'),
  body('diakData.nev').notEmpty().withMessage('A diák neve kötelező'),
  body('diakData.email').isEmail().withMessage('Érvényes email címet adjon meg'),
  body('diakData.telefonszam').notEmpty().withMessage('A diák telefonszáma kötelező'),
  body('diakData.szuletesi_datum').isISO8601().withMessage('Érvényes dátum formátum'),
  body('diakData.szemelyi_igazolvany_szam').notEmpty().withMessage('A személyi igazolvány szám kötelező'),
  body('diakData.taj_szam').notEmpty().withMessage('A TAJ szám kötelező'),
  body('diakData.diakigazolvany_szam').notEmpty().withMessage('A diákigazolvány szám kötelező'),
  body('diakData.kapcsolat_tipusa').isIn(['anya', 'apa', 'gondviselo']).withMessage('A kapcsolat típusa csak anya, apa vagy gondviselo lehet'),
  
  body('szuloData').isObject().withMessage('A szülő adatok objektum formátumban kell lennie'),
  body('szuloData.nev').notEmpty().withMessage('A szülő neve kötelező'),
  body('szuloData.email').isEmail().withMessage('Érvényes email címet adjon meg'),
  body('szuloData.telefonszam').notEmpty().withMessage('A szülő telefonszáma kötelező'),
  body('szuloData.szemelyi_igazolvany_szam').notEmpty().withMessage('A szülő személyi igazolvány szám kötelező'),
  
  body('lakcimData').isObject().withMessage('A lakcím adatok objektum formátumban kell lennie'),
  body('lakcimData.orszag').notEmpty().withMessage('Az ország kötelező'),
  body('lakcimData.iranyitoszam').notEmpty().withMessage('Az irányítószám kötelező'),
  body('lakcimData.varos').notEmpty().withMessage('A város kötelező'),
  body('lakcimData.utca_hazszam').notEmpty().withMessage('Az utca és házszám kötelező'),
  
  body('szoba_id').isInt({ min: 1 }).withMessage('A szoba ID pozitív egész számnak kell legyen'),
  body('bekoltozes_datum').optional().isISO8601().withMessage('Érvényes dátum formátum')
];

const validateTransferStudent = [
  body('uj_szoba_id').isInt({ min: 1 }).withMessage('Az új szoba ID pozitív egész számnak kell legyen'),
  body('atcsatolas_datum').optional().isISO8601().withMessage('Érvényes dátum formátum')
];

const validateMoveOut = [
  body('kikoltozes_datum').optional().isISO8601().withMessage('Érvényes dátum formátum')
];

const validateBulkEnroll = [
  body('studentsData').isArray().withMessage('A studentsData paraméternek tömbnek kell lennie'),
  body('studentsData.*.diakData').isObject().withMessage('Minden diák objektumban diakData kötelező'),
  body('studentsData.*.szuloData').isObject().withMessage('Minden diák objektumban szuloData kötelező'),
  body('studentsData.*.lakcimData').isObject().withMessage('Minden diák objektumban lakcimData kötelező'),
  body('studentsData.*.szoba_id').isInt({ min: 1 }).withMessage('Minden diák objektumban szoba_id pozitív egész számnak kell legyen')
];

const validateSearch = [
  query('nev').optional().isString().withMessage('A név szöveg formátumban kell legyen'),
  query('email').optional().isEmail().withMessage('Érvényes email címet adjon meg'),
  query('kapcsolat_tipusa').optional().isIn(['anya', 'apa', 'gondviselo']).withMessage('A kapcsolat típusa csak anya, apa vagy gondviselo lehet'),
  query('aktiv').optional().isBoolean().withMessage('Az aktiv paraméter boolean típusú kell legyen')
];

const validatePagination = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('A limit 1-100 közötti számnak kell legyen'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Az offset nemnegatív számnak kell legyen'),
  query('sort').optional().isString().withMessage('A sort paraméter szöveg formátumban kell legyen'),
  query('order').optional().isIn(['ASC', 'DESC']).withMessage('A rendelés csak ASC vagy DESC lehet'),
  query('includeRelations').optional().isBoolean().withMessage('A includeRelations paraméter boolean típusú kell legyen')
];

// Initialize controller with database
let diakController = null;

const initializeController = (db) => {
  if (!diakController) {
    diakController = new DiakController(db);
  }
  return diakController;
};

// Route definitions
router.get('/', validatePagination, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getAllDiaks(req, res);
});

router.get('/active', (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getActiveStudents(req, res);
});

router.get('/search', validateSearch, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.searchStudents(req, res);
});

router.get('/statistics', (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getStatistics(req, res);
});

router.get('/:id', validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getDiakById(req, res);
});

router.get('/:id/report', validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.generateStudentReport(req, res);
});

router.get('/:id/room', validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getStudentRoom(req, res);
});

router.post('/', validateCreateDiak, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createDiak(req, res);
});

router.post('/enroll', validateEnrollStudent, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.enrollStudent(req, res);
});

router.post('/bulk-enroll', validateBulkEnroll, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.bulkEnrollStudents(req, res);
});

router.put('/:id', validateId, validateUpdateDiak, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateDiak(req, res);
});

router.delete('/:id', validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteDiak(req, res);
});

router.post('/:id/transfer', validateId, validateTransferStudent, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.transferStudent(req, res);
});

router.post('/:id/move-out', validateId, validateMoveOut, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.moveOutStudent(req, res);
});

module.exports = router;
