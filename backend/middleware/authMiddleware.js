const logger = require('../utils/logger');
const { verifyToken } = require('../utils/authUtils');
const { mapAdminToRole, isAdminRole, canModifyRole } = require('../config/roles');

/**
 * Hitelesítési middleware - JWT token ellenőrzése
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

    const user = await db.Felhasznalo.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Felhasználó nem található'
      });
    }

    // Felhasználó csatolása a kéréshez
    // Admin boolean leképezése szerepkörre a jogosultság-alapú hozzáféréshez
    const szerepkor = mapAdminToRole(user.admin);
    req.user = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      admin: user.admin, // Keep for backward compatibility
      szerepkor: szerepkor
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
