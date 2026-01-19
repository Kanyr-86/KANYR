const express = require('express');
const { body } = require('express-validator');
const FelhasznaloService = require('../services/FelhasznaloService');
const FelhasznaloRepository = require('../repositories/FelhasznaloRepository');
const { authenticate } = require('../middleware/authMiddleware');
const { generateToken } = require('../utils/authUtils');

const router = express.Router();

// Initialize service with database
let felhasznaloService = null;

const initializeService = (db) => {
  if (!felhasznaloService) {
    const felhasznaloRepository = new FelhasznaloRepository(db);
    felhasznaloService = new FelhasznaloService(db, { repository: felhasznaloRepository });
  }
  return felhasznaloService;
};

// Login validation rules
const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Az email cím nem lehet üres')
    .isEmail().withMessage('Érvénytelen email formátum'),

  body('password')
    .notEmpty().withMessage('A jelszó nem lehet üres')
    .isLength({ min: 8 }).withMessage('A jelszónak minimum 8 karakter hosszúnak kell lennie')
];

/**
 * POST /api/auth/login
 * User login
 */
router.post(
  '/login',
  loginValidationRules,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const { email, password } = req.body;
      const service = initializeService(req.app.locals.db);
      const result = await service.login(email, password);

      res.json({
        success: true,
        data: result,
        message: 'Sikeres bejelentkezés'
      });
    } catch (error) {
      if (error.message === 'Érvénytelen email vagy jelszó') {
        res.status(401).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }
);

/**
 * POST /api/auth/logout
 * User logout (token invalidation)
 */
router.post(
  '/logout',
  authenticate,
  (req, res) => {
    // In a real application, you would add the token to a blacklist
    // For JWT, logout is typically handled client-side by removing the token
    res.json({
      success: true,
      message: 'Sikeres kijelentkezés'
    });
  }
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get(
  '/me',
  authenticate,
  (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  }
);

/**
 * GET /api/auth/check-admin
 * Check if current user is admin
 */
router.get(
  '/check-admin',
  authenticate,
  (req, res) => {
    res.json({
      success: true,
      data: {
        isAdmin: req.user.admin
      }
    });
  }
);

/**
 * POST /api/auth/test-admin-token
 * Generate test admin token (1 hour expiration) - FOR TESTING ONLY
 */
router.post(
  '/test-admin-token',
  (req, res) => {
    try {
      // Generate test admin token with 1 hour expiration
      const testToken = generateToken({
        userId: 1, // Test admin user ID
        admin: true
      }, '1h'); // 1 hour expiration for testing

      res.json({
        success: true,
        data: {
          token: testToken,
          expiresIn: '1h',
          userId: 1,
          admin: true
        },
        message: 'Teszt admin token generálva (1 óra érvényes)'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Hiba a teszt token generálása közben'
      });
    }
  }
);

// Helper function for validation
function validationResult(req) {
  const { validationResult } = require('express-validator');
  return validationResult(req);
}

module.exports = router;
