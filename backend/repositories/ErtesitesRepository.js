const { Op } = require('sequelize');

/**
 * ErtesitesRepository
 * Adatbázis műveletek az értesítésekhez
 */
class ErtesitesRepository {
  constructor(db) {
    this.db = db;
    this.Notification = db.Notification;
  }

  /**
   * Felhasználó összes értesítésének lekérése
   * @param {number} cimzettId - Címzett ID-ja
   * @param {string} cimzettTipus - Címzett típusa ('diak', 'szulo', 'admin')
   * @param {Object} options - Lekérdezési opciók
   * @returns {Promise<Array>} - Értesítések listája
   */
  async findAllByUser(cimzettId, cimzettTipus, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        tipus = null,
        olvasva = null
      } = options;

      const whereClause = {
        cimzett_id: cimzettId,
        cimzett_tipus: cimzettTipus
      };

      // Opcionális szűrők
      if (tipus) {
        whereClause.tipus = tipus;
      }
      if (olvasva !== null) {
        whereClause.olvasva = olvasva;
      }

      return await this.Notification.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      throw new Error(`Hiba az értesítések lekérésében: ${error.message}`);
    }
  }

  /**
   * Olvasatlan értesítések lekérése
   * @param {number} cimzettId - Címzett ID-ja
   * @param {string} cimzettTipus - Címzett típusa
   * @param {number} limit - Maximum hány darab
   * @returns {Promise<Array>} - Olvasatlan értesítések
   */
  async findUnreadByUser(cimzettId, cimzettTipus, limit = 10) {
    try {
      return await this.Notification.findAll({
        where: {
          cimzett_id: cimzettId,
          cimzett_tipus: cimzettTipus,
          olvasva: false
        },
        order: [['created_at', 'DESC']],
        limit
      });
    } catch (error) {
      throw new Error(`Hiba az olvasatlan értesítések lekérésében: ${error.message}`);
    }
  }

  /**
   * Értesítés lekérése ID alapján
   * @param {number} id - Értesítés ID
   * @returns {Promise<Object|null>} - Értesítés vagy null
   */
  async findById(id) {
    try {
      return await this.Notification.findByPk(id);
    } catch (error) {
      throw new Error(`Hiba az értesítés lekérésében: ${error.message}`);
    }
  }

  /**
   * Új értesítés létrehozása
   * @param {Object} data - Értesítés adatok
   * @returns {Promise<Object>} - Létrehozott értesítés
   */
  async create(data) {
    try {
      return await this.Notification.create(data);
    } catch (error) {
      throw new Error(`Hiba az értesítés létrehozásában: ${error.message}`);
    }
  }

  /**
   * Több értesítés létrehozása egyszerre
   * @param {Array} notificationsData - Értesítés adatok tömbje
   * @returns {Promise<Array>} - Létrehozott értesítések
   */
  async bulkCreate(notificationsData) {
    try {
      return await this.Notification.bulkCreate(notificationsData);
    } catch (error) {
      throw new Error(`Hiba az értesítések tömeges létrehozásában: ${error.message}`);
    }
  }

  /**
   * Értesítés olvasottnak jelölése
   * @param {number} id - Értesítés ID
   * @returns {Promise<boolean>} - Sikeres volt-e
   */
  async markAsRead(id) {
    try {
      const notification = await this.findById(id);
      if (!notification) {
        return false;
      }
      await notification.update({ olvasva: true });
      return true;
    } catch (error) {
      throw new Error(`Hiba az értesítés olvasottnak jelölésében: ${error.message}`);
    }
  }

  /**
   * Összes értesítés olvasottnak jelölése
   * @param {number} cimzettId - Címzett ID
   * @param {string} cimzettTipus - Címzett típusa
   * @returns {Promise<number>} - Hány darab lett frissítve
   */
  async markAllAsRead(cimzettId, cimzettTipus) {
    try {
      const result = await this.Notification.update(
        { olvasva: true },
        {
          where: {
            cimzett_id: cimzettId,
            cimzett_tipus: cimzettTipus,
            olvasva: false
          }
        }
      );
      return result[0]; // Frissített sorok száma
    } catch (error) {
      throw new Error(`Hiba az összes értesítés olvasottnak jelölésében: ${error.message}`);
    }
  }

  /**
   * Értesítés törlése
   * @param {number} id - Értesítés ID
   * @returns {Promise<boolean>} - Sikeres volt-e
   */
  async delete(id) {
    try {
      const notification = await this.findById(id);
      if (!notification) {
        return false;
      }
      await notification.destroy();
      return true;
    } catch (error) {
      throw new Error(`Hiba az értesítés törlésében: ${error.message}`);
    }
  }

  /**
   * Olvasatlan értesítések számának lekérése
   * @param {number} cimzettId - Címzett ID
   * @param {string} cimzettTipus - Címzett típusa
   * @returns {Promise<number>} - Olvasatlan értesítések száma
   */
  async countUnread(cimzettId, cimzettTipus) {
    try {
      // Ellenőrizzük, hogy a Notification modell elérhető-e
      if (!this.Notification) {
        console.error('countUnread: Notification modell nem elérhető!');
        throw new Error('Notification modell nem elérhető');
      }
      
      return await this.Notification.count({
        where: {
          cimzett_id: cimzettId,
          cimzett_tipus: cimzettTipus,
          olvasva: false
        }
      });
    } catch (error) {
      console.error('Hiba az olvasatlan értesítések számolásában:', error);
      throw new Error(`Hiba az olvasatlan értesítések számolásában: ${error.message}`);
    }
  }

  /**
   * Régi értesítések törlése (takarítás)
   * @param {number} daysOld - Hány napnál régebbi értesítéseket töröljön
   * @returns {Promise<number>} - Törölt értesítések száma
   */
  async deleteOldNotifications(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.Notification.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate
          },
          olvasva: true // Csak olvasott értesítéseket törölünk
        }
      });
      return result;
    } catch (error) {
      throw new Error(`Hiba a régi értesítések törlésében: ${error.message}`);
    }
  }
}

module.exports = ErtesitesRepository;