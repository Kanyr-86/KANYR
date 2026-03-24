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
router.post('/students/room-change', authenticate, (req, res, next) => {
  // Apply write limiter to room change requests
  const writeLimiter = req.app.locals.limiters?.write;
  if (writeLimiter) {
    return writeLimiter(req, res, next);
  }
  next();
}, validateRoomChangeRequest, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.requestRoomChange(req, res);
});

// Szobaváltási kérelmek listázása - csak titkár
router.get('/students/room-change-requests', authenticate, isAdmin, validateStatusQuery, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getRoomChangeRequests(req, res);
});

// Szobaváltási kérelem jóváhagyása vagy elutasítása - csak titkár
router.put('/students/room-change-requests/:id', authenticate, isAdmin, (req, res, next) => {
  // Apply write limiter to room change approval operations
  const writeLimiter = req.app.locals.limiters?.write;
  if (writeLimiter) {
    return writeLimiter(req, res, next);
  }
  next();
}, validateId, validateUpdateRequest, (req, res) => {
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

// Admin összes értesítésének megjelölése olvasottnak - csak admin
router.put('/admin/notifications/read-all', authenticate, isAdmin, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.markAllNotificationsAsRead(req, res);
});

// Admin értesítés törlése - csak admin
router.delete('/admin/notifications/:id', authenticate, isAdmin, validateId, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.deleteNotification(req, res);
});

// Admin értesítési statisztikák - csak admin
router.get('/admin/notifications/statistics', authenticate, isAdmin, (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.getNotificationStatistics(req, res);
});

// Új értesítés létrehozása - csak admin
router.post('/admin/notifications', authenticate, isAdmin, [
  body('tipus').isIn(['room_change_approved', 'room_change_denied', 'room_change_pending', 'system_announcement', 'student_notification', 'general_alert']).withMessage('Érvénytelen értesítés típus'),
  body('uzenet').notEmpty().withMessage('Az üzenet megadása kötelező'),
  body('cimzettkor').optional().isIn(['admin', 'student', 'both']).withMessage('Érvénytelen címzettkör'),
  body('prioritas').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Érvénytelen prioritás'),
  body('diak_id').optional().isInt({ min: 1 }).withMessage('A diák ID pozitív egész számnak kell legyen')
], (req, res) => {
  const controller = initializeController(req.app.locals.db);
  return controller.createNotification(req, res);
});

module.exports = router;
