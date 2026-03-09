/**
 * Express Validator tömbök hitelesítési végpontokhoz
 * Validációs szabályokat biztosít magyar hibaüzenetekkel
 */

const { body } = require('express-validator');
const { VALID_ROLES } = require('../config/roles');

/**
 * Jelszó komplexitás regex minta
 * Követelmények: legalább egy kisbetű, egy nagybetű, egy szám és egy speciális karakter
 */
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;

/**
 * Validátor tömb bejelentkezéshez
 * POST /api/auth/login
 */
const loginValidator = [
  // email - kötelező, érvényes email formátum
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email cím megadása kötelező')
    .isEmail()
    .withMessage('Érvénytelen email cím'),

  // jelszo - kötelező
  body('jelszo')
    .notEmpty()
    .withMessage('Jelszó megadása kötelező')
];

/**
 * Validátor tömb regisztrációhoz
 * POST /api/auth/register
 */
const registerValidator = [
  // nev - kötelező, min 2 karakter
  body('nev')
    .trim()
    .notEmpty()
    .withMessage('Név megadása kötelező')
    .isLength({ min: 2 })
    .withMessage('A név legalább 2 karakter hosszú legyen'),

  // email - kötelező, érvényes email formátum
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email cím megadása kötelező')
    .isEmail()
    .withMessage('Érvénytelen email cím'),

  // jelszo - kötelező, min 8 karakter, tartalmazzon kisbetűt, nagybetűt, számot és speciális karaktert
  body('jelszo')
    .notEmpty()
    .withMessage('Jelszó megadása kötelező')
    .isLength({ min: 8 })
    .withMessage('A jelszó legalább 8 karakter hosszú legyen')
    .matches(PASSWORD_COMPLEXITY_REGEX)
    .withMessage('A jelszónak tartalmaznia kell kis- és nagybetűt, számot és speciális karaktert'),

  // szerepkor - opcionális, az engedélyezett értékek egyike kell legyen
  body('szerepkor')
    .optional()
    .isIn(VALID_ROLES)
    .withMessage(`Érvénytelen szerepkör (megengedett: ${VALID_ROLES.join(', ')})`)
];

module.exports = {
  loginValidator,
  registerValidator
};
