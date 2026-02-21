const ErtesitesService = require('./ErtesitesService');

/**
 * SzobaValtoztatas Service
 * Üzleti logika a szobaváltási kérelmekhez
 */
class SzobaValtoztatasService {
  constructor(repository, db) {
    this.repository = repository;
    this.db = db;
    this.ertesitesService = new ErtesitesService(db);
  }

  /**
   * Diák aktuális szobájának és szobatársainak lekérése
   */
  async getCurrentRoom(diakId) {
    const diak = await this.repository.findDiakWithCurrentRoom(diakId);
    
    if (!diak) {
      return { success: false, error: 'Diák nem található' };
    }

    const aktivalisBekoltozes = diak.bekoltozesek?.[0];
    if (!aktivalisBekoltozes) {
      return { success: false, error: 'A diáknak nincs aktív szobája' };
    }

    const aktualisSzoba = aktivalisBekoltozes.szoba;
    const szobatarsak = await this.repository.findRoommates(aktualisSzoba.szoba_id, diakId);

    return {
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
    };
  }

  /**
   * Szobaváltási kérelem benyújtása
   */
  async submitRoomChangeRequest(diakId, kivantSzobaId, indok) {
    // Diák aktuális szobájának ellenőrzése
    const diak = await this.repository.findDiakWithCurrentRoom(diakId);
    
    if (!diak) {
      return { success: false, error: 'Diák nem található' };
    }

    const aktivalisBekoltozes = diak.bekoltozesek?.[0];
    if (!aktivalisBekoltozes) {
      return { success: false, error: 'A diák jelenleg nincs szobában' };
    }

    const aktualisSzoba = aktivalisBekoltozes.szoba;

    // Kívánt szoba létezésének ellenőrzése
    const kivantSzoba = await this.repository.findSzobaById(kivantSzobaId);
    if (!kivantSzoba) {
      return { success: false, error: 'A kívánt szoba nem található' };
    }

    // Nem próbálhat ugyanabba a szobába költözni
    if (kivantSzoba.szoba_id === aktualisSzoba.szoba_id) {
      return { success: false, error: 'A diák már ebben a szobában lakik' };
    }

    // Szobaváltási korlát ellenőrzése (3 alkalom félévenként)
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    
    const existingRequests = await this.repository.countPendingOrApprovedByDiakAndYear(diakId, academicYear);

    if (existingRequests >= 3) {
      return { success: false, error: 'A diák elérte a félévi szobaváltási korlátot (3 alkalom)' };
    }

    // Új kérelem létrehozása
    const ujKerelem = await this.repository.create({
      diak_id: diakId,
      jelenlegi_szoba_id: aktualisSzoba.szoba_id,
      kivant_szoba_id: kivantSzoba.szoba_id,
      indok: indok || null,
      academic_year: academicYear,
      semester_count: existingRequests + 1
    });

    return {
      success: true,
      data: {
        valtoztatas_id: ujKerelem.valtoztatas_id,
        statusz: ujKerelem.statusz,
        indok: ujKerelem.indok,
        created_at: ujKerelem.created_at
      }
    };
  }

  /**
   * Összes kérelem lekérése (admin számára)
   */
  async getAllRequests(status = null) {
    const kerelemek = await this.repository.findAll(status);
    return { success: true, data: kerelemek };
  }

  /**
   * Kérelem jóváhagyása
   */
  async approveRequest(id) {
    const kerelem = await this.repository.findById(id);
    
    if (!kerelem) {
      return { success: false, error: 'Szobaváltási kérelem nem található' };
    }

    if (kerelem.statusz !== 'pending') {
      return { success: false, error: `A kérelem már ${kerelem.statusz} státuszban van, nem módosítható` };
    }

    let transaction;
    try {
      transaction = await this.repository.beginTransaction();

      const today = new Date().toISOString().split('T')[0];

      // 1. Régi aktív beköltözés lezárása
      const activeBekoltozes = await this.repository.findActiveBekoltozesByDiak(kerelem.diak_id, transaction);
      if (activeBekoltozes) {
        await this.repository.closeBekoltozes(activeBekoltozes, today, transaction);
      }

      // 2. Szoba kapacitás ellenőrzése lockkal
      const kivantSzoba = await this.repository.findSzobaByIdWithLock(kerelem.kivant_szoba_id, transaction);
      if (!kivantSzoba) {
        throw new Error('A kívánt szoba nem található');
      }

      const currentOccupancy = await this.repository.countCurrentOccupancy(kerelem.kivant_szoba_id, transaction);
      if (currentOccupancy >= kivantSzoba.osszes_hely) {
        throw new Error('A kívánt szoba időközben megtelt, a kérelem nem hajtható végre');
      }

      // 3. Új beköltözés létrehozása
      await this.repository.createBekoltozes({
        diak_id: kerelem.diak_id,
        szoba_id: kerelem.kivant_szoba_id,
        bekoltozes_datum: today,
        kikoltozes_datum: null
      }, transaction);

      // 4. Kérelem státuszának frissítése
      await this.repository.updateStatus(id, 'approved', transaction);

      // 5. Értesítés létrehozása a diáknak az új rendszer szerint
      // Megjegyzés: a tranzakció után küldjük, hogy ne befolyásolja a jóváhagyást
      const regiSzoba = kerelem.jelenlegi_szoba ? (await this.repository.findSzobaById(kerelem.jelenlegi_szoba_id))?.szoba_szama : null;

      await transaction.commit();

      // Értesítés küldése a tranzakció után
      await this.ertesitesService.notifyRoomChangeApproved(kerelem.diak_id, {
        regi_szoba: regiSzoba,
        uj_szoba: kivantSzoba.szoba_szama
      });

      // Friss adatok lekérése
      const updatedKerelem = await this.repository.findById(id);
      return {
        success: true,
        data: {
          valtoztatas_id: updatedKerelem.valtoztatas_id,
          statusz: updatedKerelem.statusz,
          updated_at: updatedKerelem.updated_at
        }
      };
    } catch (error) {
      if (transaction) await transaction.rollback();
      throw error;
    }
  }

  /**
   * Kérelem elutasítása
   */
  async rejectRequest(id, elutasitasIndok = null) {
    const kerelem = await this.repository.findById(id);
    
    if (!kerelem) {
      return { success: false, error: 'Szobaváltási kérelem nem található' };
    }

    if (kerelem.statusz !== 'pending') {
      return { success: false, error: `A kérelem már ${kerelem.statusz} státuszban van, nem módosítható` };
    }

    // Státusz frissítése
    await this.repository.updateStatus(id, 'denied');

    // Értesítés küldése a diáknak az új rendszer szerint
    const kivantSzoba = kerelem.kivant_szoba_id ? (await this.repository.findSzobaById(kerelem.kivant_szoba_id))?.szoba_szama : null;
    
    await this.ertesitesService.notifyRoomChangeRejected(kerelem.diak_id, elutasitasIndok, {
      kivant_szoba: kivantSzoba
    });

    const updatedKerelem = await this.repository.findById(id);
    return {
      success: true,
      data: {
        valtoztatas_id: updatedKerelem.valtoztatas_id,
        statusz: updatedKerelem.statusz,
        updated_at: updatedKerelem.updated_at
      }
    };
  }

  /**
   * Diák szobaváltási történetének lekérése
   */
  async getHistoryByDiak(diakId) {
    const tortenet = await this.repository.findByDiakId(diakId);
    return { success: true, data: tortenet };
  }
}

module.exports = SzobaValtoztatasService;