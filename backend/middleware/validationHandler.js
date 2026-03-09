/**
 * Validációs hiba kezelő middleware
 * Feldolgozza az express-validator eredményeit és strukturált validációs hibákat hoz létre
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/AppError');

/**
 * Middleware az express-validator validációs eredményeinek kezeléséhez
 * @param {Object} req - Express kérés objektum
 * @param {Object} res - Express válasz objektum
 * @param {Function} next - Express next függvény
 * 
 * @example
 * // Használat route-okban:
 * const { body } = require('express-validator');
 * const validationHandler = require('../middleware/validationHandler');
 * 
 * router.post('/user',
 *   body('email').isEmail().withMessage('Érvénytelen email'),
 *   body('name').notEmpty().withMessage('Név megadása kötelező'),
 *   validationHandler,
 *   createUser
 * );
 */
const validationHandler = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Validációs hiba létrehozása strukturált részletekkel
    const error = new ValidationError('Validációs hiba');
    
    // Részletek tömb csatolása mező és üzenet információkkal minden hibához
    error.details = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return next(error);
  }

  next();
};

module.exports = validationHandler;