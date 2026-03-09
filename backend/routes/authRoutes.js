const express = require('express');
const { body, validationResult } = require('express-validator');
const FelhasznaloService = require('../services/FelhasznaloService');
const FelhasznaloRepository = require('../repositories/FelhasznaloRepository');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Szerviz inicializálása adatbázissal
let felhasznaloService = null;

const initializeService = (db) => {
  if (!felhasznaloService) {
    const felhasznaloRepository = new FelhasznaloRepository(db);
    felhasznaloService = new FelhasznaloService(db, { repository: felhasznaloRepository });
  }
  return felhasznaloService;
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
 * Felhasználó kijelentkezése (token érvénytelenítése)
 */
router.post(
  '/logout',
  authenticate,
  (req, res) => {
    // Valós alkalmazásban a token-t hozzá kellene adni egy feketelistához
    // JWT esetén a kijelentkezés általában kliens oldalon történik a token eltávolításával
    res.json({
      success: true,
      message: 'Sikeres kijelentkezés'
    });
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

module.exports = router;
