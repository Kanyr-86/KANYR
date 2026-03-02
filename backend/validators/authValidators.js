/**
 * Express Validator arrays for Authentication endpoints
 * Provides validation rules with Hungarian error messages
 */

const { body } = require('express-validator');

/**
 * Password complexity regex pattern
 * Requires: at least one lowercase, one uppercase, one digit, and one special character
 */
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;

/**
 * Validator array for login
 * POST /api/auth/login
 */
const loginValidator = [
  // email - required, must be valid email
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email cím megadása kötelező')
    .isEmail()
    .withMessage('Érvénytelen email cím'),

  // jelszo - required
  body('jelszo')
    .notEmpty()
    .withMessage('Jelszó megadása kötelező')
];

/**
 * Validator array for registration
 * POST /api/auth/register
 */
const registerValidator = [
  // nev - required, min 2 characters
  body('nev')
    .trim()
    .notEmpty()
    .withMessage('Név megadása kötelező')
    .isLength({ min: 2 })
    .withMessage('A név legalább 2 karakter hosszú legyen'),

  // email - required, must be valid email
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email cím megadása kötelező')
    .isEmail()
    .withMessage('Érvénytelen email cím'),

  // jelszo - required, min 8 chars, must contain lowercase, uppercase, number, and special character
  body('jelszo')
    .notEmpty()
    .withMessage('Jelszó megadása kötelező')
    .isLength({ min: 8 })
    .withMessage('A jelszó legalább 8 karakter hosszú legyen')
    .matches(PASSWORD_COMPLEXITY_REGEX)
    .withMessage('A jelszónak tartalmaznia kell kis- és nagybetűt, számot és speciális karaktert'),

  // szerepkor - optional, must be one of allowed values
  body('szerepkor')
    .optional()
    .isIn(['titkár', 'diák'])
    .withMessage('Érvénytelen szerepkör (megengedett: titkár, diák)')
];

module.exports = {
  loginValidator,
  registerValidator
};
