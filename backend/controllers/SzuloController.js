const { validationResult } = require('express-validator');
const SzuloRepository = require('../repositories/SzuloRepository');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/AppError');

class SzuloController {
  constructor(db) {
    this.db = db;
    this.szuloRepository = new SzuloRepository(db);
  }

  /**
   * GET /api/szulos
   * Összes szülő lekérése
   */
  async getAllSzulos(req, res, next) {
    try {
      const {
        limit = 50,
        offset = 0,
        sort = 'nev',
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

      const szulos = await this.szuloRepository.findAll(options);

      res.json({
        success: true,
        data: szulos,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: szulos.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/szulos/:id
   * Egy szülő lekérése ID alapján
   */
  async getSzuloById(req, res, next) {
    try {
      const { id } = req.params;
      const { includeRelations = 'true' } = req.query;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen szülő ID');
      }

      const szulo = await this.szuloRepository.findById(parseInt(id), includeRelations !== 'false');

      if (!szulo) {
        throw new NotFoundError('Szülő');
      }

      res.json({
        success: true,
        data: szulo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/szulos
   * Új szülő létrehozása
   */
  async createSzulo(req, res, next) {
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

      const szuloData = req.body;
      const szulo = await this.szuloRepository.create(szuloData);

      res.status(201).json({
        success: true,
        data: szulo,
        message: 'Szülő sikeresen létrehozva'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/szulos/:id
   * Szülő frissítése
   */
  async updateSzulo(req, res, next) {
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
        throw new ValidationError('Érvénytelen szülő ID');
      }

      const szulo = await this.szuloRepository.update(parseInt(id), updates);

      res.json({
        success: true,
        data: szulo,
        message: 'Szülő sikeresen frissítve'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/szulos/:id
   * Szülő törlése
   */
  async deleteSzulo(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        throw new ValidationError('Érvénytelen szülő ID');
      }

      await this.szuloRepository.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Szülő sikeresen törölve'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SzuloController;
