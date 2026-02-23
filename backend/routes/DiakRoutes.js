const express = require('express');
const { body, param, query } = require('express-validator');
const DiakController = require('../controllers/DiakController');
const { authenticate, isAdmin, canModify } = require('../middleware/authMiddleware');
const { createDiakValidator, updateDiakValidator, getDiakValidator } = require('../validators/diakValidators');
const validationHandler = require('../middleware/validationHandler');
const { requireRole, requireSelfOrRole } = require('../middleware/requireRole');

const router = express.Router();

// Simple validation for ID parameter
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Az ID pozitív egész számnak kell legyen')
];

// Validation for transfer student
const validateTransferStudent = [
  body('uj_szoba_id').isInt({ min: 1 }).withMessage('Az új szoba ID pozitív egész számnak kell legyen'),
  body('atcsatolas_datum').optional().isISO8601().withMessage('Érvényes dátum formátum')
];

// Validation for move out
const validateMoveOut = [
  body('kikoltozes_datum').optional().isISO8601().withMessage('Érvényes dátum formátum')
];

// Validation for search
const validateSearch = [
  query('nev').optional().isString().withMessage('A név szöveg formátumban kell legyen'),
  query('email').optional().isEmail().withMessage('Érvényes email címet adjon meg'),
  query('kapcsolat_tipusa').optional().isIn(['anya', 'apa', 'gondviselo']).withMessage('A kapcsolat típusa csak anya, apa vagy gondviselo lehet'),
  query('aktiv').optional().isBoolean().withMessage('Az aktiv paraméter boolean típusú kell legyen')
];

// Validation for enrollment
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

// Route definitions

// Listázások - minden bejelentkezett felhasználó
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

// Student dashboard endpoints - ezeknek a /:id ELŐTT kell lenniük
router.get('/students/room', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

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

router.get('/students/room-history', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

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

router.post('/students/room-change', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

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

router.get('/students/notifications', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

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

router.put('/students/notifications/:notificationId/read', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

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

router.put('/students/notifications/read-all', authenticate, async (req, res) => {
  try {
    const controller = initializeController(req.app.locals.db);
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Nem sikerült azonosítani a felhasználót'
      });
    }

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

// Részletes nézet - requireSelfOrRole: csak saját maga vagy titkár láthatja
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

// Teljes beiratkozás - főtitkár és titkár is
router.post('/enroll', authenticate, canModify, validateEnroll, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.enrollStudent(req, res);
});

// Tömeges beiratkozás - csak főtitkár
router.post('/bulk-enroll', authenticate, isAdmin, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.bulkEnrollStudents(req, res);
});

// Létrehozás - titkár és főtitkár
router.post('/', authenticate, requireRole('titkár'), createDiakValidator, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createDiak(req, res);
});

// Módosítás - titkár és főtitkár
router.put('/:id', authenticate, canModify, validateId, updateDiakValidator, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateDiak(req, res);
});

// Törlés - csak főtitkár
router.delete('/:id', authenticate, isAdmin, validateId, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteDiak(req, res);
});

// Költöztetési műveletek - minden bejelentkezett felhasználó
router.post('/:id/transfer', authenticate, validateId, validateTransferStudent, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.transferStudent(req, res);
});

router.post('/:id/move-out', authenticate, validateId, validateMoveOut, validationHandler, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.moveOutStudent(req, res);
});

module.exports = router;