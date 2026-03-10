const express = require('express');
const { body, param, query } = require('express-validator');
const FelhasznaloController = require('../controllers/FelhasznaloController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
const { requireOwnProfile } = require('../middleware/ownershipMiddleware');

const router = express.Router();

// Initialize controller with database
let felhasznaloController = null;

const initializeController = (db) => {
  if (!felhasznaloController) {
    felhasznaloController = new FelhasznaloController(db);
  }
  return felhasznaloController;
};

  // User validation rules
  const userValidationRules = [
    body('username')
      .trim()
      .notEmpty().withMessage('A felhasználónév nem lehet üres')
      .isLength({ min: 3, max: 50 }).withMessage('A felhasználónévnek 3 és 50 karakter között kell lennie')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('A felhasználónév csak betűket, számokat és aláhúzásokat tartalmazhat'),

    body('email')
      .trim()
      .notEmpty().withMessage('Az email cím nem lehet üres')
      .isEmail().withMessage('Érvénytelen email formátum'),

    body('password')
      .notEmpty().withMessage('A jelszó nem lehet üres')
      .isLength({ min: 8 }).withMessage('A jelszónak minimum 8 karakter hosszúnak kell lennie')
      .matches(/[A-Z]/).withMessage('A jelszónak tartalmaznia kell legalább egy nagybetűt')
      .matches(/[a-z]/).withMessage('A jelszónak tartalmaznia kell legalább egy kisbetűt')
      .matches(/[0-9]/).withMessage('A jelszónak tartalmaznia kell legalább egy számot')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('A jelszónak tartalmaznia kell legalább egy speciális karaktert'),

    body('admin')
      .optional()
      .isBoolean().withMessage('Az admin mező csak true vagy false értéket vehet fel')
  ];

  // Password validation rules
  const passwordValidationRules = [
    body('newPassword')
      .notEmpty().withMessage('A jelszó nem lehet üres')
      .isLength({ min: 8 }).withMessage('A jelszónak minimum 8 karakter hosszúnak kell lennie')
      .matches(/[A-Z]/).withMessage('A jelszónak tartalmaznia kell legalább egy nagybetűt')
      .matches(/[a-z]/).withMessage('A jelszónak tartalmaznia kell legalább egy kisbetűt')
      .matches(/[0-9]/).withMessage('A jelszónak tartalmaznia kell legalább egy számot')
      .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('A jelszónak tartalmaznia kell legalább egy speciális karaktert')
  ];

  // ID validation rule
  const idValidationRule = [
    param('id')
      .notEmpty().withMessage('Az ID paraméter nem lehet üres')
      .isInt().withMessage('Az ID-nek egész számnak kell lennie')
  ];

  // User creation is admin-only — self-registration is not supported
  router.post(
    '/',
    authenticate,
    isAdmin,
    userValidationRules,
    (req, res) => initializeController(req.app.locals.db).createUser(req, res)
  );

  // Protected routes - saját profil kezelése (minden bejelentkezett felhasználó)
  // Users can only update their own profile, admins can update any profile
  router.put(
    '/:id',
    authenticate,
    requireOwnProfile(),
    userValidationRules,
    (req, res) => initializeController(req.app.locals.db).updateUser(req, res)
  );

  // Users can only change their own password, admins can reset any password
  router.post(
    '/:id/password',
    authenticate,
    requireOwnProfile(),
    passwordValidationRules,
    (req, res) => initializeController(req.app.locals.db).updatePassword(req, res)
  );

  // Only admins can delete users
  router.delete(
    '/:id',
    authenticate,
    isAdmin,
    idValidationRule,
    (req, res) => initializeController(req.app.locals.db).deleteUser(req, res)
  );

  // Admin-only routes - felhasználók kezelése (csak főtitkár)
  router.get(
    '/',
    authenticate,
    isAdmin,
    [
      query('limit').optional().isInt().withMessage('A limit paraméternek egész számnak kell lennie'),
      query('offset').optional().isInt().withMessage('Az offset paraméternek egész számnak kell lennie'),
      query('sort').optional().isString().withMessage('A sort paraméternek szövegnek kell lennie'),
      query('order').optional().isIn(['ASC', 'DESC']).withMessage('Az order paraméternek ASC vagy DESC értéket kell tartalmaznia')
    ],
    (req, res) => initializeController(req.app.locals.db).getAllUsers(req, res)
  );

  router.get(
    '/:id',
    authenticate,
    isAdmin,
    idValidationRule,
    (req, res) => initializeController(req.app.locals.db).getUserById(req, res)
  );

  router.post(
    '/admin',
    authenticate,
    isAdmin,
    userValidationRules,
    (req, res) => initializeController(req.app.locals.db).createAdminUser(req, res)
  );

  router.post(
    '/:id/reset-password',
    authenticate,
    isAdmin,
    idValidationRule,
    (req, res) => initializeController(req.app.locals.db).resetPassword(req, res)
  );

  router.post(
    '/:id/make-admin',
    authenticate,
    isAdmin,
    idValidationRule,
    (req, res) => initializeController(req.app.locals.db).makeAdmin(req, res)
  );

  router.post(
    '/:id/remove-admin',
    authenticate,
    isAdmin,
    idValidationRule,
    (req, res) => initializeController(req.app.locals.db).removeAdmin(req, res)
  );

  router.post(
    '/:id/force-logout',
    authenticate,
    isAdmin,
    idValidationRule,
    (req, res) => initializeController(req.app.locals.db).forceLogout(req, res)
  );

module.exports = router;
