/**
 * Role-Based Access Control Middleware
 * Provides middleware functions for role-based authorization
 */

const { UnauthorizedError, ForbiddenError } = require('../utils/AppError');

/**
 * Factory function that creates middleware to check user roles
 * @param {...string} roles - Allowed roles for the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only allow admin and titkar roles
 * router.delete('/user/:id', authenticate, requireRole('admin', 'titkar'), deleteUser);
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by authenticate middleware)
    if (!req.user) {
      throw new UnauthorizedError();
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.szerepkor)) {
      throw new ForbiddenError(`Required role: ${roles.join(', ')}`);
    }

    next();
  };
};

/**
 * Factory function that creates middleware for self-or-role access control
 * Allows access if user owns the resource OR has an allowed role
 * @param {string} idParam - Name of the route parameter containing the resource ID
 * @param {...string} roles - Allowed roles that can access any resource
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Allow user to modify their own data, or admin/titkar to modify any
 * router.put('/diak/:id', authenticate, requireSelfOrRole('id', 'admin', 'titkar'), updateDiak);
 */
const requireSelfOrRole = (idParam, ...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by authenticate middleware)
    if (!req.user) {
      throw new UnauthorizedError();
    }

    // Get resource ID from route params
    const resourceId = parseInt(req.params[idParam], 10);

    // Check if user is owner (diakId matches resource) or has allowed role
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