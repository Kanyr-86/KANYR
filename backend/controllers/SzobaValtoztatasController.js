const SzobaValtoztatasRepository = require('../repositories/SzobaValtoztatasRepository');
const SzobaValtoztatasService = require('../services/SzobaValtoztatasService');

/**
 * SzobaValtoztatas Controller
 * HTTP kérések kezelése a szobaváltási kérelmekhez
 */
class SzobaValtoztatasController {
  constructor(db) {
    const repository = new SzobaValtoztatasRepository(db);
    this.service = new SzobaValtoztatasService(repository, db);
    this.db = db;
  }

  /**
   * Diák szobájának és szobatársainak lekérése
   * GET /api/szobavaltoztatas/students/room
   */
  async getCurrentRoom(req, res) {
    try {
      const userId = req.user.userId;
      
      // Felhasználóhoz tartozó diák ID lekérése
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        return res.status(404).json({
          success: false,
          error: 'A felhasználóhoz nem tartozik diák'
        });
      }
      
      const result = await this.service.getCurrentRoom(felhasznalo.diak_id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Hiba a szoba lekérésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt a szoba adatainak lekérésekor'
      });
    }
  }

  /**
   * Szobaváltási kérelem benyújtása
   * POST /api/szobavaltoztatas/students/room-change
   */
  async requestRoomChange(req, res) {
    try {
      const userId = req.user.userId;
      
      // Felhasználóhoz tartozó diák ID lekérése
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        return res.status(404).json({
          success: false,
          error: 'A felhasználóhoz nem tartozik diák'
        });
      }
      
      const { kivant_szoba_id, indok } = req.body;
      const result = await this.service.submitRoomChangeRequest(
        felhasznalo.diak_id,
        kivant_szoba_id,
        indok
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Hiba a szobaváltási kérelem benyújtásakor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt a szobaváltási kérelem benyújtásakor'
      });
    }
  }

  /**
   * Szobaváltási kérelmek listázása (admin számára)
   * GET /api/szobavaltoztatas/students/room-change-requests
   */
  async getRoomChangeRequests(req, res) {
    try {
      const { status } = req.query;
      const result = await this.service.getAllRequests(status);
      res.json(result);
    } catch (error) {
      console.error('Hiba a szobaváltási kérelmek lekérésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt a szobaváltási kérelmek lekérésekor'
      });
    }
  }

  /**
   * Szobaváltási kérelem jóváhagyása
   * PUT /api/szobavaltoztatas/:id/approve
   */
  async approveRoomChangeRequest(req, res) {
    try {
      const { id } = req.params;
      const result = await this.service.approveRequest(id);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Hiba a szobaváltási kérelem jóváhagyásakor:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Hiba történt a szobaváltási kérelem jóváhagyásakor'
      });
    }
  }

  /**
   * Szobaváltási kérelem elutasítása
   * PUT /api/szobavaltoztatas/:id/reject
   */
  async rejectRoomChangeRequest(req, res) {
    try {
      const { id } = req.params;
      const { indok } = req.body;
      
      const result = await this.service.rejectRequest(id, indok);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Hiba a szobaváltási kérelem elutasításakor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt a szobaváltási kérelem elutasításakor'
      });
    }
  }

  /**
   * Szobaváltási kérelem jóváhagyása vagy elutasítása (régi végpont - kompatibilitásért)
   * PUT /api/szobavaltoztatas/students/room-change-requests/:id
   */
  async updateRoomChangeRequest(req, res) {
    try {
      const { id } = req.params;
      const { statusz, indok } = req.body;

      if (statusz === 'approved') {
        return await this.approveRoomChangeRequest(req, res);
      } else if (statusz === 'denied') {
        return await this.rejectRoomChangeRequest(req, res);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen státusz: csak "approved" vagy "denied" lehet'
        });
      }
    } catch (error) {
      console.error('Hiba a szobaváltási kérelem frissítésekor:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Hiba történt a szobaváltási kérelem frissítésekor'
      });
    }
  }

  /**
   * Diák szobaváltási történetének lekérése
   * GET /api/szobavaltoztatas/students/room-history
   */
  async getRoomChangeHistory(req, res) {
    try {
      const userId = req.user.userId;
      
      // Felhasználóhoz tartozó diák ID lekérése
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        return res.status(404).json({
          success: false,
          error: 'A felhasználóhoz nem tartozik diák'
        });
      }
      
      const result = await this.service.getHistoryByDiak(felhasznalo.diak_id);
      res.json(result);
    } catch (error) {
      console.error('Hiba a szobaváltási történet lekérésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt a szobaváltási történet lekérésekor'
      });
    }
  }

  /**
   * Diák értesítéseinek lekérése
   * GET /api/szobavaltoztatas/students/notifications
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      
      // Felhasználóhoz tartozó diák ID lekérése
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        return res.status(404).json({
          success: false,
          error: 'A felhasználóhoz nem tartozik diák'
        });
      }
      
      const notifications = await this.db.Notification.findAll({
        where: {
          diak_id: felhasznalo.diak_id
        },
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Hiba az értesítések lekérésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az értesítések lekérésekor'
      });
    }
  }

  /**
   * Diák értesítésének megjelölése olvasottnak
   * PUT /api/szobavaltoztatas/students/notifications/:id/read
   */
  async markNotificationAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Felhasználóhoz tartozó diák ID lekérése
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        return res.status(403).json({
          success: false,
          error: 'A felhasználóhoz nem tartozik diák'
        });
      }

      const notification = await this.db.Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Értesítés nem található'
        });
      }

      // Tulajdonjog ellenőrzése
      if (notification.diak_id !== felhasznalo.diak_id) {
        return res.status(403).json({
          success: false,
          error: 'Nincs jogosultsága az értesítés olvasásához'
        });
      }

      notification.elolvasva = true;
      await notification.save();

      res.json({
        success: true,
        data: {
          notification_id: notification.notification_id,
          elolvasva: notification.elolvasva,
          updated_at: notification.updated_at
        }
      });
    } catch (error) {
      console.error('Hiba az értesítés olvasottnak jelölésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az értesítés olvasottnak jelölésekor'
      });
    }
  }

  /**
   * Admin értesítéseinek lekérése
   * GET /api/szobavaltoztatas/admin/notifications
   */
  async getAdminNotifications(req, res) {
    try {
      const notifications = await this.db.Notification.findAll({
        include: [
          {
            model: this.db.Diak,
            as: 'diak',
            attributes: ['nev', 'email', 'telefonszam']
          },
          {
            model: this.db.SzobaValtoztatas,
            as: 'szoba_valtoztatas',
            include: [
              {
                model: this.db.Szoba,
                as: 'jelenlegi_szoba',
                attributes: ['szoba_szama']
              },
              {
                model: this.db.Szoba,
                as: 'kivant_szoba',
                attributes: ['szoba_szama']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Hiba az admin értesítések lekérésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az admin értesítések lekérésekor'
      });
    }
  }

  /**
   * Admin értesítésének megjelölése olvasottnak
   * PUT /api/szobavaltoztatas/admin/notifications/:id/read
   */
  async markNotificationAsReadByAdmin(req, res) {
    try {
      const { id } = req.params;

      const notification = await this.db.Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Értesítés nem található'
        });
      }

      notification.elolvasva = true;
      await notification.save();

      res.json({
        success: true,
        data: {
          notification_id: notification.notification_id,
          elolvasva: notification.elolvasva,
          updated_at: notification.updated_at
        }
      });
    } catch (error) {
      console.error('Hiba az admin értesítés olvasottnak jelölésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az admin értesítés olvasottnak jelölésekor'
      });
    }
  }
}

module.exports = SzobaValtoztatasController;