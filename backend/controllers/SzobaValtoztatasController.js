const { Op } = require('sequelize');
const { Diak, Szoba, SzobaValtoztatas, Notification } = require('../models');

class SzobaValtoztatasController {
  constructor(db) {
    this.db = db;
  }

  // Diák szobájának és szobatársainak lekérése
  async getCurrentRoom(req, res) {
    try {
      const userId = req.user.userId; // Felhasznalo.user_id
      
      // Először lekérjük a felhasználóhoz tartozó diák ID-t
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        return res.status(404).json({
          success: false,
          error: 'A felhasználóhoz nem tartozik diák'
        });
      }
      
      const diakId = felhasznalo.diak_id;
      
      // Diák aktuális szobájának lekérése
      const diak = await Diak.findByPk(diakId, {
        include: [{
          model: this.db.SzobaBekoltozes,
          as: 'bekoltozesek',
          include: [{
            model: Szoba,
            as: 'szoba'
          }],
          where: {
            kikoltozes_datum: null
          },
          required: false
        }]
      });

      if (!diak) {
        return res.status(404).json({
          success: false,
          error: 'Diák nem található'
        });
      }

      // Ellenőrizzük, hogy van-e aktív beköltözése
      const aktivalisBekoltozes = diak.bekoltozesek[0];
      if (!aktivalisBekoltozes) {
        return res.status(404).json({
          success: false,
          error: 'A diáknak nincs aktív szobája'
        });
      }

      const aktualisSzoba = aktivalisBekoltozes.szoba;

      // Szobatársak lekérése
      const szobatarsak = await this.db.SzobaBekoltozes.findAll({
        include: [{
          model: Diak,
          as: 'diak',
          attributes: ['nev', 'email', 'telefonszam']
        }],
        where: {
          szoba_id: aktualisSzoba.szoba_id,
          kikoltozes_datum: null,
          diak_id: {
            [Op.ne]: diakId
          }
        }
      });

      res.json({
        success: true,
        data: {
          diak: {
            nev: diak.nev,
            email: diak.email,
            telefonszam: diak.telefonszam
          },
          szoba: {
            szoba_szama: aktualisSzoba.szoba_szama,
            osszes_hely: aktualisSzoba.osszes_hely
          },
          szobatarsak: szobatarsak.map(tars => ({
            nev: tars.diak.nev,
            email: tars.diak.email,
            telefonszam: tars.diak.telefonszam
          }))
        }
      });
    } catch (error) {
      console.error('Hiba a szoba lekérésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt a szoba adatainak lekérésekor'
      });
    }
  }

  // Szobaváltási kérelem benyújtása
  async requestRoomChange(req, res) {
    try {
      const userId = req.user.userId; // Felhasznalo.user_id
      
      // Először lekérjük a felhasználóhoz tartozó diák ID-t
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        return res.status(404).json({
          success: false,
          error: 'A felhasználóhoz nem tartozik diák'
        });
      }
      
      const diakId = felhasznalo.diak_id;
      const { kivant_szoba_id, indok } = req.body;

      // Ellenőrizzük, hogy a diák már van-e szobában
      const diak = await Diak.findByPk(diakId, {
        include: [{
          model: this.db.SzobaBekoltozes,
          as: 'bekoltozesek',
          include: [{
            model: Szoba,
            as: 'szoba'
          }],
          where: {
            kikoltozes_datum: null
          },
          required: false
        }]
      });

      if (!diak) {
        return res.status(404).json({
          success: false,
          error: 'Diák nem található'
        });
      }

      // Ellenőrizzük, hogy van-e aktív beköltözése
      const aktivalisBekoltozes = diak.bekoltozesek[0];
      if (!aktivalisBekoltozes) {
        return res.status(400).json({
          success: false,
          error: 'A diák jelenleg nincs szobában'
        });
      }

      const aktualisSzoba = aktivalisBekoltozes.szoba;

      // Ellenőrizzük, hogy a kívánt szoba létezik-e
      const kivantSzoba = await Szoba.findByPk(kivant_szoba_id);
      if (!kivantSzoba) {
        return res.status(404).json({
          success: false,
          error: 'A kívánt szoba nem található'
        });
      }

      // Ellenőrizzük, hogy a diák nem próbál-e ugyanabba a szobába költözni
      if (kivantSzoba.szoba_id === aktualisSzoba.szoba_id) {
        return res.status(400).json({
          success: false,
          error: 'A diák már ebben a szobában lakik'
        });
      }

      // Ellenőrizzük a szobaváltási korlátot (3 alkalom félévenként)
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;
      
      const existingRequests = await SzobaValtoztatas.count({
        where: {
          diak_id: diakId,
          academic_year: academicYear,
          statusz: {
            [Op.in]: ['pending', 'approved']
          }
        }
      });

      if (existingRequests >= 3) {
        return res.status(400).json({
          success: false,
          error: 'A diák elérte a félévi szobaváltási korlátot (3 alkalom)'
        });
      }

      // Új szobaváltási kérelem létrehozása
      const ujKerelem = await SzobaValtoztatas.create({
        diak_id: diakId,
        jelenlegi_szoba_id: aktualisSzoba.szoba_id,
        kivant_szoba_id: kivantSzoba.szoba_id,
        indok: indok || null,
        academic_year: academicYear,
        semester_count: existingRequests + 1
      });

      res.status(201).json({
        success: true,
        data: {
          valtoztatas_id: ujKerelem.valtoztatas_id,
          statusz: ujKerelem.statusz,
          indok: ujKerelem.indok,
          created_at: ujKerelem.created_at
        }
      });
    } catch (error) {
      console.error('Hiba a szobaváltási kérelem benyújtásakor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt a szobaváltási kérelem benyújtásakor'
      });
    }
  }

  // Szobaváltási kérelmek listázása (titkár számára)
  async getRoomChangeRequests(req, res) {
    try {
      const { status } = req.query;
      
      const whereClause = {};
      if (status) {
        whereClause.statusz = status;
      }

      const kerelemek = await SzobaValtoztatas.findAll({
        where: whereClause,
        include: [
          {
            model: Diak,
            as: 'diak',
            attributes: ['nev', 'email', 'telefonszam']
          },
          {
            model: Szoba,
            as: 'jelenlegi_szoba',
            attributes: ['szoba_szama']
          },
          {
            model: Szoba,
            as: 'kivant_szoba',
            attributes: ['szoba_szama']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: kerelemek
      });
    } catch (error) {
      console.error('Hiba a szobaváltási kérelmek lekérésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt a szobaváltási kérelmek lekérésekor'
      });
    }
  }

  // Szobaváltási kérelem jóváhagyása vagy elutasítása (titkár számára)
  async updateRoomChangeRequest(req, res) {
    try {
      const { id } = req.params;
      const { statusz } = req.body;

      if (!['approved', 'denied'].includes(statusz)) {
        return res.status(400).json({
          success: false,
          error: 'Érvénytelen státusz: csak "approved" vagy "denied" lehet'
        });
      }

      const kerelem = await SzobaValtoztatas.findByPk(id);
      if (!kerelem) {
        return res.status(404).json({
          success: false,
          error: 'Szobaváltási kérelem nem található'
        });
      }

      // Ha jóváhagyják, akkor át kell költöztetni a diákot
      if (statusz === 'approved') {
        // Diák átköltöztetése az új szobába
        // (Ez a logika itt lenne, de most csak a státuszt változtatjuk)
      }

      kerelem.statusz = statusz;
      await kerelem.save();

      // Értesítés létrehozása a diáknak
      const uzenet = statusz === 'approved' 
        ? `Szobaváltási kérelme jóváhagyva lett. Kívánt szobája: ${kerelem.kivant_szoba_id}`
        : `Szobaváltási kérelme elutasítva lett.`;

      await Notification.create({
        diak_id: kerelem.diak_id,
        szoba_valtoztatas_id: kerelem.valtoztatas_id,
        tipus: statusz === 'approved' ? 'room_change_approved' : 'room_change_denied',
        uzenet: uzenet
      });

      res.json({
        success: true,
        data: {
          valtoztatas_id: kerelem.valtoztatas_id,
          statusz: kerelem.statusz,
          updated_at: kerelem.updated_at
        }
      });
    } catch (error) {
      console.error('Hiba a szobaváltási kérelem frissítésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt a szobaváltási kérelem frissítésekor'
      });
    }
  }

  // Diák szobaváltási történetének lekérése
  async getRoomChangeHistory(req, res) {
    try {
      const userId = req.user.userId; // Felhasznalo.user_id
      
      // Először lekérjük a felhasználóhoz tartozó diák ID-t
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        return res.status(404).json({
          success: false,
          error: 'A felhasználóhoz nem tartozik diák'
        });
      }
      
      const diakId = felhasznalo.diak_id;

      const tortenet = await SzobaValtoztatas.findAll({
        where: {
          diak_id: diakId
        },
        include: [
          {
            model: Szoba,
            as: 'jelenlegi_szoba',
            attributes: ['szoba_szama']
          },
          {
            model: Szoba,
            as: 'kivant_szoba',
            attributes: ['szoba_szama']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: tortenet
      });
    } catch (error) {
      console.error('Hiba a szobaváltási történet lekérésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt a szobaváltási történet lekérésekor'
      });
    }
  }

  // Diák értesítéseinek lekérése
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId; // Felhasznalo.user_id
      
      // Először lekérjük a felhasználóhoz tartozó diák ID-t
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        return res.status(404).json({
          success: false,
          error: 'A felhasználóhoz nem tartozik diák'
        });
      }
      
      const diakId = felhasznalo.diak_id;

      const notifications = await Notification.findAll({
        where: {
          diak_id: diakId
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

  // Diák értesítésének megjelölése olvasottnak
  async markNotificationAsRead(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findByPk(id);
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
      console.error('Hiba az értesítés olvasottnak jelölésekor:', error);
      res.status(500).json({
        success: false,
        error: 'Hiba történt az értesítés olvasottnak jelölésekor'
      });
    }
  }

  // Admin értesítéseinek lekérése
  async getAdminNotifications(req, res) {
    try {
      const notifications = await Notification.findAll({
        include: [
          {
            model: this.db.Diak,
            as: 'diak',
            attributes: ['nev', 'email', 'telefonszam']
          },
          {
            model: SzobaValtoztatas,
            as: 'szoba_valtoztatas',
            include: [
              {
                model: Szoba,
                as: 'jelenlegi_szoba',
                attributes: ['szoba_szama']
              },
              {
                model: Szoba,
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

  // Admin értesítésének megjelölése olvasottnak
  async markNotificationAsReadByAdmin(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findByPk(id);
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
