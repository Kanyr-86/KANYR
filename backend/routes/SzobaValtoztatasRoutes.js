const express = require('express');
const { body, param, query } = require('express-validator');
const SzobaValtoztatasController = require('../controllers/SzobaValtoztatasController');
const { attachDiakId, requireNotificationOwnership } = require('../middleware/ownershipMiddleware');

const router = express.Router();

// Validation middleware
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Az ID pozitív egész számnak kell legyen')
];

const validateRoomChangeRequest = [
  body('kivant_szoba_id').isInt({ min: 1 }).withMessage('A kívánt szoba ID pozitív egész számnak kell legyen'),
  body('indok').optional().isString().withMessage('Az indok szöveg formátumban kell legyen')
];

const validateUpdateRequest = [
  body('statusz').isIn(['approved', 'denied']).withMessage('A státusz csak approved vagy denied lehet')
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

// Route definitions

// Diák szobájának és szobatársainak lekérése - minden bejelentkezett felhasználó (diák)
router.get('/students/room', authenticate, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getCurrentRoom(req, res);
});

// Szobaváltási kérelem benyújtása - minden bejelentkezett felhasználó (diák)
router.post('/students/room-change', authenticate, validateRoomChangeRequest, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.requestRoomChange(req, res);
});

// Szobaváltási kérelmek listázása - csak titkár
router.get('/students/room-change-requests', authenticate, isAdmin, validateStatusQuery, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getRoomChangeRequests(req, res);
});

// Szobaváltási kérelem jóváhagyása vagy elutasítása - csak titkár
router.put('/students/room-change-requests/:id', authenticate, isAdmin, validateId, validateUpdateRequest, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.updateRoomChangeRequest(req, res);
});

// Diák szobaváltási történetének lekérése - minden bejelentkezett felhasználó (diák)
router.get('/students/room-history', authenticate, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getRoomChangeHistory(req, res);
});

// Diák értesítéseinek lekérése - minden bejelentkezett felhasználó (diák)
router.get('/students/notifications', authenticate, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getNotifications(req, res);
});

// Diák értesítésének megjelölése olvasottnak - students can only mark their own notifications as read
router.put('/students/notifications/:id/read', authenticate, attachDiakId, requireNotificationOwnership('id'), validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.markNotificationAsRead(req, res);
});

// Admin értesítéseinek lekérése - csak admin
router.get('/admin/notifications', authenticate, isAdmin, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getAdminNotifications(req, res);
});

// Admin értesítésének megjelölése olvasottnak - csak admin
router.put('/admin/notifications/:id/read', authenticate, isAdmin, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.markNotificationAsReadByAdmin(req, res);
});

module.exports = router;
