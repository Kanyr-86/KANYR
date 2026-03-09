/**
 * Szerepkör-alapú hozzáférés-ellenőrző middleware
 * Middleware függvényeket biztosít szerepkör-alapú jogosultságkezeléshez
 */

const { UnauthorizedError, ForbiddenError } = require('../utils/AppError');
const { ROLES } = require('../config/roles');

/**
 * Gyártófüggvény, amely middleware-t hoz létre a felhasználói szerepkörök ellenőrzéséhez
 * @param {...string} roles - Engedélyezett szerepkörök az adott útvonalhoz
 * @returns {Function} Express middleware függvény
 * 
 * @example
 * // Csak főtitkár és titkár szerepkörök engedélyezése
 * router.delete('/user/:id', authenticate, requireRole(ROLES.FOTITKAR, ROLES.TITKAR), deleteUser);
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // Ellenőrzi, hogy a felhasználó létezik-e (az authenticate middleware által kell beállítva)
    if (!req.user) {
      throw new UnauthorizedError();
    }

    // Ellenőrzi, hogy a felhasználó szerepköre az engedélyezett szerepkörök között van-e
    if (!roles.includes(req.user.szerepkor)) {
      throw new ForbiddenError(`Required role: ${roles.join(', ')}`);
    }

    next();
  };
};

/**
 * Gyártófüggvény, amely middleware-t hoz létre saját-vagy-szerepkör hozzáférés-ellenőrzéshez
 * Engedélyezi a hozzáférést, ha a felhasználó tulajdonosa az erőforrásnak VAGY rendelkezik engedélyezett szerepkörrel
 * @param {string} idParam - Az útvonal paraméter neve, amely tartalmazza az erőforrás azonosítóját
 * @param {...string} roles - Engedélyezett szerepkörök, amelyekkel bármely erőforrás elérhető
 * @returns {Function} Express middleware függvény
 * 
 * @example
 * // Engedélyezi a felhasználónak a saját adatainak módosítását, vagy a főtitkár/titkár számára bármely adat módosítását
 * router.put('/diak/:id', authenticate, requireSelfOrRole('id', ROLES.FOTITKAR, ROLES.TITKAR), updateDiak);
 */
const requireSelfOrRole = (idParam, ...roles) => {
  return (req, res, next) => {
    // Ellenőrzi, hogy a felhasználó létezik-e (az authenticate middleware által kell beállítva)
    if (!req.user) {
      throw new UnauthorizedError();
    }

    // Erőforrás azonosító lekérdezése az útvonal paramétereiből
    const resourceId = parseInt(req.params[idParam], 10);

    // Ellenőrzi, hogy a felhasználó tulajdonos-e (diakId egyezik az erőforrással) vagy rendelkezik engedélyezett szerepkörrel
    const isOwner = req.user.diakId === resourceId;
    const hasRole = roles.includes(req.user.szerepkor);

    if (!isOwner && !hasRole) {
      throw new ForbiddenError('Csak saját adatokat módosíthatja');
    }

    next();
  };
};

module.exports = {
  requireRole,
  requireSelfOrRole
};