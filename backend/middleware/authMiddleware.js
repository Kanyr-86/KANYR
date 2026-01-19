const { verifyToken } = require('../utils/authUtils');
const { Felhasznalo } = require('../models');

/**
 * Authentication middleware - verifies JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Nincs bejelentkezési token megadva'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    const user = await Felhasznalo.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Felhasználó nem található'
      });
    }

    // Attach user to request
    req.user = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      admin: user.admin
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Érvénytelen vagy lejárt bejelentkezési token'
    });
  }
}

/**
 * Admin middleware - checks if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function isAdmin(req, res, next) {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin jogok szükségesek ehhez a művelethez'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Hiba az admin jogok ellenőrzése közben'
    });
  }
}

module.exports = {
  authenticate,
  isAdmin
};
