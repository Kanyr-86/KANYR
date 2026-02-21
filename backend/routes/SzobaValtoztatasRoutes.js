const express = require('express');
const { body, param, query } = require('express-validator');
const SzobaValtoztatasController = require('../controllers/SzobaValtoztatasController');

const router = express.Router();

// Validation middleware
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Az ID pozitív egész számnak kell legyen')
];

const validateRoomChangeRequest = [
  body('kivant_szoba_id').isInt({ min: 1 }).withMessage('A kívánt szoba ID pozitív egész számnak kell legyen'),
  body('indok').optional().isString().withMessage('Az indok szöveg formátumban kell legyen')
];

const validateRejectRequest = [
  body('indok').optional().isString().withMessage('Az elutasítás indoka szöveg formátumban kell legyen')
];

const validateStatusQuery = [
  query('status').optional().isIn(['pending', 'approved', 'denied']).withMessage('A státusz csak pending, approved vagy denied lehet')
];

// Initialize controller with database
let szobaValtoztatasController = null;

const initializeController = (db) => {
  if (!szobaValtoztatasController) {
    szobaValtoztatasController = new SzobaValtoztatasController(db);
  }
  return szobaValtoztatasController;
};

// Import authentication middleware
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// ==================== ÚJ VÉGPONTOK ====================

/**
 * Szobaváltási kérelem jóváhagyása (admin)
 * PUT /api/szobavaltoztatas/:id/approve
 */
router.put('/:id/approve', authenticate, isAdmin, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.approveRoomChangeRequest(req, res);
});

/**
 * Szobaváltási kérelem elutasítása (admin)
 * PUT /api/szobavaltoztatas/:id/reject
 */
router.put('/:id/reject', authenticate, isAdmin, validateId, validateRejectRequest, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.rejectRoomChangeRequest(req, res);
});

// ==================== DIÁK VÉGPONTOK ====================

/**
 * Diák szobájának és szobatársainak lekérése
 * GET /api/szobavaltoztatas/students/room
 */
router.get('/students/room', authenticate, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getCurrentRoom(req, res);
});

/**
 * Szobaváltási kérelem benyújtása (diák)
 * POST /api/szobavaltoztatas/students/room-change
 */
router.post('/students/room-change', authenticate, validateRoomChangeRequest, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.requestRoomChange(req, res);
});

/**
 * Diák szobaváltási történetének lekérése
 * GET /api/szobavaltoztatas/students/room-history
 */
router.get('/students/room-history', authenticate, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getRoomChangeHistory(req, res);
});

/**
 * Diák értesítéseinek lekérése
 * GET /api/szobavaltoztatas/students/notifications
 */
router.get('/students/notifications', authenticate, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getNotifications(req, res);
});

/**
 * Diák értesítésének megjelölése olvasottnak
 * PUT /api/szobavaltoztatas/students/notifications/:id/read
 */
router.put('/students/notifications/:id/read', authenticate, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.markNotificationAsRead(req, res);
});

// ==================== ADMIN VÉGPONTOK ====================

/**
 * Szobaváltási kérelmek listázása (admin)
 * GET /api/szobavaltoztatas/students/room-change-requests
 */
router.get('/students/room-change-requests', authenticate, isAdmin, validateStatusQuery, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getRoomChangeRequests(req, res);
});

/**
 * Szobaváltási kérelem jóváhagyása vagy elutasítása (régi végpont - kompatibilitásért)
 * PUT /api/szobavaltoztatas/students/room-change-requests/:id
 */
router.put('/students/room-change-requests/:id', authenticate, isAdmin, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateRoomChangeRequest(req, res);
});

/**
 * Admin értesítéseinek lekérése
 * GET /api/szobavaltoztatas/admin/notifications
 */
router.get('/admin/notifications', authenticate, isAdmin, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getAdminNotifications(req, res);
});

/**
 * Admin értesítésének megjelölése olvasottnak
 * PUT /api/szobavaltoztatas/admin/notifications/:id/read
 */
router.put('/admin/notifications/:id/read', authenticate, isAdmin, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.markNotificationAsReadByAdmin(req, res);
});

module.exports = router;