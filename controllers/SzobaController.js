const { validationResult } = require('express-validator');

class SzobaController {
  constructor(db) {
    this.SzobaService = new (require('../services/SzobaService'))(db);
  }

  /**
   * Új szoba létrehozása
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   */
  async createSzoba(req, res) {
    try {
      // Validációs hibák ellenőrzése
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { szoba_szama, osszes_hely } = req.body;

      const newSzoba = await this.SzobaService.createSzoba({
        szoba_szama,
        osszes_hely
      });

      res.status(201).json({
        success: true,
        message: 'Szoba sikeresen létrehozva',
        data: newSzoba
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Szoba lekérdezése ID alapján
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   */
  async getSzobaById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Érvénytelen szoba ID'
        });
      }

      const szoba = await this.SzobaService.getSzobaById(parseInt(id));

      if (!szoba) {
        return res.status(404).json({
          success: false,
          message: 'Szoba nem található'
        });
      }

      res.json({
        success: true,
        data: szoba
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Szobák listázása
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   */
  async getAllSzobas(req, res) {
    try {
      const { limit, offset, sort, order, prefix } = req.query;

      const options = {
        limit: limit ? parseInt(limit) : 10,
        offset: offset ? parseInt(offset) : 0,
        sort: sort || 'szoba_id',
        order: order || 'ASC',
        prefix: prefix
      };

      const szobas = await this.SzobaService.getAllSzobas(options);

      res.json({
        success: true,
        data: szobas
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Szoba frissítése
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   */
  async updateSzoba(req, res) {
    try {
      // Validációs hibák ellenőrzése
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Érvénytelen szoba ID'
        });
      }

      const updatedSzoba = await this.SzobaService.updateSzoba(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Szoba sikeresen frissítve',
        data: updatedSzoba
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Szoba törlése
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   */
  async deleteSzoba(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Érvénytelen szoba ID'
        });
      }

      const result = await this.SzobaService.deleteSzoba(parseInt(id));

      res.json({
        success: true,
        message: 'Szoba sikeresen törölve',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Szobában tartózkodó diákok listázása
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   */
  async getStudentsInRoom(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Érvénytelen szoba ID'
        });
      }

      const students = await this.SzobaService.getStudentsInRoom(parseInt(id));

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Szoba statisztikák lekérdezése
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   */
  async getRoomStatistics(req, res) {
    try {
      const statistics = await this.SzobaService.getRoomStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Új beköltözés létrehozása
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   */
  async createBekoltozes(req, res) {
    try {
      // Validációs hibák ellenőrzése
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { diak_id, szoba_id, bekoltozes_datum } = req.body;

      const newBekoltozes = await this.SzobaService.createBekoltozes({
        diak_id,
        szoba_id,
        bekoltozes_datum
      });

      res.status(201).json({
        success: true,
        message: 'Beköltözés sikeresen létrehozva',
        data: newBekoltozes
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = SzobaController;
