const { Op } = require('sequelize');
const { NotFoundError, ValidationError, ConflictError, ForbiddenError } = require('../utils/AppError');

class SzobaValtoztatasController {
  constructor(db) {
    this.db = db;
  }

  // Diák szobájának és szobatársainak lekérése
  async getCurrentRoom(req, res, next) {
    try {
      const userId = req.user.userId; // Felhasznalo.user_id
      
      // Először lekérjük a felhasználóhoz tartozó diák ID-t
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        throw new NotFoundError('A felhasználóhoz nem tartozik diák');
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
        throw new NotFoundError('Diák');
      }

      // Ellenőrizzük, hogy van-e aktív beköltözése
      const aktivalisBekoltozes = diak.bekoltozesek[0];
      if (!aktivalisBekoltozes) {
        throw new NotFoundError('A diáknak nincs aktív szobája');
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
      next(error);
    }
  }

  // Szobaváltási kérelem benyújtása
  async requestRoomChange(req, res, next) {
    try {
      const userId = req.user.userId; // Felhasznalo.user_id
      
      // Először lekérjük a felhasználóhoz tartozó diák ID-t
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        throw new NotFoundError('A felhasználóhoz nem tartozik diák');
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
        throw new NotFoundError('Diák');
      }

      // Ellenőrizzük, hogy van-e aktív beköltözése
      const aktivalisBekoltozes = diak.bekoltozesek[0];
      if (!aktivalisBekoltozes) {
        throw new ValidationError('A diák jelenleg nincs szobában');
      }

      const aktualisSzoba = aktivalisBekoltozes.szoba;

      // Ellenőrizzük, hogy a kívánt szoba létezik-e
      const kivantSzoba = await this.db.Szoba.findByPk(kivant_szoba_id);
      if (!kivantSzoba) {
        throw new NotFoundError('A kívánt szoba');
      }

      // Ellenőrizzük, hogy a diák nem próbál-e ugyanabba a szobába költözni
      if (kivantSzoba.szoba_id === aktualisSzoba.szoba_id) {
        throw new ValidationError('A diák már ebben a szobában lakik');
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
        throw new ConflictError('A diák elérte a félévi szobaváltási korlátot (3 alkalom)');
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

      // Értesítés létrehozása az adminnak
      await this.db.Notification.create({
        diak_id: diakId,
        szoba_valtoztatas_id: ujKerelem.valtoztatas_id,
        tipus: 'room_change_pending',
        cimzettkor: 'admin',
        prioritas: 'medium',
        uzenet: `${diak.nev} szobaváltási kérelmet nyújtott be. Jelenlegi szoba: ${aktualisSzoba.szoba_szama}, Kívánt szoba: ${kivantSzoba.szoba_szama}`
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
      next(error);
    }
  }

  // Szobaváltási kérelmek listázása (titkár számára)
  async getRoomChangeRequests(req, res, next) {
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
      next(error);
    }
  }

  // Szobaváltási kérelem jóváhagyása vagy elutasítása (titkár számára)
  async updateRoomChangeRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { statusz } = req.body;

      if (!['approved', 'denied'].includes(statusz)) {
        throw new ValidationError('Érvénytelen státusz: csak "approved" vagy "denied" lehet');
      }

      const kerelem = await this.db.SzobaValtoztatas.findByPk(id);
      if (!kerelem) {
        throw new NotFoundError('Szobaváltási kérelem');
      }

      if (kerelem.statusz !== 'pending') {
        throw new ConflictError(`A kérelem már ${kerelem.statusz} státuszban van, nem módosítható`);
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
            throw new NotFoundError('A kívánt szoba');
          }

          const currentOccupancy = await this.db.SzobaBekoltozes.count({
            where: {
              szoba_id: kerelem.kivant_szoba_id,
              kikoltozes_datum: null
            },
            transaction
          });

          if (currentOccupancy >= kivantSzoba.osszes_hely) {
            throw new ConflictError('A kívánt szoba időközben megtelt, a kérelem nem hajtható végre');
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
            cimzettkor: 'student',
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
          cimzettkor: 'student',
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
      next(error);
    }
  }

  // Diák szobaváltási történetének lekérése
  async getRoomChangeHistory(req, res, next) {
    try {
      const userId = req.user.userId; // Felhasznalo.user_id
      
      // Először lekérjük a felhasználóhoz tartozó diák ID-t
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        throw new NotFoundError('A felhasználóhoz nem tartozik diák');
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
      next(error);
    }
  }

