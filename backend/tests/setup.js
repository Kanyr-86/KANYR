/**
 * Jest test setup fájl a KANYR backendhez
 * SQLite in-memory adatbázist hoz létre és inicializálja a modelleket
 */

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// Globális változók a tesztek számára
let sequelize;
let db;

/**
 * In-memory adatbázis inicializálása
 */
async function initializeDatabase() {
  // SQLite in-memory adatbázis létrehozása
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false, // SQL naplózás kikapcsolása tesztek közben
    define: {
      freezeTableName: false,
      underscored: true,
    }
  });

  // Modellek betöltése
  db = {};

  const modelFiles = fs.readdirSync(path.join(__dirname, '../models'))
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== 'index.js' &&
        file.slice(-3) === '.js'
      );
    });

  for (const file of modelFiles) {
    const model = require(path.join(__dirname, '../models', file))(sequelize);
    db[model.name] = model;
  }

  // Kapcsolatok létrehozása
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;

  // Táblák szinkronizálása
  await sequelize.sync({ force: true });

  return db;
}

/**
 * Teszt adatok feltöltése az adatbázisba
 */
async function seedTestData() {
  // Lakcím létrehozása
  const lakcim = await db.Lakcim.create({
    orszag: 'Magyarország',
    iranyitoszam: '1234',
    varos: 'Budapest',
    utca_hazszam: 'Teszt utca 1.'
  });

  // Szülő létrehozása
  const szulo = await db.Szulo.create({
    nev: 'Teszt Szülő',
    email: 'szulo@test.hu',
    telefonszam: '+36301234567',
    szemelyi_igazolvany_szam: '123456AB',
    cim_id: lakcim.cim_id
  });

  // Szoba létrehozása
  const szoba = await db.Szoba.create({
    szoba_szama: '101',
    osszes_hely: 2
  });

  // Diák létrehozása
  const diak = await db.Diak.create({
    nev: 'Teszt Diák',
    email: 'diak@test.hu',
    telefonszam: '+36309876543',
    szuletesi_datum: '2000-01-01',
    szemelyi_igazolvany_szam: '654321CD',
    taj_szam: '123456789',
    diakigazolvany_szam: 'DI123456',
    szulo_id: szulo.szulo_id,
    kapcsolat_tipusa: 'apa',
    cim_id: lakcim.cim_id,
    nem: 'férfi'
  });

  // Admin felhasználó létrehozása
  const hashedAdminPassword = await bcrypt.hash('admin12345678', 10);
  const adminUser = await db.Felhasznalo.create({
    username: 'admin',
    email: 'admin@test.hu',
    password: hashedAdminPassword,
    admin: true
  });

  // Normál felhasználó létrehozása
  const hashedUserPassword = await bcrypt.hash('user12345678', 10);
  const normalUser = await db.Felhasznalo.create({
    username: 'user',
    email: 'user@test.hu',
    password: hashedUserPassword,
    admin: false,
    diak_id: diak.diak_id
  });

  return {
    lakcim,
    szulo,
    szoba,
    diak,
    adminUser,
    normalUser
  };
}

/**
 * Adatbázis tisztítása
 */
async function cleanDatabase() {
  if (db) {
    await sequelize.sync({ force: true });
  }
}

/**
 * Adatbázis kapcsolat lezárása
 */
async function closeDatabase() {
  if (sequelize) {
    await sequelize.close();
  }
}

// Jest globális hookok
beforeAll(async () => {
  // Környezeti változók beállítása tesztekhez
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_minimum_32_chars';
  process.env.JWT_EXPIRES_IN = '1h';

  // Adatbázis inicializálása
  global.__DB__ = await initializeDatabase();
  global.__TEST_DATA__ = await seedTestData();
});

afterAll(async () => {
  await closeDatabase();
});

// Export a tesztek számára
module.exports = {
  getDb: () => global.__DB__,
  getTestData: () => global.__TEST_DATA__,
  initializeDatabase,
  seedTestData,
  cleanDatabase,
  closeDatabase
};