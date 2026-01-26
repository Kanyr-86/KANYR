const { sequelize } = require('./config/database');
const bcrypt = require('bcrypt');

async function createTestData() {
  try {
    // Felhasználó létrehozása
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await sequelize.query(
      'INSERT INTO felhasznalos (username, email, password, admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      {
        replacements: ['admin', 'admin@kanyr.hu', hashedPassword, true, new Date(), new Date()],
        type: sequelize.QueryTypes.INSERT
      }
    );

    console.log('✓ Admin felhasználó létrehozva:', user);

    // Lakcím létrehozása
    const lakcim = await sequelize.query(
      'INSERT INTO lakcims (orszag, iranyitoszam, varos, utca_hazszam, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      {
        replacements: ['Magyarország', '7621', 'Pécs', 'Új utca 25.', new Date(), new Date()],
        type: sequelize.QueryTypes.INSERT
      }
    );

    console.log('✓ Lakcím létrehozva:', lakcim);

    // Szülő létrehozása
    const szulo = await sequelize.query(
      'INSERT INTO szulos (nev, email, telefonszam, szemelyi_igazolvany_szam, cim_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      {
        replacements: ['Szülő Anna', 'szulo.anna@email.hu', '06-70-888-9999', '111111111', 1, new Date(), new Date()],
        type: sequelize.QueryTypes.INSERT
      }
    );

    console.log('✓ Szülő létrehozva:', szulo);

    // Diák létrehozása
    const diak = await sequelize.query(
      'INSERT INTO diaks (nev, email, telefonszam, szuletesi_datum, szemelyi_igazolvany_szam, taj_szam, diakigazolvany_szam, szulo_id, kapcsolat_tipusa, cim_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      {
        replacements: [
          'Teszt Diák', 'teszt.djak@email.hu', '06-30-555-1234', '2005-07-20', 
          '111222333', '444555666', '777888999', 1, 'anya', 1, new Date(), new Date()
        ],
        type: sequelize.QueryTypes.INSERT
      }
    );

    console.log('✓ Diák létrehozva:', diak);

    // Szoba létrehozása
    const szoba = await sequelize.query(
      'INSERT INTO szobas (szoba_szama, osszes_hely, created_at, updated_at) VALUES (?, ?, ?, ?)',
      {
        replacements: ['A-101', 4, new Date(), new Date()],
        type: sequelize.QueryTypes.INSERT
      }
    );

    console.log('✓ Szoba létrehozva:', szoba);

    console.log('✅ Összes tesztadat létrehozva!');

  } catch (error) {
    console.error('❌ Hiba a tesztadatok létrehozásakor:', error);
  }
}

createTestData();
