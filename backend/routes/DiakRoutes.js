const express = require('express');
const { body, param, query } = require('express-validator');
const DiakController = require('../controllers/DiakController');
const { createDiakValidator, updateDiakValidator, getDiakValidator } = require('../validators/diakValidators');
const validationHandler = require('../middleware/validationHandler');
const { requireRole, requireSelfOrRole } = require('../middleware/requireRole');

const router = express.Router();

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
router.get('/', authenticate, getDiakValidator, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getAllDiaks(req, res);
});

router.get('/active', authenticate, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getActiveStudents(req, res);
});

router.get('/search', authenticate, validateSearch, validationHandler, (req, res) => {
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
router.get('/:id', authenticate, requireSelfOrRole('id', 'titkár'), validateId, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getDiakById(req, res);
});

router.get('/:id/report', authenticate, isAdmin, validateId, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.generateStudentReport(req, res);
});

router.get('/:id/room', authenticate, validateId, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getStudentRoom(req, res);
});

// Teljes beiratkozás (diák + szülő + lakcím + szoba) - főtitkár és titkár is
router.post('/enroll', authenticate, canModify, validateEnroll, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.enrollStudent(req, res);
});

// Tömeges beiratkozás - csak főtitkár
router.post('/bulk-enroll', authenticate, isAdmin, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.bulkEnrollStudents(req, res);
});

// Létrehozás, módosítás, törlés - csak főtitkár
router.post('/', authenticate, requireRole('titkár'), createDiakValidator, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createDiak(req, res);
});

router.put('/:id', authenticate, canModify, updateDiakValidator, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateDiak(req, res);
});

router.delete('/:id', authenticate, isAdmin, validateId, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteDiak(req, res);
});

// Költöztetési műveletek - minden bejelentkezett felhasználó (főtitkár és titkár is)
router.post('/:id/transfer', authenticate, validateId, validateTransferStudent, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.transferStudent(req, res);
});

router.post('/:id/move-out', authenticate, validateId, validateMoveOut, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.moveOutStudent(req, res);
});

module.exports = router;