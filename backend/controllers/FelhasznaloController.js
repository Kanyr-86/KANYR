const { validationResult } = require('express-validator');
const FelhasznaloService = require('../services/FelhasznaloService');
const FelhasznaloRepository = require('../repositories/FelhasznaloRepository');
const { ValidationError, ForbiddenError } = require('../utils/AppError');

class FelhasznaloController {
  constructor(db) {
    this.db = db;
    this.felhasznaloRepository = new FelhasznaloRepository(db);
    this.felhasznaloService = new FelhasznaloService(db, { repository: this.felhasznaloRepository });
  }

  /**
   * POST /api/felhasznalos
   * Create a new user
   */
  async createUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new ValidationError('Validációs hiba');
        error.details = errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }));
        throw error;
      }

      const userData = req.body;
      const user = await this.felhasznaloService.createUser(userData);

      res.status(201).json({
        success: true,
        data: user,
        message: 'Felhasználó sikeresen létrehozva'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/felhasznalos
   * Get all users (admin only)
   */
  async getAllUsers(req, res, next) {
    try {
      const { limit = 50, offset = 0, sort = 'username', order = 'ASC' } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sort,
        order
      };

      const users = await this.felhasznaloService.getAllUsers(options);

      res.json({
        success: true,
        data: users,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: users.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/felhasznalos/:id
   * Get user by ID
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen felhasználó ID');
      }

      const user = await this.felhasznaloService.getUserById(parseInt(id));

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/felhasznalos/:id
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new ValidationError('Validációs hiba');
        error.details = errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }));
        throw error;
      }

      const { id } = req.params;
      const updates = req.body;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen felhasználó ID');
      }

      const user = await this.felhasznaloService.updateUser(parseInt(id), updates);

      res.json({
        success: true,
        data: user,
        message: 'Felhasználó sikeresen frissítve'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/felhasznalos/:id
   * Delete user
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen felhasználó ID');
      }

      await this.felhasznaloService.deleteUser(parseInt(id));

      res.json({
        success: true,
        message: 'Felhasználó sikeresen törölve'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/felhasznalos/admin
   * Create admin user (admin only)
   */
  async createAdminUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new ValidationError('Validációs hiba');
        error.details = errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }));
        throw error;
      }

      const userData = req.body;
      const adminUser = await this.felhasznaloService.createAdminUser(userData);

      res.status(201).json({
        success: true,
        data: adminUser,
        message: 'Admin felhasználó sikeresen létrehozva'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/felhasznalos/:id/password
   * Update user password - invalidates all existing tokens
   */
  async updatePassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new ValidationError('Validációs hiba');
        error.details = errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }));
        throw error;
      }

      const { id } = req.params;
      const { newPassword, revokeTokens } = req.body;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen felhasználó ID');
      }

      if (!newPassword || newPassword.length < 8) {
        throw new ValidationError('A jelszónak minimum 8 karakter hosszúnak kell lennie');
      }

      // Parse user ID
      const userId = parseInt(id);

      // Check if user is changing their own password
      const isSelfChange = req.user && req.user.userId === userId;

      // Update password with token revocation
      const user = await this.felhasznaloService.updatePassword(
        userId,
        newPassword,
        { revokeTokens: revokeTokens !== false } // default to true
      );

      res.json({
        success: true,
        data: user,
        message: 'Jelszó sikeresen frissítve. Kérjük, jelentkezzen be újra az összes eszközön.',
        requireRelogin: true,
        isSelfChange
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/felhasznalos/:id/reset-password
   * Reset user password (admin only) - invalidates all existing tokens
   */
  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen felhasználó ID');
      }

      const { user, newPassword } = await this.felhasznaloService.resetPassword(parseInt(id));

      // Az új jelszót visszaadjuk az adminnak, hogy el tudja juttatni a felhasználóhoz.
      // Ez az egyetlen alkalom, amikor a jelszó plaintext-ben megjelenik a válaszban.
      res.json({
        success: true,
        data: {
          user,
          temporaryPassword: newPassword
        },
        message: `Jelszó sikeresen visszaállítva. Minden meglévő munkamenet érvénytelenné vált. Ideiglenes jelszó: ${newPassword}`,
        requireRelogin: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/felhasznalos/:id/make-admin
   * Make user admin (admin only) - invalidates all existing tokens
   */
  async makeAdmin(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen felhasználó ID');
      }

      // Prevent changing own admin status
      if (req.user && req.user.userId === parseInt(id)) {
        throw new ForbiddenError('Nem változtathatja meg saját admin jogosultságát');
      }

      const user = await this.felhasznaloService.updateUserRole(parseInt(id), true);

      res.json({
        success: true,
        data: user,
        message: 'Felhasználó sikeresen adminná változtatva. A felhasználónak újra be kell jelentkeznie.',
        requireRelogin: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/felhasznalos/:id/remove-admin
   * Remove admin rights from user (admin only) - invalidates all existing tokens
   */
  async removeAdmin(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen felhasználó ID');
      }

      // Prevent changing own admin status
      if (req.user && req.user.userId === parseInt(id)) {
        throw new ForbiddenError('Nem változtathatja meg saját admin jogosultságát');
      }

      const user = await this.felhasznaloService.updateUserRole(parseInt(id), false);

      res.json({
        success: true,
        data: user,
        message: 'Admin jogok sikeresen eltávolítva. A felhasználónak újra be kell jelentkeznie.',
        requireRelogin: true
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/felhasznalos/:id/force-logout
   * Force logout user (admin only)
   */
  async forceLogout(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen felhasználó ID');
      }

      // Prevent self-logout
      if (req.user && req.user.userId === parseInt(id)) {
        throw new ForbiddenError('Nem jelentkeztetheti ki saját magát');
      }

      const user = await this.felhasznaloService.forceLogout(parseInt(id), reason || 'admin_action');

      res.json({
        success: true,
        data: user,
        message: 'Felhasználó sikeresen kijelentkeztetve az összes eszközről.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FelhasznaloController;
