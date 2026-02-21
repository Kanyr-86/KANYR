const { Op } = require('sequelize');

/**
 * SzobaValtoztatas Repository
 * Adatbázis műveletek a szobaváltási kérelmekhez
 */
class SzobaValtoztatasRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Új szobaváltási kérelem létrehozása
   */
  async create(kerelemData) {
    return await this.db.SzobaValtoztatas.create(kerelemData);
  }

  /**
   * Kérelem keresése ID alapján
   */
  async findById(id) {
    return await this.db.SzobaValtoztatas.findByPk(id);
  }

  /**
   * Kérelem keresése ID alapján részletes adatokkal
   */
  async findByIdWithDetails(id) {
    return await this.db.SzobaValtoztatas.findByPk(id, {
      include: [
        {
          model: this.db.Diak,
          as: 'diak',
          attributes: ['nev', 'email', 'telefonszam']
        },
        {
          model: this.db.Szoba,
          as: 'jelenlegi_szoba',
          attributes: ['szoba_id', 'szoba_szama', 'osszes_hely']
        },
        {
          model: this.db.Szoba,
          as: 'kivant_szoba',
          attributes: ['szoba_id', 'szoba_szama', 'osszes_hely']
        }
      ]
    });
  }

  /**
   * Összes kérelem lekérése (opcionális szűréssel)
   */
  async findAll(status = null) {
    const whereClause = {};
    if (status) {
      whereClause.statusz = status;
    }

    return await this.db.SzobaValtoztatas.findAll({
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
  }

  /**
   * Diák kérelmeinek lekérése
   */
  async findByDiakId(diakId) {
    return await this.db.SzobaValtoztatas.findAll({
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
  }

  /**
   * Diák függőben lévő kérelmeinek száma az adott tanévben
   */
  async countPendingOrApprovedByDiakAndYear(diakId, academicYear) {
    return await this.db.SzobaValtoztatas.count({
      where: {
        diak_id: diakId,
        academic_year: academicYear,
        statusz: {
          [Op.in]: ['pending', 'approved']
        }
      }
    });
  }

  /**
   * Kérelem státuszának frissítése
   */
  async updateStatus(id, statusz, transaction = null) {
    const kerelem = await this.findById(id);
    if (!kerelem) {
      return null;
    }
    await kerelem.update({ statusz }, { transaction });
    return kerelem;
  }

  /**
   * Aktív beköltözés lekérése diák alapján
   */
  async findActiveBekoltozesByDiak(diakId, transaction = null) {
    return await this.db.SzobaBekoltozes.findOne({
      where: {
        diak_id: diakId,
        kikoltozes_datum: null
      },
      transaction
    });
  }

  /**
   * Beköltözés lezárása
   */
  async closeBekoltozes(bekoltozes, kikoltozesDatum, transaction = null) {
    return await bekoltozes.update({ kikoltozes_datum: kikoltozesDatum }, { transaction });
  }

  /**
   * Új beköltözés létrehozása
   */
  async createBekoltozes(bekoltozesData, transaction = null) {
    return await this.db.SzobaBekoltozes.create(bekoltozesData, { transaction });
  }

  /**
   * Szoba lekérése ID alapján (lockolással tranzakcióhoz)
   */
  async findSzobaByIdWithLock(szobaId, transaction) {
    return await this.db.Szoba.findByPk(szobaId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
  }

  /**
   * Szoba aktuális lakosságának száma
   */
  async countCurrentOccupancy(szobaId, transaction = null) {
    return await this.db.SzobaBekoltozes.count({
      where: {
        szoba_id: szobaId,
        kikoltozes_datum: null
      },
      transaction
    });
  }

  /**
   * Értesítés létrehozása
   */
  async createNotification(notificationData, transaction = null) {
    return await this.db.Notification.create(notificationData, { transaction });
  }

  /**
   * Diák aktuális szobájának lekérése beköltözésen keresztül
   */
  async findDiakWithCurrentRoom(diakId) {
    return await this.db.Diak.findByPk(diakId, {
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
  }

  /**
   * Szobatársak lekérése
   */
  async findRoommates(szobaId, excludeDiakId) {
    return await this.db.SzobaBekoltozes.findAll({
      include: [{
        model: this.db.Diak,
        as: 'diak',
        attributes: ['nev', 'email', 'telefonszam']
      }],
      where: {
        szoba_id: szobaId,
        kikoltozes_datum: null,
        diak_id: {
          [Op.ne]: excludeDiakId
        }
      }
    });
  }

  /**
   * Szoba ellenőrzése hogy létezik-e
   */
  async findSzobaById(szobaId) {
    return await this.db.Szoba.findByPk(szobaId);
  }

  /**
   * Tranzakció indítása
   */
  async beginTransaction() {
    return await this.db.sequelize.transaction({
      isolationLevel: this.db.sequelize.constructor.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    });
  }
}

module.exports = SzobaValtoztatasRepository;