const ErtesitesService = require('../services/ErtesitesService');

/**
 * ErtesitesController
 * HTTP kérések kezelése az értesítésekhez
 */
class ErtesitesController {
  constructor(db) {
    this.db = db;
    this.ertesitesService = new ErtesitesService(db);
  }

  /**
   * GET /api/ertesitesek
   * Felhasználó értesítéseinek lekérése
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const isAdmin = req.user.admin;

      // Meghatározzuk a felhasználó típusát és ID-ját
      let cimzettId, cimzettTipus;

      if (isAdmin) {
        // Admin felhasználó
        cimzettId = userId;
        cimzettTipus = 'admin';
      } else {
        // Diák felhasználó - megkeressük a diak_id-t
        const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
        if (!felhasznalo || !felhasznalo.diak_id) {
          return res.status(400).json({
            success: false,
            error: 'A felhasználóhoz nem tartozik diák azonosító'
          });
        }
        cimzettId = felhasznalo.diak_id;
        cimzettTipus = 'diak';
      }

      // Lekérdezési opciók
      const options = {
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        tipus: req.query.tipus || null,
        olvasva: req.query.olvasva !== undefined ? req.query.olvasva === 'true' : null
      };

      const result = await this.ertesitesService.getUserNotifications(cimzettId, cimzettTipus, options);

      res.json(result);
    } catch (error) {
      console.error('Hiba az értesítések lekérésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az értesítések lekérésekor'
      });
    }
  }

  /**
   * GET /api/ertesitesek/unread-count
   * Olvasatlan értesítések számának lekérése
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      const isAdmin = req.user.admin;

      console.log(`[ErtesitesController] getUnreadCount hívás - userId: ${userId}, isAdmin: ${isAdmin}`);

      let cimzettId, cimzettTipus;

      if (isAdmin) {
        cimzettId = userId;
        cimzettTipus = 'admin';
        console.log(`[ErtesitesController] Admin felhasználó - cimzettId: ${cimzettId}`);
      } else {
        const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
        if (!felhasznalo || !felhasznalo.diak_id) {
          console.warn(`[ErtesitesController] Felhasználónak nincs diák_id-je - userId: ${userId}`);
          return res.status(400).json({
            success: false,
            error: 'A felhasználóhoz nem tartozik diák azonosító'
          });
        }
        cimzettId = felhasznalo.diak_id;
        cimzettTipus = 'diak';
        console.log(`[ErtesitesController] Diák felhasználó - cimzettId: ${cimzettId}`);
      }

      const result = await this.ertesitesService.getUnreadCount(cimzettId, cimzettTipus);

      res.json(result);
    } catch (error) {
      console.error('[ErtesitesController] Hiba az olvasatlan értesítések számolásakor:', error);
      console.error('[ErtesitesController] Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az olvasatlan értesítések számolásakor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /api/ertesitesek/:id/read
   * Értesítés olvasottnak jelölése
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const isAdmin = req.user.admin;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen értesítés ID'
        });
      }

      let cimzettId, cimzettTipus;

      if (isAdmin) {
        cimzettId = userId;
        cimzettTipus = 'admin';
      } else {
        const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
        if (!felhasznalo || !felhasznalo.diak_id) {
          return res.status(400).json({
            success: false,
            error: 'A felhasználóhoz nem tartozik diák azonosító'
          });
        }
        cimzettId = felhasznalo.diak_id;
        cimzettTipus = 'diak';
      }

      const result = await this.ertesitesService.markAsRead(parseInt(id), cimzettId, cimzettTipus);

      if (!result.success) {
        return res.status(403).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Hiba az értesítés olvasottnak jelölésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az értesítés olvasottnak jelölésekor'
      });
    }
  }

  /**
   * PUT /api/ertesitesek/read-all
   * Összes értesítés olvasottnak jelölése
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const isAdmin = req.user.admin;

      let cimzettId, cimzettTipus;

      if (isAdmin) {
        cimzettId = userId;
        cimzettTipus = 'admin';
      } else {
        const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
        if (!felhasznalo || !felhasznalo.diak_id) {
          return res.status(400).json({
            success: false,
            error: 'A felhasználóhoz nem tartozik diák azonosító'
          });
        }
        cimzettId = felhasznalo.diak_id;
        cimzettTipus = 'diak';
      }

      const result = await this.ertesitesService.markAllAsRead(cimzettId, cimzettTipus);

      res.json(result);
    } catch (error) {
      console.error('Hiba az összes értesítés olvasottnak jelölésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az összes értesítés olvasottnak jelölésekor'
      });
    }
  }

  /**
   * DELETE /api/ertesitesek/:id
   * Értesítés törlése
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const isAdmin = req.user.admin;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen értesítés ID'
        });
      }

      let cimzettId, cimzettTipus;

      if (isAdmin) {
        cimzettId = userId;
        cimzettTipus = 'admin';
      } else {
        const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
        if (!felhasznalo || !felhasznalo.diak_id) {
          return res.status(400).json({
            success: false,
            error: 'A felhasználóhoz nem tartozik diák azonosító'
          });
        }
        cimzettId = felhasznalo.diak_id;
        cimzettTipus = 'diak';
      }

      const result = await this.ertesitesService.deleteNotification(parseInt(id), cimzettId, cimzettTipus);

      if (!result.success) {
        return res.status(403).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Hiba az értesítés törlésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az értesítés törlésekor'
      });
    }
  }

  /**
   * POST /api/ertesitesek
   * Új értesítés/állomány közzététele (admin csak)
   */
  async createAnnouncement(req, res) {
    try {
      const { cimzett_tipus, cim, uzenet } = req.body;

      // Validáció
      if (!cim || !uzenet) {
        return res.status(400).json({
          success: false,
          error: 'A cím és üzenet mezők kötelezőek'
        });
      }

      if (!['diak', 'szulo', 'admin', 'mindenki'].includes(cimzett_tipus)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen címzett típus. Lehetséges értékek: diak, szulo, admin, mindenki'
        });
      }

      const result = await this.ertesitesService.sendBroadcastMessage(cimzett_tipus, cim, uzenet);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Hiba az állomány közzétételénél:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az állomány közzétételénél'
      });
    }
  }

  /**
   * POST /api/ertesitesek/custom
   * Egyéni értesítés küldése (admin csak)
   */
  async sendCustomNotification(req, res) {
    try {
      const { cimzett_id, cimzett_tipus, cim, uzenet, adat } = req.body;

      // Validáció
      if (!cimzett_id || !cimzett_tipus || !cim || !uzenet) {
        return res.status(400).json({
          success: false,
          error: 'A címzett_id, címzett_tipus, cím és üzenet mezők kötelezőek'
        });
      }

      if (!['diak', 'szulo', 'admin'].includes(cimzett_tipus)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen címzett típus. Lehetséges értékek: diak, szulo, admin'
        });
      }

      const result = await this.ertesitesService.sendCustomNotification(
        cimzett_id,
        cimzett_tipus,
        cim,
        uzenet,
        adat
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Értesítés sikeresen elküldve'
      });
    } catch (error) {
      console.error('Hiba az egyéni értesítés küldésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az egyéni értesítés küldésekor'
      });
    }
  }
}

module.exports = ErtesitesController;