/**
 * Global Error Handling Middleware for Express
 * Centralizes error handling and provides consistent error responses
 */

const { 
  AppError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError, 
  NotFoundError, 
  ConflictError 
} = require('../utils/AppError');

/**
 * Express error handling middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error to console
  console.error(`[${err.name}] ${err.message}`);
  
  // Log stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    message = err.message;
  } else if (err instanceof AppError) {
    // Custom AppError with specific status code
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // Unexpected error - hide details in production
    if (process.env.NODE_ENV === 'production') {
      message = 'Something went wrong';
    }
  }

  // Send JSON response
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

module.exports = errorHandler;