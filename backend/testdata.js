const { sequelize } = require('./config/database');
const db = require('./models');
const bcrypt = require('bcrypt');
const logger = require('./utils/logger');

/**
 * Komprehenzív seed script az SQLite adatbázis feltöltéséhez
 * Reálisztikus tesztadatokat hoz létre a kollégiumi nyilvántartó rendszerhez
 * @param {boolean} keepConnectionOpen - Ha true, nem zárja le a DB kapcsolatot (fejlesztői módhoz)
 */

async function seedDatabase(keepConnectionOpen = false) {
  try {
    logger.info('🔄 Adatbázis ellenőrzése...');
    
    // Szinkronizáljuk a sémát (létrehozzuk a táblákat, ha nem léteznek)
    // Csak akkor hozzuk létre a táblákat, ha nem léteznek - nem próbáljuk módosítani a meglévőket
    // Ez elkerüli a FOREIGN KEY constraint hibákat SQLite-ban
    await sequelize.sync({ force: false });
    logger.info('✓ Adatbázis séma szinkronizálva');
    
    // Ellenőrizzük, hogy van-e már alapvető seed adat az adatbázisban
    // Csak akkor hagyjuk ki a seed-elést, ha az alapvető adatok már léteznek
    // Ez lehetővé teszi, hogy hiányzó adatok (pl. szülők) pótlásra kerüljenek
    const existingAdmin = await db.Felhasznalo.findOne({ where: { username: 'admin' } });
    const existingRooms = await db.Szoba.count();
    
    // Ha az admin felhasználó ÉS alapvető szobák léteznek, akkor a seed adatok már betöltve
    if (existingAdmin && existingRooms >= 3) {
      logger.info('ℹ Alapvető seed adatok már léteznek, tesztadatok betöltése kihagyva', {
        admin: existingAdmin.username,
        szobak: existingRooms
      });
      logger.info('✅ Adatbázis megőrizve, szerver indítása folytatódik');
      return;
    }
    
    logger.info('ℹ Hiányos seed adatok észlelve, tesztadatok betöltése/pótlása...');

    // ========== LAKCÍMEK LÉTREHOZÁSA ==========
    logger.info('📍 Lakcímek létrehozása...');
    const lakcimek = await db.Lakcim.bulkCreate([
      {
        orszag: 'Magyarország',
        iranyitoszam: '7621',
        varos: 'Pécs',
        utca_hazszam: 'Rákóczi u. 42.'
      },
      {
        orszag: 'Magyarország',
        iranyitoszam: '7625',
        varos: 'Pécs',
        utca_hazszam: 'Széchenyi tér 15.'
      },
      {
        orszag: 'Magyarország',
        iranyitoszam: '6000',
        varos: 'Kecskemét',
        utca_hazszam: 'Batthyány u. 8.'
      },
      {
        orszag: 'Magyarország',
        iranyitoszam: '6400',
        varos: 'Kiskunhalas',
        utca_hazszam: 'Petőfi u. 12.'
      },
      {
        orszag: 'Magyarország',
        iranyitoszam: '5000',
        varos: 'Szolnok',
        utca_hazszam: 'Tiszaligeti sétány 1.'
      },
      {
        orszag: 'Magyarország',
        iranyitoszam: '5300',
        varos: 'Karcag',
        utca_hazszam: 'Szabadság tér 5.'
      }
    ]);
    logger.info(`✓ ${lakcimek.length} lakcím létrehozva`);

    // ========== SZÜLŐK LÉTREHOZÁSA ==========
    logger.info('👨‍👩‍👧 Szülők létrehozása...');
    const szulok = await db.Szulo.bulkCreate([
      {
        nev: 'Nagy Anna',
        email: 'nagy.anna.parent@kanyr.hu',
        telefonszam: '+36301234567',
        szemelyi_igazolvany_szam: '111111AA',
        cim_id: lakcimek[0].cim_id
      },
      {
        nev: 'Nagy János',
        email: 'nagy.janos.parent@kanyr.hu',
        telefonszam: '+36702345678',
        szemelyi_igazolvany_szam: '222222BB',
        cim_id: lakcimek[1].cim_id
      },
      {
        nev: 'Kovács Eszter',
        email: 'kovacs.eszter.parent@kanyr.hu',
        telefonszam: '+36303456789',
        szemelyi_igazolvany_szam: '333333CC',
        cim_id: lakcimek[2].cim_id
      },
      {
        nev: 'Szabó Péter',
        email: 'szabo.peter.parent@kanyr.hu',
        telefonszam: '+36704567890',
        szemelyi_igazolvany_szam: '444444DD',
        cim_id: lakcimek[3].cim_id
      },
      {
        nev: 'Bodnár Judit',
        email: 'bodnar.judit.parent@kanyr.hu',
        telefonszam: '+36305678901',
        szemelyi_igazolvany_szam: '555555EE',
        cim_id: lakcimek[4].cim_id
      },
      {
        nev: 'Kiss Mihály',
        email: 'kiss.mihaly.parent@kanyr.hu',
        telefonszam: '+36706789012',
        szemelyi_igazolvany_szam: '666666FF',
        cim_id: lakcimek[5].cim_id
      }
    ]);
    logger.info(`✓ ${szulok.length} szülő létrehozva`);

    // ========== DIÁKOK LÉTREHOZÁSA ==========
    logger.info('👨‍🎓 Diákok létrehozása...');
    const diaks = await db.Diak.bulkCreate([
      {
        nev: 'Nagy Bernadett',
        email: 'nagy.bernadett.2024@student.hu',
        telefonszam: '+36301111111',
        szuletesi_datum: '2006-03-15',
        szemelyi_igazolvany_szam: '100001AA',
        taj_szam: '100001001',
        diakigazolvany_szam: '20240001',
        szulo_id: szulok[0].szulo_id,
        kapcsolat_tipusa: 'anya',
        cim_id: lakcimek[0].cim_id,
        nem: 'nő'
      },
      {
        nev: 'Nagy Péter',
        email: 'nagy.peter.2024@student.hu',
        telefonszam: '+36302222222',
        szuletesi_datum: '2005-07-22',
        szemelyi_igazolvany_szam: '100002BB',
        taj_szam: '100002002',
        diakigazolvany_szam: '20240002',
        szulo_id: szulok[1].szulo_id,
        kapcsolat_tipusa: 'apa',
        cim_id: lakcimek[1].cim_id,
        nem: 'férfi'
      },
      {
        nev: 'Kovács Zsófia',
        email: 'kovacs.zsofia.2024@student.hu',
        telefonszam: '+36303333333',
        szuletesi_datum: '2006-11-08',
        szemelyi_igazolvany_szam: '100003CC',
        taj_szam: '100003003',
        diakigazolvany_szam: '20240003',
        szulo_id: szulok[2].szulo_id,
        kapcsolat_tipusa: 'anya',
        cim_id: lakcimek[2].cim_id,
        nem: 'nő'
      },
      {
        nev: 'Szabó Katalin',
        email: 'szabo.katalin.2024@student.hu',
        telefonszam: '+36304444444',
        szuletesi_datum: '2005-09-18',
        szemelyi_igazolvany_szam: '100004DD',
        taj_szam: '100004004',
        diakigazolvany_szam: '20240004',
        szulo_id: szulok[3].szulo_id,
        kapcsolat_tipusa: 'apa',
        cim_id: lakcimek[3].cim_id,
        nem: 'nő'
      },
      {
        nev: 'Bodnár Krisztina',
        email: 'bodnar.krisztina.2024@student.hu',
        telefonszam: '+36305555555',
        szuletesi_datum: '2006-01-25',
        szemelyi_igazolvany_szam: '100005EE',
        taj_szam: '100005005',
        diakigazolvany_szam: '20240005',
        szulo_id: szulok[4].szulo_id,
        kapcsolat_tipusa: 'anya',
        cim_id: lakcimek[4].cim_id,
        nem: 'nő'
      },
      {
        nev: 'Kiss Tamás',
        email: 'kiss.tamas.2024@student.hu',
        telefonszam: '+36306666666',
        szuletesi_datum: '2005-05-30',
        szemelyi_igazolvany_szam: '100006FF',
        taj_szam: '100006006',
        diakigazolvany_szam: '20240006',
        szulo_id: szulok[5].szulo_id,
        kapcsolat_tipusa: 'apa',
        cim_id: lakcimek[5].cim_id,
        nem: 'férfi'
      }
    ]);
    logger.info(`✓ ${diaks.length} diák létrehozva`);

    // ========== SZOBÁK LÉTREHOZÁSA ==========
    logger.info('🚪 Szobák létrehozása...');
    const szobak = await db.Szoba.bulkCreate([
      {
        szoba_szama: 'A-101',
        osszes_hely: 4
      },
      {
        szoba_szama: 'A-102',
        osszes_hely: 4
      },
      {
        szoba_szama: 'A-103',
        osszes_hely: 3
      },
      {
        szoba_szama: 'B-201',
        osszes_hely: 4
      },
      {
        szoba_szama: 'B-202',
        osszes_hely: 3
      },
      {
        szoba_szama: 'B-203',
        osszes_hely: 2
      }
    ]);
    logger.info(`✓ ${szobak.length} szoba létrehozva`);

    // ========== SZOBA BEKÖLTÖZÉSEK LÉTREHOZÁSA ==========
    logger.info('🏠 Szoba beköltözések rögzítése...');
    const bekoltozesek = await db.SzobaBekoltozes.bulkCreate([
      {
        diak_id: diaks[0].diak_id,
        szoba_id: szobak[0].szoba_id,
        bekoltozes_datum: '2024-09-01',
        kikoltozes_datum: null // Jelenleg lakik
      },
      {
        diak_id: diaks[1].diak_id,
        szoba_id: szobak[3].szoba_id,
        bekoltozes_datum: '2024-09-01',
        kikoltozes_datum: null
      },
      {
        diak_id: diaks[2].diak_id,
        szoba_id: szobak[1].szoba_id,
        bekoltozes_datum: '2024-09-02',
        kikoltozes_datum: null
      },
      {
        diak_id: diaks[3].diak_id,
        szoba_id: szobak[1].szoba_id,
        bekoltozes_datum: '2024-09-02',
        kikoltozes_datum: null
      },
      {
        diak_id: diaks[4].diak_id,
        szoba_id: szobak[2].szoba_id,
        bekoltozes_datum: '2024-09-03',
        kikoltozes_datum: null
      },
      {
        diak_id: diaks[5].diak_id,
        szoba_id: szobak[3].szoba_id,
        bekoltozes_datum: '2024-09-03',
        kikoltozes_datum: null
      }
    ]);
    logger.info(`✓ ${bekoltozesek.length} beköltözés rögzítve`);

    // ========== FELHASZNÁLÓK LÉTREHOZÁSA ==========
    logger.info('👤 Felhasználók létrehozása...');
    
    // Jelszavak hash-elése - komplex jelszavak a validációknak megfelelően
    const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
    const studentPasswordHash = await bcrypt.hash('Student123!', 10);
    
    const felhasznalok = await db.Felhasznalo.bulkCreate([
      {
        username: 'admin',
        email: 'admin@kanyr.hu',
        password: adminPasswordHash,
        admin: true,  // Titkár (admin)
        diak_id: null
      },
      {
        username: 'student1',
        email: 'nagy.bernadett.2024@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[0].diak_id  // Link to first student (Nagy Bernadett)
      },
      {
        username: 'student2',
        email: 'nagy.peter.2024@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[1].diak_id  // Link to second student (Nagy Péter)
      },
      {
        username: 'student3',
        email: 'kovacs.zsofia.2024@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[2].diak_id  // Link to third student (Kovács Zsófia)
      },
      {
        username: 'student4',
        email: 'szabo.katalin.2024@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[3].diak_id  // Link to fourth student (Szabó Katalin)
      },
      {
        username: 'student5',
        email: 'bodnar.krisztina.2024@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[4].diak_id  // Link to fifth student (Bodnár Krisztina)
      },
      {
        username: 'student6',
        email: 'kiss.tamas.2024@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[5].diak_id  // Link to sixth student (Kiss Tamás)
      }
    ]);
    logger.info(`✓ ${felhasznalok.length} felhasználó létrehozva`);

    // ========== SZOBA VÁLTOZTATÁSI KÉRELMEK LÉTREHOZÁSA ==========
    logger.info('📝 Szoba változtatási kérelmek létrehozása...');
    const valtoztatasok = await db.SzobaValtoztatas.bulkCreate([
      {
        diak_id: diaks[0].diak_id,
        jelenlegi_szoba_id: szobak[0].szoba_id,
        kivant_szoba_id: szobak[2].szoba_id,
        statusz: 'pending',
        indok: 'A jelenlegi szobában zajos szobatársak vannak, csendesebb környezetet szeretnék.',
        academic_year: '2024-2025',
        semester_count: 1
      },
      {
        diak_id: diaks[4].diak_id,
        jelenlegi_szoba_id: szobak[2].szoba_id,
        kivant_szoba_id: szobak[0].szoba_id,
        statusz: 'approved',
        indok: 'Egyetemista barátommal szeretnék egy szobában lakni a tanuláshoz.',
        academic_year: '2024-2025',
        semester_count: 1
      }
    ]);
    logger.info(`✓ ${valtoztatasok.length} szoba változtatási kérelem létrehozva`);

    // ========== ÉRTESÍTÉSEK LÉTREHOZÁSA ==========
    logger.info('🔔 Értesítések létrehozása...');
    const notifikaciok = await db.Notification.bulkCreate([
      {
        diak_id: diaks[0].diak_id,
        tipus: 'room_change_pending',
        cimzettkor: 'student',
        prioritas: 'medium',
        uzenet: 'A szoba változtatási kérelmedet feldolgoztuk. Kérjük, várj türelmesen a döntésre.',
        elolvasva: false,
        olvasva_datum: null
      },
      {
        diak_id: diaks[4].diak_id,
        tipus: 'room_change_approved',
        cimzettkor: 'student',
        prioritas: 'high',
        uzenet: 'Gratulálunk! A szoba változtatási kérelmedet elfogadtuk. Az új szobaszámod: A-101. Kérjük, 3 munkanapon belül költözz át.',
        elolvasva: false,
        olvasva_datum: null
      },
      {
        diak_id: diaks[1].diak_id,
        tipus: 'room_change_denied',
        cimzettkor: 'student',
        prioritas: 'high',
        uzenet: 'Sajnáljuk, de a szoba változtatási kérelmedet elutasítottuk. Az indok: A kívánt szoba már teljesen foglalt. Kérjük, válassz másik szobát.',
        elolvasva: true,
        olvasva_datum: '2024-09-15T10:30:00.000Z'
      },
      {
        diak_id: diaks[2].diak_id,
        tipus: 'system_announcement',
        cimzettkor: 'both',
        prioritas: 'urgent',
        uzenet: 'FONTOS: Karbantartás miatt a rendszer 2024-10-01 22:00 és 2024-10-02 02:00 között nem lesz elérhető. Kérjük, időben intézd ügyeidet!',
        elolvasva: false,
        olvasva_datum: null
      },
      {
        diak_id: diaks[3].diak_id,
        tipus: 'student_notification',
        cimzettkor: 'student',
        prioritas: 'medium',
        uzenet: 'Értesítjük, hogy szülője, Szabó Péter megtekintette a legutóbbi tanulmányi eredményeit. Ha kérdése van, forduljon hozzánk bizalommal.',
        elolvasva: false,
        olvasva_datum: null
      },
      {
        diak_id: diaks[5].diak_id,
        tipus: 'general_alert',
        cimzettkor: 'student',
        prioritas: 'low',
        uzenet: 'Emlékeztető: A kollégiumi díj befizetési határideje október 15. Kérjük, időben gondoskodj a befizetésről.',
        elolvasva: true,
        olvasva_datum: '2024-09-20T14:15:00.000Z'
      }
    ]);
    logger.info(`✓ ${notifikaciok.length} értesítés létrehozva`);

    // ========== STATISZTIKA ==========
    logger.info('📊 Adatbázis feltöltési statisztika', {
      lakcimek: lakcimek.length,
      szulok: szulok.length,
      diaks: diaks.length,
      szobak: szobak.length,
      bekoltozesek: bekoltozesek.length,
      felhasznalok: felhasznalok.length,
      valtoztatasok: valtoztatasok.length,
      notifikaciok: notifikaciok.length
    });
    logger.info('✅ Adatbázis sikeresen feltöltve tesztadatokkal!');
    logger.info('📝 Alapértelmezett hozzáférési adatok', {
      admin: 'admin@kanyr.hu / admin123',
      diak: '{diak_nev}@student.hu / student123'
    });

  } catch (error) {
    logger.error('❌ Hiba az adatbázis feltöltésekor', { error: error.message, stack: error.stack });
    if (!keepConnectionOpen) {
      await sequelize.close();
      process.exit(1);
    }
    throw error;
  } finally {
    // Csak akkor zárjuk le a kapcsolatot, ha nem fejlesztői módban futunk
    if (!keepConnectionOpen) {
      await sequelize.close();
      process.exit(0);
    }
  }
}

// Script futtatása - csak akkor zárjuk le a kapcsolatot, ha nem fejlesztői módban futunk
// A fejlesztői módban (npm run dev) a szerver újrahasználja a kapcsolatot
const isDevMode = process.env.NODE_ENV === 'development' || process.env.KEEP_DB_OPEN === 'true';

if (isDevMode) {
  // Fejlesztői módban csak a seed-elés fut le, a kapcsolat nyitva marad
  seedDatabase(true).then(() => {
    logger.info('✅ Adatbázis seed kész, kapcsolat nyitva hagyva (fejlesztői mód)');
    // Ne hívjuk meg a sequelize.close()-t, ne hívjuk meg a process.exit(0)-t
    // A szerver folyamat újrahasználja ezt a kapcsolatot
  }).catch(error => {
    logger.error('❌ Hiba az adatbázis seed-elésekor', { error: error.message, stack: error.stack });
    process.exit(1);
  });
} else {
  // Éles/standalone módban a megszokott módon fut
  seedDatabase(false);
}
