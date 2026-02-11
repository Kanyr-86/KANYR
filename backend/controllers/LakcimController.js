const { validationResult } = require('express-validator');
const LakcimRepository = require('../repositories/LakcimRepository');

class LakcimController {
  constructor(db) {
    this.db = db;
    this.lakcimRepository = new LakcimRepository(db);
  }

  /**
   * GET /api/lakcims
   * Összes lakcím lekérése
   */
  async getAllLakcims(req, res) {
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
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/lakcims/:id
   * Egy lakcím lekérése ID alapján
   */
  async getLakcimById(req, res) {
    try {
      const { id } = req.params;
      const { includeRelations = 'true' } = req.query;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen lakcím ID'
        });
      }

      const lakcim = await this.lakcimRepository.findById(parseInt(id), includeRelations !== 'false');

      if (!lakcim) {
        return res.status(404).json({
          success: false,
          error: 'A lakcím nem található'
        });
      }

      res.json({
        success: true,
        data: lakcim
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/lakcims
   * Új lakcím létrehozása
   */
  async createLakcim(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validációs hiba',
          details: errors.array()
        });
      }

      const lakcimData = req.body;
      const lakcim = await this.lakcimRepository.create(lakcimData);

      res.status(201).json({
        success: true,
        data: lakcim,
        message: 'Lakcím sikeresen létrehozva'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/lakcims/:id
   * Lakcím frissítése
   */
  async updateLakcim(req, res) {
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
          error: 'Érvénytelen lakcím ID'
        });
      }

      const lakcim = await this.lakcimRepository.update(parseInt(id), updates);

      res.json({
        success: true,
        data: lakcim,
        message: 'Lakcím sikeresen frissítve'
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
   * DELETE /api/lakcims/:id
   * Lakcím törlése
   */
  async deleteLakcim(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen lakcím ID'
        });
      }

      await this.lakcimRepository.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Lakcím sikeresen törölve'
      });
    } catch (error) {
      if (error.message.includes('nem található')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error.message.includes('kapcsolódó diákjai vagy szülei')) {
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

  /**
   * GET /api/lakcims/city/:varos
   * Lakcímek keresése város alapján
   */
  async getLakcimsByCity(req, res) {
    try {
      const { varos } = req.params;

      if (!varos) {
        return res.status(400).json({
          success: false,
          error: 'Város paraméter kötelező'
        });
      }

      const lakcims = await this.lakcimRepository.findByCity(varos);

      res.json({
        success: true,
        data: lakcims,
        count: lakcims.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = LakcimController;