  // Diák értesítéseinek lekérése
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.userId; // Felhasznalo.user_id
      
      // Először lekérjük a felhasználóhoz tartozó diák ID-t
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        throw new NotFoundError('A felhasználóhoz nem tartozik diák');
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
      next(error);
    }
  }

  // Diák értesítésének megjelölése olvasottnak
  async markNotificationAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Felhasználóhoz tartozó diák ID lekérése
      const felhasznalo = await this.db.Felhasznalo.findByPk(userId);
      if (!felhasznalo || !felhasznalo.diak_id) {
        throw new ForbiddenError('A felhasználóhoz nem tartozik diák');
      }

      const notification = await this.db.Notification.findByPk(id);
      if (!notification) {
        throw new NotFoundError('Értesítés');
      }

      // Tulajdonjog ellenőrzése
      if (notification.diak_id !== felhasznalo.diak_id) {
        throw new ForbiddenError('Nincs jogosultsága az értesítés elolvasásához');
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
      next(error);
    }
  }

  // Admin értesítéseinek lekérése
  async getAdminNotifications(_req, res, next) {
    try {
      const notifications = await this.db.Notification.findAll({
        where: {
          cimzettkor: {
            [Op.in]: ['admin', 'both']
          }
        },
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
      next(error);
    }
  }

  // Admin értesítésének megjelölése olvasottnak
  async markNotificationAsReadByAdmin(req, res, next) {
    try {
      const { id } = req.params;

      const notification = await this.db.Notification.findByPk(id);
      if (!notification) {
        throw new NotFoundError('Értesítés');
      }

      notification.elolvasva = true;
      notification.olvasva_datum = new Date();
      await notification.save();

      res.json({
        success: true,
        data: {
          notification_id: notification.notification_id,
          elolvasva: notification.elolvasva,
          olvasva_datum: notification.olvasva_datum,
          updated_at: notification.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin összes értesítésének megjelölése olvasottnak
  async markAllNotificationsAsRead(_req, res, next) {
    try {
      const [updatedCount] = await this.db.Notification.update(
        { 
          elolvasva: true,
          olvasva_datum: new Date()
        },
        {
          where: {
            elolvasva: false
          }
        }
      );

      res.json({
        success: true,
        data: {
          updated_count: updatedCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin értesítés törlése (soft delete)
  async deleteNotification(_req, res, next) {
    try {
      const { id } = _req.params;

      const notification = await this.db.Notification.findByPk(id);
      if (!notification) {
        throw new NotFoundError('Értesítés');
      }

      await notification.destroy(); // Soft delete due to paranoid: true

      res.json({
        success: true,
        message: 'Értesítés sikeresen törölve'
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin értesítési statisztikák
  async getNotificationStatistics(_req, res, next) {
    try {
      const totalCount = await this.db.Notification.count();
      const unreadCount = await this.db.Notification.count({
        where: { elolvasva: false }
      });
      const readCount = totalCount - unreadCount;

      // Count by type
      const typeCounts = await this.db.Notification.findAll({
        attributes: [
          'tipus',
          [this.db.sequelize.fn('COUNT', this.db.sequelize.col('notification_id')), 'count']
        ],
        group: ['tipus']
      });

      // Count by priority
      const priorityCounts = await this.db.Notification.findAll({
        attributes: [
          'prioritas',
          [this.db.sequelize.fn('COUNT', this.db.sequelize.col('notification_id')), 'count']
        ],
        group: ['prioritas']
      });

      res.json({
        success: true,
        data: {
          total: totalCount,
          unread: unreadCount,
          read: readCount,
          by_type: typeCounts.reduce((acc, item) => {
            acc[item.tipus] = parseInt(item.getDataValue('count'));
            return acc;
          }, {}),
          by_priority: priorityCounts.reduce((acc, item) => {
            acc[item.prioritas] = parseInt(item.getDataValue('count'));
            return acc;
          }, {})
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Új értesítés létrehozása (admin által)
  async createNotification(_req, res, next) {
    try {
      const { tipus, uzenet, cimzettkor, prioritas, diak_id } = _req.body;

      // Validate required fields
      if (!tipus || !uzenet) {
        throw new ValidationError('A típus és az üzenet megadása kötelező');
      }

      // If targeting specific student, validate diak_id
      if (cimzettkor === 'student' && !diak_id) {
        throw new ValidationError('Diák ID megadása kötelező diákoknak szóló értesítéshez');
      }

      const notificationData = {
        tipus,
        uzenet,
        cimzettkor: cimzettkor || 'student',
        prioritas: prioritas || 'medium'
      };

      // If creating notification for specific student
      if (diak_id) {
        notificationData.diak_id = diak_id;
      } else if (cimzettkor === 'student') {
        // If targeting all students, we need to create notifications for each
        const allStudents = await this.db.Diak.findAll({
          attributes: ['diak_id']
        });

        const notifications = await Promise.all(
          allStudents.map(student => 
            this.db.Notification.create({
              ...notificationData,
              diak_id: student.diak_id
            })
          )
        );

        return res.status(201).json({
          success: true,
          data: {
            created_count: notifications.length
          }
        });
      }

      const notification = await this.db.Notification.create(notificationData);

      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  // Szobacsere: két diák cseréje két szoba között (titkár számára)
  async swapStudents(req, res, next) {
    try {
      const { szoba_id } = req.params;
      const { kicserelendo_diak_id, uj_diak_id, csere_datum } = req.body;

      // Validálás
      if (!kicserelendo_diak_id || !uj_diak_id) {
        throw new ValidationError('Mindkét diák ID megadása kötelező');
      }

      if (kicserelendo_diak_id === uj_diak_id) {
        throw new ValidationError('Nem cserélhet egy diákot saját magával');
      }

      await this.db.sequelize.transaction({
        isolationLevel: this.db.sequelize.constructor.Transaction.ISOLATION_LEVELS.SERIALIZABLE
      }, async (transaction) => {
        // 1. Cél szoba (amibe a kicserelendo_diak_id benne van) lekérése - LOCK-kal
        const celSzoba = await this.db.Szoba.findByPk(szoba_id, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!celSzoba) {
          throw new NotFoundError('Cél szoba');
        }

        // 2. Kicserélendő diák ellenőrzése - ebben a szobában van-e
        const kicserelendoAktivBekoltozes = await this.db.SzobaBekoltozes.findOne({
          where: {
            diak_id: kicserelendo_diak_id,
            kikoltozes_datum: null
          },
          transaction
        });
        if (!kicserelendoAktivBekoltozes) {
          throw new ValidationError('A kicserélendő diák nem található ebben a szobában');
        }

        // Ellenőrizzük, hogy a kicserélendő diák valóban ebben a szobában van-e
        if (kicserelendoAktivBekoltozes.szoba_id !== parseInt(szoba_id)) {
          throw new ValidationError('A kicserélendő diák nem ebben a szobában tartózkodik');
        }

        // 3. Új diák ellenőrzése - van-e aktív beköltözése és melyik szobában
        const ujDiakAktivBekoltozes = await this.db.SzobaBekoltozes.findOne({
          where: {
            diak_id: uj_diak_id,
            kikoltozes_datum: null
          },
          include: [{
            model: this.db.Szoba,
            as: 'szoba'
          }],
          transaction
        });
        if (!ujDiakAktivBekoltozes) {
          throw new ValidationError('Az új diáknak nincs aktív szobája');
        }

        // Ellenőrizzük, hogy az új diák nincs benne a cél szobában
        if (ujDiakAktivBekoltozes.szoba_id === celSzoba.szoba_id) {
          throw new ValidationError('Az új diák már ebben a szobában van');
        }

        const regiszoba = ujDiakAktivBekoltozes.szoba;
        const csereDatum = csere_datum || new Date().toISOString().split('T')[0];

        // 4. A diákok nevének lekérése az értesítéshez
        const kicserelendoDiak = await this.db.Diak.findByPk(kicserelendo_diak_id, {
          attributes: ['nev'],
          transaction
        });
        const ujDiak = await this.db.Diak.findByPk(uj_diak_id, {
          attributes: ['nev'],
          transaction
        });

        // 5. Szobacsere végrehajtása:
        // 5a. Kicserélendő diák kiköltöztetése a cél szobából
        await kicserelendoAktivBekoltozes.update({
          kikoltozes_datum: csereDatum
        }, { transaction });

        // 5b. Új diák kiköltöztetése az eredeti szobájából
        await ujDiakAktivBekoltozes.update({
          kikoltozes_datum: csereDatum
        }, { transaction });

        // 5c. Kicserélendő diák beköltöztetése az új diák eredeti szobájába
        await this.db.SzobaBekoltozes.create({
          diak_id: kicserelendo_diak_id,
          szoba_id: regiszoba.szoba_id,
          bekoltozes_datum: csereDatum,
          kikoltozes_datum: null
        }, { transaction });

        // 5d. Új diák beköltöztetése a cél szobába
        await this.db.SzobaBekoltozes.create({
          diak_id: uj_diak_id,
          szoba_id: celSzoba.szoba_id,
          bekoltozes_datum: csereDatum,
          kikoltozes_datum: null
        }, { transaction });

        // 6. Szobaváltoztatás rekord létrehozása mindkét diáknak
        await this.db.SzobaValtoztatas.create({
          diak_id: kicserelendo_diak_id,
          jelenlegi_szoba_id: celSzoba.szoba_id,
          kivant_szoba_id: regiszoba.szoba_id,
          indok: `Szobacsere: ${kicserelendoDiak.nev} → ${regiszoba.szoba_szama} (csere: ${ujDiak.nev})`,
          statusz: 'approved',
          academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        }, { transaction });

        await this.db.SzobaValtoztatas.create({
          diak_id: uj_diak_id,
          jelenlegi_szoba_id: regiszoba.szoba_id,
          kivant_szoba_id: celSzoba.szoba_id,
          indok: `Szobacsere: ${ujDiak.nev} → ${celSzoba.szoba_szama} (csere: ${kicserelendoDiak.nev})`,
          statusz: 'approved',
          academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        }, { transaction });

        // 7. Értesítések létrehozása a diákoknak
        await this.db.Notification.create({
          diak_id: kicserelendo_diak_id,
          tipus: 'room_change_approved',
          cimzettkor: 'student',
          prioritas: 'medium',
          uzenet: `Szobacserével átkerült ebbe a szobába: ${regiszoba.szoba_szama}. Cserelő partner: ${ujDiak.nev}`
        }, { transaction });

        await this.db.Notification.create({
          diak_id: uj_diak_id,
          tipus: 'room_change_approved',
          cimzettkor: 'student',
          prioritas: 'medium',
          uzenet: `Szobacserével átkerült ebbe a szobába: ${celSzoba.szoba_szama}. Cserelő partner: ${kicserelendoDiak.nev}`
        }, { transaction });
      });

      res.json({
        success: true,
        message: 'Szobacsere sikeresen végrehajtva',
        data: {
          kicserelendo_diak_id: parseInt(kicserelendo_diak_id),
          uj_diak_id: parseInt(uj_diak_id),
          csere_datum: csere_datum || new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Diákok listájának lekérése aktív beköltözéssel (admin számára cserehez)
  async getStudentsForSwap(req, res, next) {
    try {
      const { szoba_id } = req.query;

      let excludeDiakIds = [];
      
      // Lekérjük azokat a diákokat, akik egy adott szobában vannak
      const studentsInRoom = await this.db.SzobaBekoltozes.findAll({
        where: {
          szoba_id: szoba_id,
          kikoltozes_datum: null
        },
        attributes: ['diak_id'],
        raw: true
      });
      excludeDiakIds = studentsInRoom.map(s => s.diak_id);

      // Diákok lekérése, szűrés hogy ne a cél szobában legyenek
      const diakok = await this.db.SzobaBekoltozes.findAll({
        where: {
          kikoltozes_datum: null,
          diak_id: {
            [Op.notIn]: excludeDiakIds.length > 0 ? excludeDiakIds : [0]
          }
        },
        include: [
          {
            model: this.db.Diak,
            as: 'diak',
            attributes: ['diak_id', 'nev', 'email', 'telefonszam', 'nem']
          },
          {
            model: this.db.Szoba,
            as: 'szoba',
            attributes: ['szoba_id', 'szoba_szama']
          }
        ],
        order: [[{ model: this.db.Diak, as: 'diak' }, 'nev', 'ASC']]
      });

      res.json({
        success: true,
        data: diakok.map(b => ({
          diak_id: b.diak.diak_id,
          nev: b.diak.nev,
          email: b.diak.email,
          telefonszam: b.diak.telefonszam,
          nem: b.diak.nem,
          jelenlegi_szoba: {
            szoba_id: b.szoba.szoba_id,
            szoba_szama: b.szoba.szoba_szama
          }
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SzobaValtoztatasController;
