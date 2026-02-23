/**
 * Express Validator arrays for Diak (Student) endpoints
 * Provides validation rules with Hungarian error messages
 */

const { body, param, query } = require('express-validator');

/**
 * Hungarian phone number regex pattern
 * Matches: +36 followed by 8-9 digits (mobile: 20, 30, 70; landline: 1, etc.)
 */
const HUNGARIAN_PHONE_REGEX = /^\+36[1-9][0-9]{7,8}$/;

/**
 * Validator array for creating a new Diak
 * POST /api/diak
 */
const createDiakValidator = [
  // nev - required, 2-100 characters
  body('nev')
    .trim()
    .notEmpty()
    .withMessage('A név megadása kötelező')
    .isLength({ min: 2, max: 100 })
    .withMessage('A név 2-100 karakter hosszú lehet'),

  // email - optional, must be valid email format
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Érvénytelen email cím')
    .normalizeEmail(),

  // telefonszam - optional, must match Hungarian phone format
  body('telefonszam')
    .optional({ checkFalsy: true })
    .matches(HUNGARIAN_PHONE_REGEX)
    .withMessage('Érvénytelen telefonszám formátum (pl. +36301234567)'),

  // szuletesiDatum - optional, must be ISO8601 date
  body('szuletesiDatum')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Érvénytelen dátum formátum'),

  // szulo_id - optional, nullable, must be positive integer
  body('szulo_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Érvénytelen szülő azonosító'),

  // cim_id - optional, nullable, must be positive integer
  body('cim_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Érvénytelen cím azonosító')
];

/**
 * Validator array for updating a Diak
 * PUT /api/diak/:id
 */
const updateDiakValidator = [
  // param id - must be positive integer
  param('id')
    .isInt({ min: 1 })
    .withMessage('Érvénytelen azonosító'),

  // nev - optional, 2-100 characters
  body('nev')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('A név nem lehet üres')
    .isLength({ min: 2, max: 100 })
    .withMessage('A név 2-100 karakter hosszú lehet')
];

/**
 * Validator array for getting Diak list with query parameters
 * GET /api/diak
 */
const getDiakValidator = [
  // query limit - optional, 1-100
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('A limit 1-100 között lehet'),

  // query offset - optional, min 0
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Az offset nem lehet negatív'),

  // query sort - optional, must be one of allowed fields
  query('sort')
    .optional()
    .isIn(['nev', 'id', 'createdAt'])
    .withMessage('Érvénytelen rendezési mező (megengedett: nev, id, createdAt)')
];

module.exports = {
  createDiakValidator,
  updateDiakValidator,
  getDiakValidator
};