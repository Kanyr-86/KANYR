const { validationResult } = require('express-validator');
const { NotFoundError, ValidationError } = require('../utils/AppError');

class SzobaController {
  constructor(db) {
    this.SzobaService = new (require('../services/SzobaService'))(db);
  }

  /**
   * Új szoba létrehozása
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async createSzoba(req, res, next) {
    try {
      // Validációs hibák ellenőrzése
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new ValidationError('Validációs hiba');
        error.details = errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }));
        throw error;
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
      next(error);
    }
  }

  /**
   * Szoba lekérdezése ID alapján
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async getSzobaById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen szoba ID');
      }

      const szoba = await this.SzobaService.getSzobaById(parseInt(id));

      if (!szoba) {
        throw new NotFoundError('Szoba');
      }

      res.json({
        success: true,
        data: szoba
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Szobák listázása
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async getAllSzobas(req, res, next) {
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
      next(error);
    }
  }

  /**
   * Szoba frissítése
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async updateSzoba(req, res, next) {
    try {
      // Validációs hibák ellenőrzése
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
      const updateData = req.body;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen szoba ID');
      }

      const updatedSzoba = await this.SzobaService.updateSzoba(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Szoba sikeresen frissítve',
        data: updatedSzoba
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Szoba törlése
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async deleteSzoba(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen szoba ID');
      }

      await this.SzobaService.deleteSzoba(parseInt(id));

      res.json({
        success: true,
        message: 'Szoba sikeresen törölve'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Szobában tartózkodó diákok listázása
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async getStudentsInRoom(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen szoba ID');
      }

      const students = await this.SzobaService.getStudentsInRoom(parseInt(id));

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Szoba statisztikák lekérdezése
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async getRoomStatistics(req, res, next) {
    try {
      const statistics = await this.SzobaService.getRoomStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Elérhető szobák listázása
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async getAvailableRooms(req, res, next) {
    try {
      const { limit, offset, sort, order, prefix } = req.query;

      const options = {
        limit: limit ? parseInt(limit) : 10,
        offset: offset ? parseInt(offset) : 0,
        sort: sort || 'szoba_id',
        order: order || 'ASC',
        prefix: prefix
      };

      const availableRooms = await this.SzobaService.getAvailableRooms(options);

      res.json({
        success: true,
        data: availableRooms
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Új beköltözés létrehozása
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async createBekoltozes(req, res, next) {
    try {
      // Validációs hibák ellenőrzése
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new ValidationError('Validációs hiba');
        error.details = errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }));
        throw error;
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
      next(error);
    }
  }

  /**
   * Szoba elfoglaltságának lekérdezése
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async getRoomOccupancy(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen szoba ID');
      }

      const occupancy = await this.SzobaService.getRoomOccupancy(parseInt(id));

      res.json({
        success: true,
        data: occupancy
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tömeges beköltözés létrehozása
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async createBulkBekoltozes(req, res, next) {
    try {
      // Validációs hibák ellenőrzése
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new ValidationError('Validációs hiba');
        error.details = errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }));
        throw error;
      }

      const { szoba_id, bekoltozes_datum, diak_ids } = req.body;

      const result = await this.SzobaService.createBulkBekoltozes({
        szoba_id,
        bekoltozes_datum,
        diak_ids
      });

      res.status(201).json({
        success: true,
        message: 'Tömeges beköltözés sikeresen végrehajtva',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Beköltözések lekérdezése szűréssel
   * @param {Object} req - Express request objektum
   * @param {Object} res - Express response objektum
   * @param {Function} next - Express next függvény
   */
  async getBekoltozesekWithFilters(req, res, next) {
    try {
      const { diakNev, szobaId, datumFrom, datumTo } = req.query;

      const filters = {};
      if (diakNev) filters.diakNev = diakNev;
      if (szobaId) filters.szobaId = parseInt(szobaId);
      if (datumFrom) filters.datumFrom = datumFrom;
      if (datumTo) filters.datumTo = datumTo;

      const bekoltozesek = await this.SzobaService.getBekoltozesekWithFilters(filters);

      res.json({
        success: true,
        data: bekoltozesek
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SzobaController;
