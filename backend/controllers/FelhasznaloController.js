const { validationResult } = require('express-validator');
const FelhasznaloService = require('../services/FelhasznaloService');
const FelhasznaloRepository = require('../repositories/FelhasznaloRepository');

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
  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const userData = req.body;
      const user = await this.felhasznaloService.createUser(userData);

      res.status(201).json({
        success: true,
        data: user,
        message: 'Felhasználó sikeresen létrehozva'
      });
    } catch (error) {
      if (error.message.includes('már foglalt')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * GET /api/felhasznalos
   * Get all users (admin only)
   */
  async getAllUsers(req, res) {
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
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/felhasznalos/:id
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen felhasználó ID'
        });
      }

      const user = await this.felhasznaloService.getUserById(parseInt(id));

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * PUT /api/felhasznalos/:id
   * Update user
   */
  async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const updates = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen felhasználó ID'
        });
      }

      const user = await this.felhasznaloService.updateUser(parseInt(id), updates);

      res.json({
        success: true,
        data: user,
        message: 'Felhasználó sikeresen frissítve'
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * DELETE /api/felhasznalos/:id
   * Delete user
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen felhasználó ID'
        });
      }

      await this.felhasznaloService.deleteUser(parseInt(id));

      res.json({
        success: true,
        message: 'Felhasználó sikeresen törölve'
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * POST /api/felhasznalos/admin
   * Create admin user (admin only)
   */
  async createAdminUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const userData = req.body;
      const adminUser = await this.felhasznaloService.createAdminUser(userData);

      res.status(201).json({
        success: true,
        data: adminUser,
        message: 'Admin felhasználó sikeresen létrehozva'
      });
    } catch (error) {
      if (error.message.includes('már foglalt')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * POST /api/felhasznalos/:id/password
   * Update user password
   */
  async updatePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { newPassword } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen felhasználó ID'
        });
      }

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'A jelszónak minimum 8 karakter hosszúnak kell lennie'
        });
      }

      const user = await this.felhasznaloService.updatePassword(parseInt(id), newPassword);

      res.json({
        success: true,
        data: user,
        message: 'Jelszó sikeresen frissítve'
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * POST /api/felhasznalos/:id/reset-password
   * Reset user password (admin only)
   */
  async resetPassword(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen felhasználó ID'
        });
      }

      const { user, newPassword } = await this.felhasznaloService.resetPassword(parseInt(id));

      res.json({
        success: true,
        data: {
          user,
          newPassword // Note: In production, this should not be returned
        },
        message: 'Jelszó sikeresen visszaállítva'
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * POST /api/felhasznalos/:id/make-admin
   * Make user admin (admin only)
   */
  async makeAdmin(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen felhasználó ID'
        });
      }

      const user = await this.felhasznaloService.updateUser(parseInt(id), { admin: true });

      res.json({
        success: true,
        data: user,
        message: 'Felhasználó sikeresen adminná változtatva'
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * POST /api/felhasznalos/:id/remove-admin
   * Remove admin rights from user (admin only)
   */
  async removeAdmin(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen felhasználó ID'
        });
      }

      const user = await this.felhasznaloService.updateUser(parseInt(id), { admin: false });

      res.json({
        success: true,
        data: user,
        message: 'Admin jogok sikeresen eltávolítva'
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }
  }
}

module.exports = FelhasznaloController;
