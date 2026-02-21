const ErtesitesRepository = require('../repositories/ErtesitesRepository');

/**
 * ErtesitesService
 * Üzleti logika az értesítésekhez
 */
class ErtesitesService {
  constructor(db) {
    this.db = db;
    this.repository = new ErtesitesRepository(db);
  }

  /**
   * Felhasználó értesítéseinek lekérése
   * @param {number} userId - Felhasználó ID (diak_id vagy user_id)
   * @param {string} userType - Felhasználó típusa ('diak', 'szulo', 'admin')
   * @param {Object} options - Lekérdezési opciók
   * @returns {Promise<Object>} - Értesítések és metaadatok
   */
  async getUserNotifications(userId, userType, options = {}) {
    try {
      const notifications = await this.repository.findAllByUser(userId, userType, options);
      const unreadCount = await this.repository.countUnread(userId, userType);

      return {
        success: true,
        data: notifications,
        meta: {
          total: notifications.length,
          unreadCount,
          filters: options
        }
      };
    } catch (error) {
      throw new Error(`Hiba a felhasználó értesítéseinek lekérésében: ${error.message}`);
    }
  }

  /**
   * Olvasatlan értesítések számának lekérése
   * @param {number} userId - Felhasználó ID
   * @param {string} userType - Felhasználó típusa
   * @returns {Promise<Object>} - Olvasatlan szám
   */
  async getUnreadCount(userId, userType) {
    try {
      const count = await this.repository.countUnread(userId, userType);
      
      return {
        success: true,
        data: { unreadCount: count }
      };
    } catch (error) {
      throw new Error(`Hiba az olvasatlan értesítések számolásában: ${error.message}`);
    }
  }

  /**
   * Értesítés olvasottnak jelölése
   * @param {number} notificationId - Értesítés ID
   * @param {number} userId - Felhasználó ID
   * @param {string} userType - Felhasználó típusa
   * @returns {Promise<Object>} - Eredmény
   */
  async markAsRead(notificationId, userId, userType) {
    try {
      const notification = await this.repository.findById(notificationId);

      if (!notification) {
        return {
          success: false,
          error: 'Az értesítés nem található'
        };
      }

      // Jogosultság ellenőrzése
      if (notification.cimzett_id !== userId || notification.cimzett_tipus !== userType) {
        return {
          success: false,
          error: 'Nincs jogosultsága az értesítés módosításához'
        };
      }

      const success = await this.repository.markAsRead(notificationId);

      return {
        success,
        data: {
          notification_id: notificationId,
          olvasva: true
        },
        message: success ? 'Értesítés olvasottnak jelölve' : 'Hiba történt'
      };
    } catch (error) {
      throw new Error(`Hiba az értesítés olvasottnak jelölésében: ${error.message}`);
    }
  }

  /**
   * Összes értesítés olvasottnak jelölése
   * @param {number} userId - Felhasználó ID
   * @param {string} userType - Felhasználó típusa
   * @returns {Promise<Object>} - Eredmény
   */
  async markAllAsRead(userId, userType) {
    try {
      const count = await this.repository.markAllAsRead(userId, userType);

      return {
        success: true,
        data: { updatedCount: count },
        message: `${count} értesítés olvasottnak jelölve`
      };
    } catch (error) {
      throw new Error(`Hiba az összes értesítés olvasottnak jelölésében: ${error.message}`);
    }
  }

  /**
   * Értesítés törlése
   * @param {number} notificationId - Értesítés ID
   * @param {number} userId - Felhasználó ID
   * @param {string} userType - Felhasználó típusa
   * @returns {Promise<Object>} - Eredmény
   */
  async deleteNotification(notificationId, userId, userType) {
    try {
      const notification = await this.repository.findById(notificationId);

      if (!notification) {
        return {
          success: false,
          error: 'Az értesítés nem található'
        };
      }

      // Jogosultság ellenőrzése
      if (notification.cimzett_id !== userId || notification.cimzett_tipus !== userType) {
        return {
          success: false,
          error: 'Nincs jogosultsága az értesítés törléséhez'
        };
      }

      const success = await this.repository.delete(notificationId);

      return {
        success,
        message: success ? 'Értesítés törölve' : 'Hiba történt a törlés során'
      };
    } catch (error) {
      throw new Error(`Hiba az értesítés törlésében: ${error.message}`);
    }
  }

