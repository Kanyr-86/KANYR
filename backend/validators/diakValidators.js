/**
 * Express Validator tömbök Diák (hallgató) végpontokhoz
 * Validációs szabályokat biztosít magyar hibaüzenetekkel
 */

const { body, param, query } = require('express-validator');

/**
 * Magyar telefonszám regex minta
 * Illeszkedik: +36 után 8-9 számjegy (mobil: 20, 30, 70; vezetékes: 1, stb.)
 */
const HUNGARIAN_PHONE_REGEX = /^\+36[1-9][0-9]{7,8}$/;

/**
 * Validátor tömb új diák létrehozásához
 * POST /api/diak
 */
const createDiakValidator = [
  // nev - kötelező, 2-100 karakter
  body('nev')
    .trim()
    .notEmpty()
    .withMessage('A név megadása kötelező')
    .isLength({ min: 2, max: 100 })
    .withMessage('A név 2-100 karakter hosszú lehet'),

  // email - kötelező, érvényes email formátum
  body('email')
    .notEmpty()
    .withMessage('Az email megadása kötelező')
    .isEmail()
    .withMessage('Érvénytelen email cím')
    .normalizeEmail(),

  // telefonszam - kötelező, magyar telefonszám formátum
  body('telefonszam')
    .notEmpty()
    .withMessage('A telefonszám megadása kötelező')
    .matches(HUNGARIAN_PHONE_REGEX)
    .withMessage('Érvénytelen telefonszám formátum (pl. +36301234567)'),

  // szuletesi_datum - kötelező, ISO8601 dátum formátum
  body('szuletesi_datum')
    .notEmpty()
    .withMessage('A születési dátum megadása kötelező')
    .isISO8601()
    .withMessage('Érvénytelen dátum formátum'),

  // nem - kötelező, 'férfi' vagy 'nő'
  body('nem')
    .notEmpty()
    .withMessage('A nem megadása kötelező')
    .isIn(['férfi', 'nő'])
    .withMessage('A nem csak "férfi" vagy "nő" lehet'),

  // szemelyi_igazolvany_szam - kötelező, 6 számjegy + 2 betű
  body('szemelyi_igazolvany_szam')
    .notEmpty()
    .withMessage('A személyi igazolvány szám megadása kötelező')
    .matches(/^[0-9]{6}[A-Z]{2}$/)
    .withMessage('Érvénytelen formátum (6 számjegy + 2 nagybetű, pl: 123456AA)'),

  // taj_szam - kötelező, 9 számjegy
  body('taj_szam')
    .notEmpty()
    .withMessage('A TAJ szám megadása kötelező')
    .matches(/^[0-9]{9}$/)
    .withMessage('A TAJ szám pontosan 9 számjegyből áll'),

  // diakigazolvany_szam - kötelező, 8 számjegy
  body('diakigazolvany_szam')
    .notEmpty()
    .withMessage('A diákigazolvány szám megadása kötelező')
    .matches(/^[0-9]{8}$/)
    .withMessage('A diákigazolvány szám pontosan 8 számjegyből áll'),

  // kapcsolat_tipusa - kötelező, 'anya', 'apa' vagy 'gondviselo'
  body('kapcsolat_tipusa')
    .notEmpty()
    .withMessage('A kapcsolat típusának megadása kötelező')
    .isIn(['anya', 'apa', 'gondviselo'])
    .withMessage('A kapcsolat típusa csak anya, apa vagy gondviselo lehet'),

  // szulo_id - opcionális, nullable, pozitív egész szám
  body('szulo_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Érvénytelen szülő azonosító'),

  // cim_id - opcionális, nullable, pozitív egész szám
  body('cim_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Érvénytelen cím azonosító')
];

/**
 * Validátor tömb diák frissítéséhez
 * PUT /api/diak/:id
 */
const updateDiakValidator = [
  // param id - pozitív egész szám
  param('id')
    .isInt({ min: 1 })
    .withMessage('Érvénytelen azonosító'),

  // nev - opcionális, 2-100 karakter
  body('nev')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('A név nem lehet üres')
    .isLength({ min: 2, max: 100 })
    .withMessage('A név 2-100 karakter hosszú lehet')
];

/**
 * Validátor tömb diák lista lekéréséhez lekérdezési paraméterekkel
 * GET /api/diak
 */
const getDiakValidator = [
  // query limit - opcionális, 1-100
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('A limit 1-100 között lehet'),

  // query offset - opcionális, min 0
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Az offset nem lehet negatív'),

  // query sort - opcionális, az engedélyezett mezők egyike
  query('sort')
    .optional()
    .isIn(['nev', 'id', 'createdAt'])
    .withMessage('Érvénytelen rendezési mező (megengedett: nev, id, createdAt)'),

  // query order - opcionális, ASC vagy DESC
  query('order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('A sorrend csak ASC vagy DESC lehet'),

  // query includeRelations - opcionális, 'true' vagy 'false' string
  query('includeRelations')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Az includeRelations paraméter csak "true" vagy "false" lehet')
];

module.exports = {
  createDiakValidator,
  updateDiakValidator,
  getDiakValidator
};