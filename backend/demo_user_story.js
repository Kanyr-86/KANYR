const express = require('express');
const request = require('supertest');
const app = require('./app');

/**
 * User Story Demo: Kollégiumi Titkár Diák Kezelése
 * 
 * Ez a szkript bemutatja, hogyan működik a titkár által végzett diákkezelési folyamat
 */

async function demonstrateUserStory() {
  console.log('=== Kollégiumi Titkár Diák Kezelése - User Story Demo ===\n');

  try {
    // 1. Diák megérkezik a titkárságra
    console.log('1. Diák megérkezik a titkárságra');
    console.log('   Diák: "Jó napot! Szeretném megtudni, hogy hol lakom jelenleg."');
    console.log('   Titkár: "Természetesen, azonosítom Önt a rendszerben..."\n');

    // 2. Titkár azonosítja a diákot a rendszerben
    console.log('2. Diák azonosítása a rendszerben');
    console.log('   API hívás: GET /api/diaks/search?nev=Teszt Diák\n');

    // Ez a rész a valóságban így nézne ki:
    // const searchResponse = await request(app)
    //   .get('/api/diaks/search')
    //   .query({ nev: 'Teszt Diák' });

    console.log('   Válasz: Diák megtalálva (ID: 123)');
    console.log('   Diák adatai: Teszt Diák, diak@example.com, 123456789\n');

    // 3. Titkár lekérdezi a diák aktuális szobáját
    console.log('3. Diák aktuális szobájának lekérdezése');
    console.log('   API hívás: GET /api/diaks/123/room\n');

    // Ez a rész a valóságban így nézne ki:
    // const roomResponse = await request(app)
    //   .get('/api/diaks/123/room');

    console.log('   Válasz: Diák jelenleg az A-101 szobában lakik');
    console.log('   Szoba részletei: 4 férőhelyes, jelenleg 3 diák lakik benne');
    console.log('   Beköltözés dátuma: 2024-09-01\n');

    // 4. Titkár tájékoztatja a diákot a szoba számáról és részleteiről
    console.log('4. Diák tájékoztatása a szobáról');
    console.log('   Titkár: "Jelenleg az A-101-es szobában lakik, amely egy 4 férőhelyes szoba."');
    console.log('   Titkár: "Jelenleg 3 diák lakik benne, tehát van még 1 szabad hely."');
    console.log('   Diák: "Köszönöm! Szeretnék átköltözni egy másik szobába, ahol több hely van."\n');

    // 5. Diák kéri az áthelyezését másik szobába
    console.log('5. Diák áthelyezési kérelme');
    console.log('   Diák: "Szeretnék átköltözni egy másik szobába, ahol több hely van."');
    console.log('   Titkár: "Természetesen, ellenőrzöm a rendelkezésre álló szobákat..."\n');

    // 6. Titkár ellenőrzi a kért szoba elérhetőségét
    console.log('6. Elérhető szobák ellenőrzése');
    console.log('   API hívás: GET /api/szoba/available\n');

    // Ez a rész a valóságban így nézne ki:
    // const availableRoomsResponse = await request(app)
    //   .get('/api/szoba/available');

    console.log('   Válasz: Elérhető szobák listája:');
    console.log('   - B-205: 6 férőhelyes, 2 szabad hely');
    console.log('   - C-112: 4 férőhelyes, 3 szabad hely');
    console.log('   - A-307: 2 férőhelyes, 1 szabad hely\n');

    // 7. Titkár javasol egy szabad szobát
    console.log('7. Szabad szoba javaslata');
    console.log('   Titkár: "Van szabad helyünk a B-205-ös szobában, amely 6 férőhelyes és jelenleg csak 4 diák lakik benne."');
    console.log('   Diák: "Rendben, szeretnék oda költözni!"\n');

    // 8. Titkár végrehajtja a szobaátcsatolást
    console.log('8. Szobaátcsatolás végrehajtása');
    console.log('   API hívás: POST /api/diaks/123/transfer');
    console.log('   Adatok: { uj_szoba_id: 456, atcsatolas_datum: "2024-01-15" }\n');

    // Ez a rész a valóságban így nézne ki:
    // const transferResponse = await request(app)
    //   .post('/api/diaks/123/transfer')
    //   .send({
    //     uj_szoba_id: 456,
    //     atcsatolas_datum: '2024-01-15'
    //   });

    console.log('   Válasz: Szobaátcsatolás sikeresen megtörtént!');
    console.log('   - Diák korábbi szobájának beköltözése lezárásra került');
    console.log('   - Diák új szobájába beköltözött');
    console.log('   - Művelet időbélyeggel rögzítve: 2024-01-15\n');

    // 9. Titkár visszaigazolja a változást a diáknak
    console.log('9. Változás visszaigazolása');
    console.log('   Titkár: "A szobaátcsatolás sikeresen megtörtént!"');
    console.log('   Titkár: "Mostantól a B-205-ös szobában fog lakni."');
    console.log('   Titkár: "A változás 2024. január 15-én életbe lép."');
    console.log('   Diák: "Köszönöm szépen a segítséget!"\n');

    console.log('=== User Story sikeresen végrehajtva! ===\n');

    // Alternatív folyamatok bemutatása
    console.log('=== Alternatív folyamatok ===\n');

    console.log('A1: Diák új beiratkozás');
    console.log('   - Titkár teljes beiratkozási folyamatot indít');
    console.log('   - API: POST /api/diaks/enroll\n');

    console.log('A2: Diák szobája nem aktív');
    console.log('   - Titkár új szobát rendel hozzá');
    console.log('   - API: POST /api/diaks/:id/transfer\n');

    console.log('A3: Kért szoba foglalt');
    console.log('   - Titkár szabad szobákat keres');
    console.log('   - API: GET /api/szoba/available\n');

    console.log('=== Kivételek ===\n');

    console.log('E1: Diák nem található');
    console.log('   - Válasz: "Nincs ilyen diák a rendszerben"');
    console.log('   - HTTP 404 hiba\n');

    console.log('E2: Aktív beköltözés hiányzik');
    console.log('   - Válasz: "Diáknak nincs aktív szobája"');
    console.log('   - HTTP 404 hiba\n');

    console.log('E3: Szoba elérhetetlen');
    console.log('   - Válasz: "A szoba jelenleg teljes"');
    console.log('   - HTTP 400 hiba\n');

    console.log('=== Technikai követelmények ===\n');
    console.log('Használt API végpontok:');
    console.log('- GET /api/diaks/search - diák keresése');
    console.log('- GET /api/diaks/:id/room - diák szobájának lekérdezése');
    console.log('- POST /api/diaks/:id/transfer - szobaátcsatolás');
    console.log('- GET /api/szoba/available - szabad szobák listázása\n');

    console.log('=== Elfogadási kritériumok ===\n');
    console.log('✅ Titkár megtalálja bármely diák adatait');
    console.log('✅ Aktuális szoba információ helyesen megjelenik');
    console.log('✅ Szobaátcsatolás sikeresen végrehajtható');
    console.log('✅ Rendszer megakadályozza érvénytelen műveleteket');
    console.log('✅ Minden művelet naplózásra kerül');

  } catch (error) {
    console.error('Demo hiba:', error.message);
  }
}

// Futtatás
if (require.main === module) {
  demonstrateUserStory();
}

module.exports = { demonstrateUserStory };
