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
  body('cim_id').isInt({ min: 1 }).withMessage('A cím ID pozitív egész számnak kell legyen'),
  body('nem').isIn(['férfi', 'nő']).withMessage('A nem csak férfi vagy nő lehet')
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
  body('cim_id').optional().isInt({ min: 1 }).withMessage('A cím ID pozitív egész számnak kell legyen'),
  body('nem').optional().isIn(['férfi', 'nő']).withMessage('A nem csak férfi vagy nő lehet')
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

// Import authentication middleware
const { authenticate, isAdmin, canModify } = require('../middleware/authMiddleware');

// Route definitions

// Listázások - minden bejelentkezett felhasználó (főtitkár és titkár is)
router.get('/', authenticate, validatePagination, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getAllDiaks(req, res);
});

router.get('/active', authenticate, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getActiveStudents(req, res);
});

router.get('/search', authenticate, validateSearch, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.searchStudents(req, res);
});

// Statisztikák és riportok - csak főtitkár
router.get('/statistics', authenticate, isAdmin, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getStatistics(req, res);
});

// Student dashboard endpoint - gets current room for authenticated student
// FONTOS: Ezeknek a /students/* route-oknak a /:id ELŐTT kell lenniük,
// különben az Express a "students" szót ID-ként értelmezi!
router.get('/students/room', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId; // Get user ID from authenticated user
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

    // Get the diak_id from the Felhasznalo table
    const Felhasznalo = controller.db.Felhasznalo;
    const user = await Felhasznalo.findByPk(userId);
    
    if (!user || !user.diak_id) {
      return res.status(400).json({
        success: false,
        error: 'A felhasználóhoz nem tartozik diák azonosító'
      });
    }

    return controller.getStudentRoom({ params: { id: user.diak_id } }, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Hiba a szoba lekérésekor'
    });
  }
});

// Student room history endpoint
router.get('/students/room-history', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId; // Get user ID from authenticated user
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

    // Get the diak_id from the Felhasznalo table
    const Felhasznalo = controller.db.Felhasznalo;
    const user = await Felhasznalo.findByPk(userId);
    
    if (!user || !user.diak_id) {
      return res.status(400).json({
        success: false,
        error: 'A felhasználóhoz nem tartozik diák azonosító'
      });
    }

    return controller.getStudentRoomHistory({ params: { id: user.diak_id } }, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Hiba a szobaváltási történet lekérésekor'
    });
  }
});

// Student room change request endpoint
router.post('/students/room-change', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId; // Get user ID from authenticated user
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

    // Get the diak_id from the Felhasznalo table
    const Felhasznalo = controller.db.Felhasznalo;
    const user = await Felhasznalo.findByPk(userId);
    
    if (!user || !user.diak_id) {
      return res.status(400).json({
        success: false,
        error: 'A felhasználóhoz nem tartozik diák azonosító'
      });
    }

    return controller.submitRoomChangeRequest({ params: { id: user.diak_id }, body: req.body }, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Hiba a szobaváltási kérelem benyújtásakor'
    });
  }
});

// Student notifications endpoint
router.get('/students/notifications', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId; // Get user ID from authenticated user
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

    // Get the diak_id from the Felhasznalo table
    const Felhasznalo = controller.db.Felhasznalo;
    const user = await Felhasznalo.findByPk(userId);
    
    if (!user || !user.diak_id) {
      return res.status(400).json({
        success: false,
        error: 'A felhasználóhoz nem tartozik diák azonosító'
      });
    }

    return controller.getStudentNotifications({ params: { id: user.diak_id } }, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Hiba az értesítések lekérésekor'
    });
  }
});

// Mark notification as read endpoint
router.put('/students/notifications/:notificationId/read', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId; // Get user ID from authenticated user
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

    // Get the diak_id from the Felhasznalo table
    const Felhasznalo = controller.db.Felhasznalo;
    const user = await Felhasznalo.findByPk(userId);
    
    if (!user || !user.diak_id) {
      return res.status(400).json({
        success: false,
        error: 'A felhasználóhoz nem tartozik diák azonosító'
      });
    }

    return controller.markNotificationAsRead({ params: { id: user.diak_id, notificationId: req.params.notificationId } }, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Hiba az értesítés olvasásakor'
    });
  }
});

// Mark all notifications as read endpoint
router.put('/students/notifications/read-all', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId; // Get user ID from authenticated user
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

    // Get the diak_id from the Felhasznalo table
    const Felhasznalo = controller.db.Felhasznalo;
    const user = await Felhasznalo.findByPk(userId);
    
    if (!user || !user.diak_id) {
      return res.status(400).json({
        success: false,
        error: 'A felhasználóhoz nem tartozik diák azonosító'
      });
    }

    return controller.markAllNotificationsAsRead({ params: { id: user.diak_id } }, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Hiba az értesítések olvasásakor'
    });
  }
});

// Részletes nézet - minden bejelentkezett felhasználó
router.get('/:id', authenticate, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getDiakById(req, res);
});

router.get('/:id/report', authenticate, isAdmin, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.generateStudentReport(req, res);
});

router.get('/:id/room', authenticate, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getStudentRoom(req, res);
});

// Teljes beiratkozás (diák + szülő + lakcím + szoba) - főtitkár és titkár is
const validateEnroll = [
  body('diakData').notEmpty().withMessage('A diák adatai kötelezők'),
  body('szuloData').notEmpty().withMessage('A szülő adatai kötelezők'),
  body('szoba_id').isInt({ min: 1 }).withMessage('A szoba ID pozitív egész számnak kell lennie')
];

router.post('/enroll', authenticate, canModify, validateEnroll, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.enrollStudent(req, res);
});

// Tömeges beiratkozás - csak főtitkár
router.post('/bulk-enroll', authenticate, isAdmin, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.bulkEnrollStudents(req, res);
});

// Létrehozás, módosítás, törlés - csak főtitkár
router.post('/', authenticate, canModify, validateCreateDiak, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createDiak(req, res);
});

router.put('/:id', authenticate, canModify, validateId, validateUpdateDiak, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateDiak(req, res);
});

router.delete('/:id', authenticate, isAdmin, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteDiak(req, res);
});

// Költöztetési műveletek - minden bejelentkezett felhasználó (főtitkár és titkár is)
router.post('/:id/transfer', authenticate, validateId, validateTransferStudent, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.transferStudent(req, res);
});

router.post('/:id/move-out', authenticate, validateId, validateMoveOut, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.moveOutStudent(req, res);
});

module.exports = router;
