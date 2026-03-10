/**
 * Resource ownership verification middleware
 * Ensures users can only access their own resources unless they have admin privileges
 */

const { ForbiddenError, UnauthorizedError } = require('../utils/AppError');
const { ROLES } = require('../config/roles');

/**
 * Middleware to attach diak_id to the user object from the Felhasznalo record
 * Must be used after authenticate middleware
 */
const attachDiakId = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    // If diakId is already attached, skip
    if (req.user.diakId !== undefined) {
      return next();
    }

    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({
        success: false,
        error: 'Az adatbázis még nem elérhető'
      });
    }

    // Look up the user's diak_id from Felhasznalo table
    const felhasznalo = await db.Felhasznalo.findByPk(req.user.userId, {
      attributes: ['diak_id']
    });

    if (felhasznalo) {
      req.user.diakId = felhasznalo.diak_id;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is accessing their own resource
 * @param {Object} req - Express request object
 * @param {number} resourceDiakId - The diak_id associated with the resource
 * @returns {boolean} True if user owns the resource
 */
const isOwnResource = (req, resourceDiakId) => {
  if (!req.user || !req.user.diakId || !resourceDiakId) {
    return false;
  }
  return req.user.diakId === resourceDiakId;
};

/**
 * Check if user has admin or secretary privileges
 * @param {Object} req - Express request object
 * @returns {boolean} True if user has elevated privileges
 */
const hasElevatedPrivileges = (req) => {
  if (!req.user || !req.user.szerepkor) {
    return false;
  }
  return req.user.szerepkor === ROLES.FOTITKAR || req.user.szerepkor === ROLES.TITKAR;
};

/**
 * Middleware factory: Require ownership or elevated privileges
 * @param {string} idParam - Route parameter name containing the resource ID
 * @param {Function} getResourceOwnerFn - Async function to get the diak_id of the resource owner
 * @param {Object} options - Additional options
 * @param {boolean} options.allowAdmins - Whether to allow admins full access (default: true)
 * @param {string} options.forbiddenMessage - Custom forbidden message
 */
const requireOwnership = (idParam, getResourceOwnerFn, options = {}) => {
  const {
    allowAdmins = true,
    forbiddenMessage = 'Nincs jogosultsága ehhez az erőforráshoz'
  } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      // Admins always have access if allowAdmins is true
      if (allowAdmins && hasElevatedPrivileges(req)) {
        return next();
      }

      // Get the resource ID from request params
      const resourceId = parseInt(req.params[idParam], 10);
      if (isNaN(resourceId)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen erőforrás azonosító'
        });
      }

      // Get the resource owner
      const resourceDiakId = await getResourceOwnerFn(resourceId, req);

      // Check ownership
      if (!isOwnResource(req, resourceDiakId)) {
        throw new ForbiddenError(forbiddenMessage);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory: Verify user can only access their own profile
 * For use on /:id routes where users should only access their own data
 * @param {string} idParam - Route parameter name (default: 'id')
 * @param {string} userIdField - Field in req.user to compare (default: 'userId')
 */
const requireOwnUserProfile = (idParam = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      // Admins always have access
      if (hasElevatedPrivileges(req)) {
        return next();
      }

      const requestedUserId = parseInt(req.params[idParam], 10);
      const currentUserId = req.user[userIdField];

      if (isNaN(requestedUserId)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen felhasználó azonosító'
        });
      }

      if (requestedUserId !== currentUserId) {
        throw new ForbiddenError('Csak a saját profilját módosíthatja');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Get the diak_id owner for a Diak resource
 */
const getDiakOwner = async (diakId, req) => {
  // For Diak, the owner is the diak itself
  return diakId;
};

/**
 * Get the diak_id owner for a Szulo resource
 */
const getSzuloOwner = async (szuloId, req) => {
  const db = req.app.locals.db;
  const diak = await db.Diak.findOne({
    where: { szulo_id: szuloId },
    attributes: ['diak_id']
  });
  return diak ? diak.diak_id : null;
};

/**
 * Get the diak_id owner for a Lakcim resource
 */
const getLakcimOwner = async (cimId, req) => {
  const db = req.app.locals.db;
  
  // Check if a diak has this cim_id
  const diak = await db.Diak.findOne({
    where: { cim_id: cimId },
    attributes: ['diak_id']
  });
  
  if (diak) {
    return diak.diak_id;
  }

  // Check if a szulo has this cim_id
  const szulo = await db.Szulo.findOne({
    where: { cim_id: cimId },
    attributes: ['szulo_id']
  });

  if (szulo) {
    // Find the diak associated with this szulo
    const diakForSzulo = await db.Diak.findOne({
      where: { szulo_id: szulo.szulo_id },
      attributes: ['diak_id']
    });
    return diakForSzulo ? diakForSzulo.diak_id : null;
  }

  return null;
};

/**
 * Get the diak_id owner for a SzobaBekoltozes resource
 */
const getBekoltozesOwner = async (bekoltozesId, req) => {
  const db = req.app.locals.db;
  const bekoltozes = await db.SzobaBekoltozes.findByPk(bekoltozesId, {
    attributes: ['diak_id']
  });
  return bekoltozes ? bekoltozes.diak_id : null;
};

/**
 * Get the diak_id owner for a SzobaValtoztatas resource
 */
const getSzobaValtoztatasOwner = async (valtoztatasId, req) => {
  const db = req.app.locals.db;
  const valtoztatas = await db.SzobaValtoztatas.findByPk(valtoztatasId, {
    attributes: ['diak_id']
  });
  return valtoztatas ? valtoztatas.diak_id : null;
};

/**
 * Get the diak_id owner for a Notification resource
 */
const getNotificationOwner = async (notificationId, req) => {
  const db = req.app.locals.db;
  const notification = await db.Notification.findByPk(notificationId, {
    attributes: ['diak_id', 'user_id']
  });
  
  if (!notification) {
    return null;
  }

  // If notification has diak_id, that's the owner
  if (notification.diak_id) {
    return notification.diak_id;
  }

  // If notification has user_id, look up their diak_id
  if (notification.user_id) {
    const felhasznalo = await db.Felhasznalo.findByPk(notification.user_id, {
      attributes: ['diak_id']
    });
    return felhasznalo ? felhasznalo.diak_id : null;
  }

  return null;
};

/**
 * Pre-configured ownership middlewares for common resources
 */
const ownershipMiddlewares = {
  // For Diak resources - user must own the diak record
  requireDiakOwnership: (idParam = 'id') =>
    requireOwnership(idParam, getDiakOwner, {
      forbiddenMessage: 'Csak a saját diák adatait tekintheti meg'
    }),

  // For Szulo resources - user must be the diak whose szulo it is
  requireSzuloOwnership: (idParam = 'id') =>
    requireOwnership(idParam, getSzuloOwner, {
      forbiddenMessage: 'Csak a saját szülő adatait tekintheti meg'
    }),

  // For Lakcim resources - user must be the diak whose address it is
  requireLakcimOwnership: (idParam = 'id') =>
    requireOwnership(idParam, getLakcimOwner, {
      forbiddenMessage: 'Csak a saját lakcím adatait tekintheti meg'
    }),

  // For SzobaBekoltozes resources
  requireBekoltozesOwnership: (idParam = 'id') =>
    requireOwnership(idParam, getBekoltozesOwner, {
      forbiddenMessage: 'Csak a saját beköltözési adatait tekintheti meg'
    }),

  // For SzobaValtoztatas resources
  requireSzobaValtoztatasOwnership: (idParam = 'id') =>
    requireOwnership(idParam, getSzobaValtoztatasOwner, {
      forbiddenMessage: 'Csak a saját szobaváltási kérelmeit tekintheti meg'
    }),

  // For Notification resources
  requireNotificationOwnership: (idParam = 'id') =>
    requireOwnership(idParam, getNotificationOwner, {
      forbiddenMessage: 'Csak a saját értesítéseit tekintheti meg'
    }),

  // For User profile - users can only modify their own profile
  requireOwnProfile: () => requireOwnUserProfile('id', 'userId')
};

module.exports = {
  attachDiakId,
  isOwnResource,
  hasElevatedPrivileges,
  requireOwnership,
  requireOwnUserProfile,
  getDiakOwner,
  getSzuloOwner,
  getLakcimOwner,
  getBekoltozesOwner,
  getSzobaValtoztatasOwner,
  getNotificationOwner,
  ...ownershipMiddlewares
};