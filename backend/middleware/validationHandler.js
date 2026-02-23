/**
 * Validation Handler Middleware
 * Processes express-validator results and creates structured validation errors
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/AppError');

/**
 * Middleware to handle validation results from express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * 
 * @example
 * // Usage in routes:
 * const { body } = require('express-validator');
 * const validationHandler = require('../middleware/validationHandler');
 * 
 * router.post('/user',
 *   body('email').isEmail().withMessage('Invalid email'),
 *   body('name').notEmpty().withMessage('Name is required'),
 *   validationHandler,
 *   createUser
 * );
 */
const validationHandler = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Create ValidationError with structured details
    const error = new ValidationError('Validation failed');
    
    // Attach details array with field and message for each error
    error.details = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return next(error);
  }

  next();
};

module.exports = validationHandler;