/**
 * Enhanced error response formatter for consistent API error responses
 * Provides standardized error format with debugging context while maintaining security
 */

const logger = require('./logger');

/**
 * Generates a unique request ID for tracking requests across logs and responses
 * @returns {string} Unique request ID in format: req-YYYYMMDD-HHMMSS-XXXX
 */
const generateRequestId = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `req-${date}-${time}-${random}`;
};

/**
 * Determines if the application is running in development mode
 * @returns {boolean} true if in development mode
 */
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
};

/**
 * Creates a standardized error response object
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} options - Additional options
 * @param {boolean} options.includeStack - Whether to include stack trace (default: based on environment)
 * @param {boolean} options.includeDetails - Whether to include error details (default: based on environment)
 * @returns {Object} Standardized error response
 */
const createErrorResponse = (error, req, options = {}) => {
  const requestId = req.requestId || generateRequestId();
  const timestamp = new Date().toISOString();
  const userId = req.user?.userId || null;
  
  // Determine what to include based on environment and options
  const includeStack = options.includeStack !== undefined 
    ? options.includeStack 
    : isDevelopment();
  
  const includeDetails = options.includeDetails !== undefined 
    ? options.includeDetails 
    : isDevelopment();

  // Base error response structure
  const response = {
    success: false,
    error: error.message || 'An unexpected error occurred',
    requestId,
    timestamp,
    userId
  };

  // Add error details if available and allowed
  if (includeDetails && error.details) {
    response.details = error.details;
  }

  // Add stack trace if allowed (development mode only by default)
  if (includeStack && error.stack) {
    response.stack = error.stack.split('\n');
  }

  // Add error code if available
  if (error.code) {
    response.code = error.code;
  }

  // Add HTTP status code
  if (error.statusCode) {
    response.statusCode = error.statusCode;
  }

  // Add validation errors if available
  if (error.name === 'ValidationError' && error.errors) {
    response.validationErrors = error.errors;
  }

  return response;
};

/**
 * Enhanced error logger that correlates with request ID
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} additionalContext - Additional context for logging
 */
const logErrorWithContext = (error, req, additionalContext = {}) => {
  const context = {
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId || null,
    userAgent: req.get('User-Agent'),
    ...additionalContext
  };

  // Include stack trace in development mode
  if (isDevelopment() && error.stack) {
    context.stack = error.stack;
  }

  logger.logError(error, context);
};

/**
 * Middleware to add request ID and timestamp to all requests
 * @param {Object} req - Express request object
 * @param {Object} _res - Express response object
 * @param {Function} next - Express next function
 */
const addRequestContext = (req, _res, next) => {
  req.requestId = generateRequestId();
  req.requestTimestamp = new Date();
  next();
};

/**
 * Safe error message for production environments
 * @param {number} statusCode - HTTP status code
 * @returns {string} Safe error message
 */
const getSafeErrorMessage = (statusCode) => {
  const safeMessages = {
    400: 'Invalid request',
    401: 'Authentication required',
    403: 'Access forbidden',
    404: 'Resource not found',
    409: 'Conflict occurred',
    422: 'Request could not be processed',
    429: 'Too many requests, please try again later',
    500: 'Server error occurred, please try again later'
  };
  
  return safeMessages[statusCode] || safeMessages[500];
};

module.exports = {
  generateRequestId,
  createErrorResponse,
  logErrorWithContext,
  addRequestContext,
  getSafeErrorMessage,
  isDevelopment
};