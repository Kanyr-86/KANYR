const { validationResult } = require('express-validator');
const SzuloRepository = require('../repositories/SzuloRepository');

class SzuloController {
  constructor(db) {
    console.log('SzuloController constructor called with db:', db ? 'db object exists' : 'db is null/undefined');
    console.log('Available models in db:', db ? Object.keys(db).filter(key => key !== 'sequelize') : 'no db');

    this.db = db;
    this.szuloRepository = new SzuloRepository(db);
    console.log('SzuloRepository created:', this.szuloRepository ? 'success' : 'failed');
  }

  /**
   * GET /api/szulos
   * Összes szülő lekérése
   */
  async getAllSzulos(req, res) {
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
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/szulos/:id
   * Egy szülő lekérése ID alapján
   */
  async getSzuloById(req, res) {
    try {
      const { id } = req.params;
      const { includeRelations = 'true' } = req.query;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen szülő ID'
        });
      }

      const szulo = await this.szuloRepository.findById(parseInt(id), includeRelations !== 'false');

      if (!szulo) {
        return res.status(404).json({
          success: false,
          error: 'A szülő nem található'
        });
      }

      res.json({
        success: true,
        data: szulo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/szulos
   * Új szülő létrehozása
   */
  async createSzulo(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const szuloData = req.body;
      const szulo = await this.szuloRepository.create(szuloData);

      res.status(201).json({
        success: true,
        data: szulo,
        message: 'Szülő sikeresen létrehozva'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/szulos/:id
   * Szülő frissítése
   */
  async updateSzulo(req, res) {
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
          error: 'Érvénytelen szülő ID'
        });
      }

      const szulo = await this.szuloRepository.update(parseInt(id), updates);

      res.json({
        success: true,
        data: szulo,
        message: 'Szülő sikeresen frissítve'
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
   * DELETE /api/szulos/:id
   * Szülő törlése
   */
  async deleteSzulo(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen szülő ID'
        });
      }

      await this.szuloRepository.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Szülő sikeresen törölve'
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error.message.includes('kapcsolódó diákjai')) {
        res.status(400).json({
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
}

module.exports = SzuloController;