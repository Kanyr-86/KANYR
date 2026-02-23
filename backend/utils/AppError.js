/**
 * Custom Error Classes for Express Application
 * Provides structured error handling with operational error tracking
 */

/**
 * Base AppError class that extends the native Error
 * All custom errors should extend this class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    // Capture stack trace, excluding the constructor from it
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * ValidationError - For invalid request data
 * HTTP Status: 400 Bad Request
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * UnauthorizedError - For authentication failures
 * HTTP Status: 401 Unauthorized
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * ForbiddenError - For authorization failures
 * HTTP Status: 403 Forbidden
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * NotFoundError - For missing resources
 * HTTP Status: 404 Not Found
 * @param {string} resourceName - Name of the resource that was not found
 */
class NotFoundError extends AppError {
  constructor(resourceName) {
    const message = resourceName ? `${resourceName} not found` : 'Resource not found';
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * ConflictError - For resource conflicts (e.g., duplicate entries)
 * HTTP Status: 409 Conflict
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// Export all classes individually
module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
};