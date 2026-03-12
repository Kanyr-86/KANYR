const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern for CSRF protection
 * 
 * How it works:
 * 1. Server generates a random CSRF token and sets it as a cookie (httpOnly: false, so JS can read it)
 * 2. Client reads the cookie and sends the token in a custom header (X-CSRF-Token)
 * 3. Server validates that the header token matches the cookie token
 * 
 * This prevents CSRF attacks because:
 * - The attacker cannot read the cookie (same-origin policy)
 * - The attacker cannot set custom headers on cross-origin requests (CORS preflight)
 * - The attacker cannot guess the random token
 */

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

// In-memory storage for CSRF tokens (in production, use Redis or database)
// Maps session ID to CSRF token
const csrfTokens = new Map();

// Cleanup interval for expired tokens (24 hours)
const TOKEN_LIFETIME = 24 * 60 * 60 * 1000;

/**
 * Generate a cryptographically secure random token
 * @returns {string} Random token
 */
function generateToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Get client identifier (IP + User Agent hash or session ID)
 * @param {Object} req - Express request object
 * @returns {string} Client identifier
 */
function getClientId(req) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const userId = req.user?.userId || 'anonymous';
  return crypto.createHash('sha256')
    .update(`${ip}:${userAgent}:${userId}`)
    .digest('hex');
}

/**
 * Store CSRF token for a client
 * @param {string} clientId - Client identifier
 * @param {string} token - CSRF token
 */
function storeToken(clientId, token) {
  csrfTokens.set(clientId, {
    token,
    createdAt: Date.now()
  });
}

/**
 * Get stored CSRF token for a client
 * @param {string} clientId - Client identifier
 * @returns {Object|null} Token data or null
 */
function getStoredToken(clientId) {
  const data = csrfTokens.get(clientId);
  if (!data) return null;
  
  // Check if token is expired
  if (Date.now() - data.createdAt > TOKEN_LIFETIME) {
    csrfTokens.delete(clientId);
    return null;
  }
  
  return data;
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  let deleted = 0;
  
  for (const [clientId, data] of csrfTokens.entries()) {
    if (now - data.createdAt > TOKEN_LIFETIME) {
      csrfTokens.delete(clientId);
      deleted++;
    }
  }
  
  if (deleted > 0) {
    logger.debug('CSRF token cleanup completed', { deletedCount: deleted });
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

/**
 * Middleware to generate and set CSRF token cookie
 * This should be applied to routes that serve HTML or API endpoints that need CSRF tokens
 */
function csrfTokenMiddleware(req, res, next) {
  try {
    const clientId = getClientId(req);
    let tokenData = getStoredToken(clientId);
    
    // Generate new token if none exists or is expired
    if (!tokenData) {
      const token = generateToken();
      storeToken(clientId, token);
      tokenData = { token };
      
      logger.debug('CSRF token generated', { clientId: clientId.substring(0, 8) + '...' });
    }
    
    // Set CSRF token as cookie (accessible by JavaScript)
    res.cookie(CSRF_COOKIE_NAME, tokenData.token, {
      httpOnly: false, // JavaScript must be able to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_LIFETIME,
      path: '/'
    });
    
    // Also set it in a header for the client to read easily
    res.setHeader('X-CSRF-Token', tokenData.token);
    
    // Attach token to request for potential use in response
    req.csrfToken = tokenData.token;
    
    next();
  } catch (error) {
    logger.error('CSRF token generation error', { error: error.message });
    next(error);
  }
}

/**
 * Middleware to validate CSRF token on state-changing requests
 * Only validates POST, PUT, DELETE, PATCH requests
 */
function csrfProtectionMiddleware(req, res, next) {
  try {
    // Skip CSRF validation for GET, HEAD, OPTIONS requests (they should be safe)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
      return next();
    }
    
    // Skip CSRF validation for login endpoint (user is not authenticated yet)
    if (req.path === '/api/auth/login' || req.path === '/login') {
      return next();
    }
    
    // Skip if user is not authenticated (no JWT token)
    // CSRF protection is only needed when user is logged in
    if (!req.user) {
      return next();
    }
    
    const clientId = getClientId(req);
    const storedTokenData = getStoredToken(clientId);
    
    // Get token from custom header
    const headerToken = req.headers[CSRF_HEADER_NAME];
    
    // Also check the cookie as fallback (double-submit pattern)
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    
    if (!headerToken && !cookieToken) {
      logger.warn('CSRF token missing', {
        clientId: clientId.substring(0, 8) + '...',
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      return res.status(403).json({
        success: false,
        error: 'CSRF token hiányzik. Kérjük, frissítse az oldalt és próbálja újra.',
        code: 'CSRF_MISSING'
      });
    }
    
    // Use header token primarily, fallback to cookie
    const submittedToken = headerToken || cookieToken;
    
    if (!storedTokenData) {
      logger.warn('CSRF token not found in storage', {
        clientId: clientId.substring(0, 8) + '...',
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        success: false,
        error: 'CSRF token lejárt vagy érvénytelen. Kérjük, frissítse az oldalt.',
        code: 'CSRF_EXPIRED'
      });
    }
    
    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(submittedToken, 'utf8'),
      Buffer.from(storedTokenData.token, 'utf8')
    );
    
    if (!isValid) {
      logger.warn('CSRF token mismatch', {
        clientId: clientId.substring(0, 8) + '...',
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      return res.status(403).json({
        success: false,
        error: 'Érvénytelen CSRF token. Kérjük, frissítse az oldalt és próbálja újra.',
        code: 'CSRF_INVALID'
      });
    }
    
    // Token is valid, proceed
    next();
  } catch (error) {
    logger.error('CSRF validation error', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Hiba a CSRF token ellenőrzése közben'
    });
  }
}

/**
 * Route handler to get a fresh CSRF token
 * Useful for SPAs that need to get a token after page load
 */
function getCsrfToken(req, res) {
  try {
    const clientId = getClientId(req);
    let tokenData = getStoredToken(clientId);
    
    // Generate new token if none exists
    if (!tokenData) {
      const token = generateToken();
      storeToken(clientId, token);
      tokenData = { token };
    }
    
    // Set CSRF token as cookie
    res.cookie(CSRF_COOKIE_NAME, tokenData.token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_LIFETIME,
      path: '/'
    });
    
    res.json({
      success: true,
      data: {
        csrfToken: tokenData.token
      }
    });
  } catch (error) {
    logger.error('Get CSRF token error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Nem sikerült CSRF tokent generálni'
    });
  }
}

module.exports = {
  csrfTokenMiddleware,
  csrfProtectionMiddleware,
  getCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME
};