  /**
   * Új értesítés létrehozása (belső metódus)
   * @param {Object} data - Értesítés adatok
   * @returns {Promise<Object>} - Létrehozott értesítés
   */
  async createNotification(data) {
    try {
      const notification = await this.repository.create({
        cimzett_id: data.cimzett_id,
        cimzett_tipus: data.cimzett_tipus || 'diak',
        tipus: data.tipus || 'egyeb',
        cim: data.cim,
        uzenet: data.uzenet,
        adat: data.adat || null,
        olvasva: false
      });

      return notification;
    } catch (error) {
      console.error('Hiba az értesítés létrehozásában:', error);
      return null;
    }
  }

  // ==========================================
  // SPECIÁLIS ÉRTESÍTÉS METÓDUSOK
  // ==========================================

  /**
   * Szobaváltás jóváhagyása értesítés
   * @param {number} diakId - Diák ID
   * @param {Object} szobaAdatok - Szoba adatok
   * @returns {Promise<Object>} - Létrehozott értesítés
   */
  async notifyRoomChangeApproved(diakId, szobaAdatok) {
    try {
      return await this.createNotification({
        cimzett_id: diakId,
        cimzett_tipus: 'diak',
        tipus: 'szobavaltas',
        cim: 'Szobaváltás jóváhagyva',
        uzenet: `Az Ön szobaváltási kérelmét jóváhagyták. Új szobája: ${szobaAdatok.uj_szoba || 'ismeretlen'}.`,
        adat: {
          regi_szoba: szobaAdatok.regi_szoba || null,
          uj_szoba: szobaAdatok.uj_szoba || null,
          datum: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Hiba a szobaváltás értesítés küldésében:', error);
    }
  }

  /**
   * Szobaváltás elutasítása értesítés
   * @param {number} diakId - Diák ID
   * @param {string} indok - Elutasítás indoka
   * @param {Object} szobaAdatok - Szoba adatok
   * @returns {Promise<Object>} - Létrehozott értesítés
   */
  async notifyRoomChangeRejected(diakId, indok, szobaAdatok = {}) {
    try {
      return await this.createNotification({
        cimzett_id: diakId,
        cimzett_tipus: 'diak',
        tipus: 'szobavaltas',
        cim: 'Szobaváltás elutasítva',
        uzenet: `Az Ön szobaváltási kérelmét elutasították. ${indok ? `Indok: ${indok}` : ''}`,
        adat: {
          kivant_szoba: szobaAdatok.kivant_szoba || null,
          indok: indok || null,
          datum: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Hiba a szobaváltás elutasítás értesítés küldésében:', error);
    }
  }

  /**
   * Új diák regisztráció értesítés (adminoknak)
   * @param {Object} diakAdatok - Diák adatok
   * @returns {Promise<Object>} - Létrehozott értesítés
   */
  async notifyNewStudentRegistered(diakAdatok) {
    try {
      // Összes admin értesítése
      const admins = await this.db.Felhasznalo.findAll({
        where: { admin: true }
      });

      const notifications = admins.map(admin => ({
        cimzett_id: admin.user_id,
        cimzett_tipus: 'admin',
        tipus: 'rendszer',
        cim: 'Új diák regisztráció',
        uzenet: `Új diák regisztrált: ${diakAdatok.nev} (${diakAdatok.email})`,
        adat: {
          diak_id: diakAdatok.diak_id,
          nev: diakAdatok.nev,
          email: diakAdatok.email,
          datum: new Date().toISOString()
        },
        olvasva: false
      }));

      return await this.repository.bulkCreate(notifications);
    } catch (error) {
      console.error('Hiba az új diák értesítés küldésében:', error);
    }
  }

  /**
   * Határidő emlékeztető értesítés
   * @param {number} cimzettId - Címzett ID
   * @param {string} cimzettTipus - Címzett típusa
   * @param {Object} hataridoAdatok - Határidő adatok
   * @returns {Promise<Object>} - Létrehozott értesítés
   */
  async notifyDeadlineApproaching(cimzettId, cimzettTipus, hataridoAdatok) {
    try {
      return await this.createNotification({
        cimzett_id: cimzettId,
        cimzett_tipus: cimzettTipus,
        tipus: 'hatarido',
        cim: 'Határidő emlékeztető',
        uzenet: `${hataridoAdatok.megnevezes}: ${hataridoAdatok.datum}`,
        adat: {
          hatarido_id: hataridoAdatok.id || null,
          megnevezes: hataridoAdatok.megnevezes,
          datum: hataridoAdatok.datum,
          napok_vissza: hataridoAdatok.napok_vissza || null
        }
      });
    } catch (error) {
      console.error('Hiba a határidő értesítés küldésében:', error);
    }
  }

  /**
   * Szórási üzenet küldése (admin csak)
   * @param {string} cimzettTipus - Címzett típusa ('diak', 'szulo', 'admin', vagy 'mindenki')
   * @param {string} cim - Üzenet címe
   * @param {string} uzenet - Üzenet szövege
   * @returns {Promise<Object>} - Eredmény
   */
  async sendBroadcastMessage(cimzettTipus, cim, uzenet) {
    try {
      let notifications = [];

      if (cimzettTipus === 'mindenki' || cimzettTipus === 'diak') {
        // Összes aktív diák értesítése
        const diakok = await this.db.Diak.findAll({
          include: [{
            model: this.db.SzobaBekoltozes,
            as: 'bekoltozesek',
            where: { kikoltozes_datum: null },
            required: true
          }]
        });
        diakok.forEach(diak => {
          notifications.push({
            cimzett_id: diak.diak_id,
            cimzett_tipus: 'diak',
            tipus: 'rendszer',
            cim,
            uzenet,
            adat: { broadcast: true, datum: new Date().toISOString() },
            olvasva: false
          });
        });
      }

      if (cimzettTipus === 'mindenki' || cimzettTipus === 'szulo') {
        // Összes szülő értesítése
        const szulok = await this.db.Szulo.findAll();
        szulok.forEach(szulo => {
          notifications.push({
            cimzett_id: szulo.szulo_id,
            cimzett_tipus: 'szulo',
            tipus: 'rendszer',
            cim,
            uzenet,
            adat: { broadcast: true, datum: new Date().toISOString() },
            olvasva: false
          });
        });
      }

      if (cimzettTipus === 'mindenki' || cimzettTipus === 'admin') {
        // Összes admin értesítése
        const admins = await this.db.Felhasznalo.findAll({
          where: { admin: true }
        });
        admins.forEach(admin => {
          notifications.push({
            cimzett_id: admin.user_id,
            cimzett_tipus: 'admin',
            tipus: 'rendszer',
            cim,
            uzenet,
            adat: { broadcast: true, datum: new Date().toISOString() },
            olvasva: false
          });
        });
      }

      if (notifications.length === 0) {
        return {
          success: false,
          error: 'Nincsenek címzettek'
        };
      }

      await this.repository.bulkCreate(notifications);

      return {
        success: true,
        data: { sentCount: notifications.length },
        message: `${notifications.length} értesítés elküldve`
      };
    } catch (error) {
      throw new Error(`Hiba a szórási üzenet küldésében: ${error.message}`);
    }
  }

  /**
   * Egyéni értesítés küldése
   * @param {number} cimzettId - Címzett ID
   * @param {string} cimzettTipus - Címzett típusa
   * @param {string} cim - Üzenet címe
   * @param {string} uzenet - Üzenet szövege
   * @param {Object} adat - Opcionális metaadatok
   * @returns {Promise<Object>} - Létrehozott értesítés
   */
  async sendCustomNotification(cimzettId, cimzettTipus, cim, uzenet, adat = null) {
    try {
      return await this.createNotification({
        cimzett_id: cimzettId,
        cimzett_tipus: cimzettTipus,
        tipus: 'egyeb',
        cim,
        uzenet,
        adat
      });
    } catch (error) {
      console.error('Hiba az egyéni értesítés küldésében:', error);
    }
  }
}

module.exports = ErtesitesService;