const { validationResult } = require('express-validator');
const LakcimRepository = require('../repositories/LakcimRepository');
const { NotFoundError, ValidationError } = require('../utils/AppError');

class LakcimController {
  constructor(db) {
    this.db = db;
    this.lakcimRepository = new LakcimRepository(db);
  }

  /**
   * GET /api/lakcims
   * Összes lakcím lekérése
   */
  async getAllLakcims(req, res, next) {
    try {
      const {
        limit = 50,
        offset = 0,
        sort = 'varos',
        order = 'ASC',
        includeRelations = 'true'
      } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sort,
        order,
        includeRelations: includeRelations !== 'false'
      };

      const lakcims = await this.lakcimRepository.findAll(options);

      res.json({
        success: true,
        data: lakcims,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: lakcims.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lakcims/:id
   * Egy lakcím lekérése ID alapján
   */
  async getLakcimById(req, res, next) {
    try {
      const { id } = req.params;
      const { includeRelations = 'true' } = req.query;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen lakcím ID');
      }

      const lakcim = await this.lakcimRepository.findById(parseInt(id), includeRelations !== 'false');

      if (!lakcim) {
        throw new NotFoundError('Lakcím');
      }

      res.json({
        success: true,
        data: lakcim
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/lakcims
   * Új lakcím létrehozása
   */
  async createLakcim(req, res, next) {
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

      const lakcimData = req.body;
      const lakcim = await this.lakcimRepository.create(lakcimData);

      res.status(201).json({
        success: true,
        data: lakcim,
        message: 'Lakcím sikeresen létrehozva'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/lakcims/:id
   * Lakcím frissítése
   */
  async updateLakcim(req, res, next) {
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
        throw new ValidationError('Érvénytelen lakcím ID');
      }

      const lakcim = await this.lakcimRepository.update(parseInt(id), updates);

      res.json({
        success: true,
        data: lakcim,
        message: 'Lakcím sikeresen frissítve'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/lakcims/:id
   * Lakcím törlése
   */
  async deleteLakcim(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen lakcím ID');
      }

      await this.lakcimRepository.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Lakcím sikeresen törölve'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lakcims/city/:varos
   * Lakcímek keresése város alapján
   */
  async getLakcimsByCity(req, res, next) {
    try {
      const { varos } = req.params;

      if (!varos) {
        throw new ValidationError('Város paraméter kötelező');
      }

      const lakcims = await this.lakcimRepository.findByCity(varos);

      res.json({
        success: true,
        data: lakcims,
        count: lakcims.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LakcimController;
