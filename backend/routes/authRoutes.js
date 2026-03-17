const express = require('express');
const { body, validationResult } = require('express-validator');
const FelhasznaloService = require('../services/FelhasznaloService');
const FelhasznaloRepository = require('../repositories/FelhasznaloRepository');
const TokenBlacklistService = require('../services/TokenBlacklistService');
const { authenticate } = require('../middleware/authMiddleware');
const { getCsrfToken } = require('../middleware/csrfMiddleware');
const { ValidationError } = require('../utils/AppError');

const router = express.Router();

// Szerviz inicializálása adatbázissal
let felhasznaloService = null;
let tokenBlacklistService = null;

const initializeService = (db) => {
  if (!felhasznaloService) {
    const felhasznaloRepository = new FelhasznaloRepository(db);
    felhasznaloService = new FelhasznaloService(db, { repository: felhasznaloRepository });
  }
  return felhasznaloService;
};

const initializeTokenBlacklistService = (db) => {
  if (!tokenBlacklistService) {
    tokenBlacklistService = TokenBlacklistService.initialize(db);
  }
  return tokenBlacklistService;
};

// Bejelentkezési validációs szabályok - egyszerűsítve, csak nem üres ellenőrzés
const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Az email cím nem lehet üres')
    .isEmail().withMessage('Érvénytelen email formátum'),

  body('password')
    .notEmpty().withMessage('A jelszó nem lehet üres')
];

/**
 * POST /api/auth/login
 * Felhasználó bejelentkezése
 */
router.post(
  '/login',
  loginValidationRules,
  async (req, res, _next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new ValidationError('Validációs hiba');
        error.details = errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }));
        throw error;
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
      _next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Felhasználó kijelentkezése (token érvénytelenítése)
 */
router.post(
  '/logout',
  authenticate,
  async (req, res, _next) => {
    try {
      // Token kinyerése a header-ből
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        // Token hozzáadása a feketelistához
        const blacklistService = initializeTokenBlacklistService(req.app.locals.db);
        await blacklistService.revokeToken(token);
      }

      res.json({
        success: true,
        message: 'Sikeres kijelentkezés'
      });
    } catch (error) { // eslint-disable-line no-unused-vars
      // Még ha a token visszavonása nem sikerül is, a kijelentkezést sikeresnek tekintjük
      // mivel a kliens oldalon a token törlésre kerül
      res.json({
        success: true,
        message: 'Sikeres kijelentkezés'
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Aktuális felhasználói információk lekérdezése
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
 * Ellenőrzi, hogy az aktuális felhasználó admin-e
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
 * GET /api/auth/csrf-token
 * Új CSRF token kérése
 * Hasznos ha a token lejárt vagy újra kell generálni
 */
router.get('/csrf-token', getCsrfToken);

/**
 * POST /api/auth/refresh
 * Token frissítése új token generálásával
 * Csak érvényes token esetén működik, új token generálása történik
 */
router.post(
  '/refresh',
  authenticate,
  async (req, res) => {
    try {
      const service = initializeService(req.app.locals.db);
      
      // Token frissítése - új token generálása
      const result = await service.refreshToken(req.user.userId);

      res.json({
        success: true,
        data: result,
        message: 'Token sikeresen frissítve'
      });
    } catch (refreshError) { // eslint-disable-line no-unused-vars
      res.status(500).json({
        success: false,
        error: 'Token frissítése sikertelen'
      });
    }
  }
);

module.exports = router;
