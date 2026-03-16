/**
 * Egyedi hiba osztályok Express alkalmazáshoz
 * Strukturált hibakezelést biztosít működési hibák követésével
 */

const { generateRequestId } = require('./errorResponse');

/**
 * Alap AppError osztály, amely kiterjeszti a natív Error-t
 * Minden egyedi hibának ezt az osztályt kell kiterjesztenie
 */
class AppError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.requestId = options.requestId || generateRequestId();
    this.timestamp = options.timestamp || new Date().toISOString();
    this.userId = options.userId || null;
    this.details = options.details || null;
    
    // Stack trace rögzítése, a konstruktor kihagyásával
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * ValidationError - Érvénytelen kérés adatokhoz
 * HTTP státusz: 400 Bad Request
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * UnauthorizedError - Hitelesítési hibákhoz
 * HTTP státusz: 401 Unauthorized
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * ForbiddenError - Jogosultsági hibákhoz
 * HTTP státusz: 403 Forbidden
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * NotFoundError - Hiányzó erőforrásokhoz
 * HTTP státusz: 404 Not Found
 * @param {string} resourceName - A nem talált erőforrás neve
 */
class NotFoundError extends AppError {
  constructor(resourceName) {
    const message = resourceName ? `${resourceName} not found` : 'Resource not found';
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * ConflictError - Erőforrás ütközésekhez (pl. duplikált bejegyzések)
 * HTTP státusz: 409 Conflict
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// Minden osztály egyedi exportálása
module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
};