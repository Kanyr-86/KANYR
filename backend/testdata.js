const { sequelize } = require('./config/database');
const db = require('./models');
const bcrypt = require('bcrypt');
const logger = require('./utils/logger');

/**
 * Komprehenzív seed script az SQLite adatbázis feltöltéséhez
 * Reálisztikus tesztadatokat hoz létre a kollégiumi nyilvántartó rendszerhez
 */

async function seedDatabase() {
  try {
    logger.info('🔄 Adatbázis szinkronizálása...');
    
    // Táblák törlése (fejlesztéshez)
    // Megjegyzés: Csak szükség esetén töröljük az adatokat
    await sequelize.truncate({ cascade: true, force: true });
    
    logger.info('✓ Adatbázis szinkronizálva');

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
        email: 'nagy.anna@email.hu',
        telefonszam: '06-30-123-4567',
        szemelyi_igazolvany_szam: '111111AAA',
        cim_id: lakcimek[0].cim_id
      },
      {
        nev: 'Nagy János',
        email: 'nagy.janos@email.hu',
        telefonszam: '06-70-234-5678',
        szemelyi_igazolvany_szam: '222222BBB',
        cim_id: lakcimek[1].cim_id
      },
      {
        nev: 'Kovács Eszter',
        email: 'kovacs.eszter@email.hu',
        telefonszam: '06-30-345-6789',
        szemelyi_igazolvany_szam: '333333CCC',
        cim_id: lakcimek[2].cim_id
      },
      {
        nev: 'Szabó Péter',
        email: 'szabo.peter@email.hu',
        telefonszam: '06-70-456-7890',
        szemelyi_igazolvany_szam: '444444DDD',
        cim_id: lakcimek[3].cim_id
      },
      {
        nev: 'Bodnár Judit',
        email: 'bodnar.judit@email.hu',
        telefonszam: '06-30-567-8901',
        szemelyi_igazolvany_szam: '555555EEE',
        cim_id: lakcimek[4].cim_id
      },
      {
        nev: 'Kiss Mihály',
        email: 'kiss.mihaly@email.hu',
        telefonszam: '06-70-678-9012',
        szemelyi_igazolvany_szam: '666666FFF',
        cim_id: lakcimek[5].cim_id
      }
    ]);
    logger.info(`✓ ${szulok.length} szülő létrehozva`);

    // ========== DIÁKOK LÉTREHOZÁSA ==========
    logger.info('👨‍🎓 Diákok létrehozása...');
    const diaks = await db.Diak.bulkCreate([
      {
        nev: 'Nagy Bernadett',
        email: 'nagy.bernadett@student.hu',
        telefonszam: '06-30-111-1111',
        szuletesi_datum: '2006-03-15',
        szemelyi_igazolvany_szam: '100001AAA',
        taj_szam: '100001AAA',
        diakigazolvany_szam: 'DIG2024-001',
        szulo_id: szulok[0].szulo_id,
        kapcsolat_tipusa: 'anya',
        cim_id: lakcimek[0].cim_id,
        nem: 'nő'
      },
      {
        nev: 'Nagy Péter',
        email: 'nagy.peter@student.hu',
        telefonszam: '06-30-222-2222',
        szuletesi_datum: '2005-07-22',
        szemelyi_igazolvany_szam: '100002BBB',
        taj_szam: '100002BBB',
        diakigazolvany_szam: 'DIG2024-002',
        szulo_id: szulok[1].szulo_id,
        kapcsolat_tipusa: 'apa',
        cim_id: lakcimek[1].cim_id,
        nem: 'férfi'
      },
      {
        nev: 'Kovács Zsófia',
        email: 'kovacs.zsofia@student.hu',
        telefonszam: '06-30-333-3333',
        szuletesi_datum: '2006-11-08',
        szemelyi_igazolvany_szam: '100003CCC',
        taj_szam: '100003CCC',
        diakigazolvany_szam: 'DIG2024-003',
        szulo_id: szulok[2].szulo_id,
        kapcsolat_tipusa: 'anya',
        cim_id: lakcimek[2].cim_id,
        nem: 'nő'
      },
      {
        nev: 'Szabó Katalin',
        email: 'szabo.katalin@student.hu',
        telefonszam: '06-30-444-4444',
        szuletesi_datum: '2005-09-18',
        szemelyi_igazolvany_szam: '100004DDD',
        taj_szam: '100004DDD',
        diakigazolvany_szam: 'DIG2024-004',
        szulo_id: szulok[3].szulo_id,
        kapcsolat_tipusa: 'apa',
        cim_id: lakcimek[3].cim_id,
        nem: 'nő'
      },
      {
        nev: 'Bodnár Krisztina',
        email: 'bodnar.krisztina@student.hu',
        telefonszam: '06-30-555-5555',
        szuletesi_datum: '2006-01-25',
        szemelyi_igazolvany_szam: '100005EEE',
        taj_szam: '100005EEE',
        diakigazolvany_szam: 'DIG2024-005',
        szulo_id: szulok[4].szulo_id,
        kapcsolat_tipusa: 'anya',
        cim_id: lakcimek[4].cim_id,
        nem: 'nő'
      },
      {
        nev: 'Kiss Tamás',
        email: 'kiss.tamas@student.hu',
        telefonszam: '06-30-666-6666',
        szuletesi_datum: '2005-05-30',
        szemelyi_igazolvany_szam: '100006FFF',
        taj_szam: '100006FFF',
        diakigazolvany_szam: 'DIG2024-006',
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
    
    // Jelszavak hash-elése
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const studentPasswordHash = await bcrypt.hash('student123', 10);
    
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
        email: 'nagy.bernadett@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[0].diak_id  // Link to first student (Nagy Bernadett)
      },
      {
        username: 'student2',
        email: 'nagy.peter@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[1].diak_id  // Link to second student (Nagy Péter)
      },
      {
        username: 'student3',
        email: 'kovacs.zsofia@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[2].diak_id  // Link to third student (Kovács Zsófia)
      },
      {
        username: 'student4',
        email: 'szabo.katalin@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[3].diak_id  // Link to fourth student (Szabó Katalin)
      },
      {
        username: 'student5',
        email: 'bodnar.krisztina@student.hu',
        password: studentPasswordHash,
        admin: false,  // Diák
        diak_id: diaks[4].diak_id  // Link to fifth student (Bodnár Krisztina)
      },
      {
        username: 'student6',
        email: 'kiss.tamas@student.hu',
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
        uzenet: 'A szoba változtatási kérelmedet feldolgoztuk. Kérjük, várj türelmesen a döntésre.',
        elolvasva: false
      },
      {
        diak_id: diaks[4].diak_id,
        tipus: 'room_change_approved',
        uzenet: 'Gratulálunk! A szoba változtatási kérelmedet elfogadtuk. Az új szobaszámod: A-101. Kérjük, 3 munkanapon belül költözz át.',
        elolvasva: false
      },
      {
        diak_id: diaks[1].diak_id,
        tipus: 'room_change_pending',
        uzenet: 'Ne feledd, hogy a következő hónapban esedékes a szobafoglalás. Kérjük, ellenőrizd a számládat.',
        elolvasva: false
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
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Script futtatása
seedDatabase();
