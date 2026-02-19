const { Op } = require('sequelize');

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
      const diak = await this.db.Diak.findByPk(diakId, {
        include: [{
          model: this.db.SzobaBekoltozes,
          as: 'bekoltozesek',
          include: [{
            model: this.db.Szoba,
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
          model: this.db.Diak,
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
      const diak = await this.db.Diak.findByPk(diakId, {
        include: [{
          model: this.db.SzobaBekoltozes,
          as: 'bekoltozesek',
          include: [{
            model: this.db.Szoba,
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
      const kivantSzoba = await this.db.Szoba.findByPk(kivant_szoba_id);
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
      
      const existingRequests = await this.db.SzobaValtoztatas.count({
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
      const ujKerelem = await this.db.SzobaValtoztatas.create({
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

      const kerelemek = await this.db.SzobaValtoztatas.findAll({
        where: whereClause,
        include: [
          {
            model: this.db.Diak,
            as: 'diak',
            attributes: ['nev', 'email', 'telefonszam']
          },
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

      const kerelem = await this.db.SzobaValtoztatas.findByPk(id);
      if (!kerelem) {
        return res.status(404).json({
          success: false,
          error: 'Szobaváltási kérelem nem található'
        });
      }

      if (kerelem.statusz !== 'pending') {
        return res.status(400).json({
          success: false,
          error: `A kérelem már ${kerelem.statusz} státuszban van, nem módosítható`
        });
      }

      // Ha jóváhagyják, akkor ténylegesen át kell költöztetni a diákot
      if (statusz === 'approved') {
        await this.db.sequelize.transaction({
          isolationLevel: this.db.sequelize.constructor.Transaction.ISOLATION_LEVELS.SERIALIZABLE
        }, async (transaction) => {
          const today = new Date().toISOString().split('T')[0];

          // 1. Régi aktív beköltözés lezárása
          const activeBekoltozes = await this.db.SzobaBekoltozes.findOne({
            where: {
              diak_id: kerelem.diak_id,
              kikoltozes_datum: null
            },
            transaction
          });

          if (activeBekoltozes) {
            await activeBekoltozes.update({ kikoltozes_datum: today }, { transaction });
          }

          // 2. Ellenőrzés: a kívánt szoba nem telt-e meg azóta (LOCK során)
          // LOCK-okkal biztosítjuk, hogy ne legyen race condition
          const kivantSzoba = await this.db.Szoba.findByPk(kerelem.kivant_szoba_id, {
            transaction,
            lock: transaction.LOCK.UPDATE
          });
          if (!kivantSzoba) {
            throw new Error('A kívánt szoba nem található');
          }

          const currentOccupancy = await this.db.SzobaBekoltozes.count({
            where: {
              szoba_id: kerelem.kivant_szoba_id,
              kikoltozes_datum: null
            },
            transaction
          });

          if (currentOccupancy >= kivantSzoba.osszes_hely) {
            throw new Error('A kívánt szoba időközben megtelt, a kérelem nem hajtható végre');
          }

          // 3. Új beköltözés létrehozása a kívánt szobába
          await this.db.SzobaBekoltozes.create({
            diak_id: kerelem.diak_id,
            szoba_id: kerelem.kivant_szoba_id,
            bekoltozes_datum: today,
            kikoltozes_datum: null
          }, { transaction });

          // 4. Kérelem státuszának frissítése
          await kerelem.update({ statusz: 'approved' }, { transaction });

          // 5. Értesítés létrehozása a diáknak
          const kivantSzobaInfo = await this.db.Szoba.findByPk(kerelem.kivant_szoba_id, { transaction });
          await this.db.Notification.create({
            diak_id: kerelem.diak_id,
            szoba_valtoztatas_id: kerelem.valtoztatas_id,
            tipus: 'room_change_approved',
            uzenet: `Szobaváltási kérelme jóváhagyva lett. Új szobája: ${kivantSzobaInfo ? kivantSzobaInfo.szoba_szama : kerelem.kivant_szoba_id}`
          }, { transaction });
        });
      } else {
        // Elutasítás esetén csak a státusz változik
        await kerelem.update({ statusz: 'denied' });

        // Értesítés létrehozása a diáknak
        await this.db.Notification.create({
          diak_id: kerelem.diak_id,
          szoba_valtoztatas_id: kerelem.valtoztatas_id,
          tipus: 'room_change_denied',
          uzenet: 'Szobaváltási kérelme elutasítva lett.'
        });
      }

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
        error: error.message || 'Hiba történt a szobaváltási kérelem frissítésekor'
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

      const tortenet = await this.db.SzobaValtoztatas.findAll({
        where: {
          diak_id: diakId
        },
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

      const notifications = await this.db.Notification.findAll({
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

  // Admin értesítéseinek lekérése
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

  // Admin értesítésének megjelölése olvasottnak
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
