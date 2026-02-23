/**
 * Request Logger Middleware
 * Logs HTTP request details with response time
 */

/**
 * Middleware to log all HTTP requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * 
 * @example
 * // Output format:
 * // [2026-02-23T08:30:45.123Z] GET /api/diaks - 200 - 45ms - ::1
 */
const requestLogger = (req, res, next) => {
  // Record start time
  const startTime = Date.now();

  // Listen for response finish event
  res.on('finish', () => {
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Get ISO timestamp
    const timestamp = new Date().toISOString();
    
    // Log request details
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`
    );
  });

  // Continue to next middleware
  next();
};

module.exports = requestLogger;