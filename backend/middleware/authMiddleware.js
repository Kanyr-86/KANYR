const logger = require('../utils/logger');
const { verifyToken } = require('../utils/authUtils');
const { mapAdminToRole, isAdminRole, canModifyRole } = require('../config/roles');
const TokenBlacklistService = require('../services/TokenBlacklistService');

/**
 * Hitelesítési middleware - JWT token ellenőrzése
 * Ellenőrzi:
 * - Token létezését és érvényességét
 * - Token nincs-e a feketelistán (visszavonva)
 * - Token verzió egyezik-e a felhasználó jelenlegi verziójával
 * - Felhasználó létezését
 * - Biztonsági jelzőket (force_logout, stb.)
 * @param {Object} req - Express kérés objektum
 * @param {Object} res - Express válasz objektum
 * @param {Function} next - Következő middleware függvény
 */
async function authenticate(req, res, next) {
  try {
    // Token lekérdezése a header-ből
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Nincs bejelentkezési token megadva'
      });
    }

    // Token ellenőrzése
    const decoded = verifyToken(token);

    // Adatbázis lekérdezése az app.locals-ból (szinkronizált példány)
    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({
        success: false,
        error: 'Az adatbázis még nem elérhető'
      });
    }

    // Token feketelista ellenőrzése
    const tokenBlacklistService = new TokenBlacklistService(db);
    const isRevoked = await tokenBlacklistService.isTokenRevoked(token);

    if (isRevoked) {
      logger.warn('Revoked token used', { userId: decoded.userId, ip: req.ip });
      return res.status(401).json({
        success: false,
        error: 'A token visszavonva lett. Kérjük, jelentkezzen be újra.'
      });
    }

    const user = await db.Felhasznalo.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Felhasználó nem található'
      });
    }

    // Token verzió ellenőrzése (jelszó/csoport változtatás esetén érvénytelenné válik)
    const currentTokenVersion = user.token_version || 1;
    const tokenVersion = decoded.tokenVersion || 1;

    if (tokenVersion !== currentTokenVersion) {
      logger.warn('Token version mismatch', {
        userId: decoded.userId,
        tokenVersion,
        currentTokenVersion,
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'A token érvénytelenné vált. Kérjük, jelentkezzen be újra.'
      });
    }

    // Biztonsági jelzők ellenőrzése
    const securityFlags = user.security_flags || {};
    if (securityFlags.force_logout) {
      logger.warn('Force logout flag detected', { userId: decoded.userId, ip: req.ip });
      return res.status(401).json({
        success: false,
        error: 'A munkamenet lejárt. Kérjük, jelentkezzen be újra.'
      });
    }

    if (securityFlags.suspicious_activity) {
      logger.warn('Suspicious activity flag detected', { userId: decoded.userId, ip: req.ip });
      // Nem utasítjuk el a kérést, de naplózzuk és értesíthetjük a felhasználót
    }

    // Admin boolean leképezése szerepkörre a jogosultság-alapú hozzáféréshez
    const szerepkor = mapAdminToRole(user.admin);

    // Felhasználó csatolása a kéréshez
    req.user = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      admin: user.admin, // Keep for backward compatibility
      szerepkor: szerepkor,
      tokenVersion: currentTokenVersion,
      diakId: user.diak_id // Include diak_id for ownership checks
    };

    // Token metadata hozzáadása a kéréshez
    req.tokenInfo = {
      token,
      decoded,
      issuedAt: new Date(decoded.iat * 1000)
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message, stack: error.stack });
    return res.status(401).json({
      success: false,
      error: 'Érvénytelen vagy lejárt bejelentkezési token'
    });
  }
}

/**
 * Admin middleware - ellenőrzi, hogy a felhasználó admin (főtitkár) e
 * @param {Object} req - Express kérés objektum
 * @param {Object} res - Express válasz objektum
 * @param {Function} next - Következő middleware függvény
 */
function isAdmin(req, res, next) {
  try {
    // Ellenőrzi, hogy a felhasználó be van-e jelentkezve és rendelkezik-e admin jogokkal (főtitkár)
    if (!req.user || !isAdminRole(req.user.szerepkor)) {
      return res.status(403).json({
        success: false,
        error: 'Főtitkár jogok szükségesek ehhez a művelethez'
      });
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      error: 'Hiba az admin jogok ellenőrzése közben'
    });
  }
}

/**
 * Ellenőrzi, hogy a felhasználó módosíthatja-e az adatokat (létrehozás, frissítés, törlés)
 * Mind a főtitkár, mind a titkár létrehozhat/frissíthet/törölhet entitásokat
 * @param {Object} req - Express kérés objektum
 * @param {Object} res - Express válasz objektum
 * @param {Function} next - Következő middleware függvény
 */
function canModify(req, res, next) {
  try {
    // Ellenőrzi, hogy a felhasználó be van-e jelentkezve és rendelkezik-e módosítási jogokkal
    if (!req.user || !canModifyRole(req.user.szerepkor)) {
      return res.status(403).json({
        success: false,
        error: 'Csak titkár vagy főtitkár végezheti ezt a műveletet'
      });
    }

    next();
  } catch (error) {
    logger.error('CanModify middleware error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      error: 'Hiba a jogosultság ellenőrzése közben'
    });
  }
}

module.exports = {
  authenticate,
  isAdmin,
  canModify
};
