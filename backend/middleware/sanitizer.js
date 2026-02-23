/**
 * Input Sanitizer Middleware
 * Protects against NoSQL injection attacks by removing dangerous keys
 */

/**
 * Recursively sanitize an object by removing keys starting with '$'
 * @param {*} obj - Object, array, or primitive to sanitize
 * @returns {*} - Sanitized copy of the input
 */
const sanitizeObject = (obj) => {
  // Return primitives as-is
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays - recursively sanitize each element
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  // Handle objects - remove dangerous keys and recursively sanitize values
  const sanitized = {};
  for (const key in obj) {
    // Skip keys starting with '$' (NoSQL injection protection)
    if (key.startsWith('$')) {
      continue;
    }

    // Also skip keys containing '.' (MongoDB dot notation injection)
    if (key.includes('.')) {
      continue;
    }

    // Recursively sanitize nested objects/arrays
    sanitized[key] = sanitizeObject(obj[key]);
  }

  return sanitized;
};

/**
 * Middleware to sanitize all incoming request data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize route parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

module.exports = sanitizeInput;