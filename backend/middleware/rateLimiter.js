const rateLimit = require('express-rate-limit');

/**
 * Format time remaining in Hungarian
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted time string in Hungarian
 */
const formatTimeRemaining = (seconds) => {
  if (seconds < 60) {
    return `${seconds} másodperc`;
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes === 1) {
    return '1 perc';
  }
  return `${minutes} perc`;
};

/**
 * Strict rate limiter for login endpoint
 * Protects against brute force attacks
 * Limits: 5 attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true, // Send rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000) - Math.floor(Date.now() / 1000);
    const timeRemaining = formatTimeRemaining(retryAfter);
    
    res.status(429).json({
      success: false,
      error: 'Túl sok bejelentkezési kísérlet. Kérjük, próbálja újra később.',
      message: `Túl sok sikertelen bejelentkezési kísérlet. Kérjük, várjon ${timeRemaining} és próbálkozzon újra.`,
      retryAfter: timeRemaining
    });
  }
  // Default keyGenerator handles IPv6 properly
});

/**
 * General rate limiter for API endpoints
 * Protects against general abuse
 * Limits: 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true, // Send rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000) - Math.floor(Date.now() / 1000);
    const timeRemaining = formatTimeRemaining(retryAfter);
    
    res.status(429).json({
      success: false,
      error: 'Túl sok kérés. Kérjük, próbálja újra később.',
      message: `Túl sok kérés érkezett. Kérjük, várjon ${timeRemaining} és próbálkozzon újra.`,
      retryAfter: timeRemaining
    });
  }
  // Default keyGenerator handles IPv6 properly
});

module.exports = {
  loginLimiter,
  generalLimiter
};
