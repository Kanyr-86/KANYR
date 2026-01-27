const express = require('express');
const request = require('supertest');
const { Sequelize } = require('sequelize');
const app = express();

// Mock adatbázis inicializálása teszteléshez
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// Modell definíciók (egyszerűsített változatok)
const Diak = sequelize.define('Diak', {
  diak_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nev: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

const Szoba = sequelize.define('Szoba', {
  szoba_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  szoba_szama: {
    type: Sequelize.STRING,
    allowNull: false
  },
  osszes_hely: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
});

const SzobaBekoltozes = sequelize.define('SzobaBekoltozes', {
  bekoltozes_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  diak_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  szoba_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  bekoltozes_datum: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },
  kikoltozes_datum: {
    type: Sequelize.DATEONLY,
    allowNull: true
  }
});

// Kapcsolatok beállítása
SzobaBekoltozes.belongsTo(Diak, { foreignKey: 'diak_id', as: 'diak' });
SzobaBekoltozes.belongsTo(Szoba, { foreignKey: 'szoba_id', as: 'szoba' });

// Teszt endpoint létrehozása
app.use(express.json());

app.post('/api/szobas/bulk-bekoltozes', async (req, res) => {
  try {
    const { szoba_id, bekoltozes_datum, diak_ids } = req.body;

    // Alap validációk
    if (!szoba_id || !bekoltozes_datum || !diak_ids || !Array.isArray(diak_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Hiányzó vagy érvénytelen adatok'
      });
    }

    // Tranzakció kezdése
    const result = await sequelize.transaction(async (transaction) => {
      // Szoba ellenőrzése
      const szoba = await Szoba.findByPk(szoba_id, { transaction });
      if (!szoba) {
        throw new Error(`A ${szoba_id} ID-jú szoba nem található!`);
      }

      // Kapacitás ellenőrzése
      const currentOccupancy = await SzobaBekoltozes.count({
        where: {
          szoba_id: szoba_id,
          kikoltozes_datum: null
        },
        transaction
      });

      const availableCapacity = szoba.osszes_hely - currentOccupancy;
      
      if (diak_ids.length > availableCapacity) {
        throw new Error(`A szoba kapacitása nem elegendő! Szabad helyek: ${availableCapacity}, de ${diak_ids.length} diákot próbál átköltöztetni.`);
      }

      // Diákok ellenőrzése
      const uniqueDiakIds = [...new Set(diak_ids)];
      const diakok = await Diak.findAll({
        where: {
          diak_id: uniqueDiakIds
        },
        transaction
      });

      const foundDiakIds = diakok.map(d => d.diak_id);
      const missingDiakIds = uniqueDiakIds.filter(id => !foundDiakIds.includes(id));
      
      if (missingDiakIds.length > 0) {
        throw new Error(`A következő diák ID-k nem találhatók: ${missingDiakIds.join(', ')}`);
      }

      // Duplikáció ellenőrzése
      const existingBekoltozesek = await SzobaBekoltozes.findAll({
        where: {
          diak_id: uniqueDiakIds,
          szoba_id: szoba_id,
          kikoltozes_datum: null
        },
        transaction
      });

      const existingDiakIds = existingBekoltozesek.map(b => b.diak_id);
      if (existingDiakIds.length > 0) {
        throw new Error(`A következő diák ID-k már be vannak költözve ebbe a szobába: ${existingDiakIds.join(', ')}`);
      }

      // Tömeges beköltözés létrehozása
      const bekoltozesekData = uniqueDiakIds.map(diak_id => ({
        diak_id,
        szoba_id,
        bekoltozes_datum
      }));

      const createdBekoltozesek = await SzobaBekoltozes.bulkCreate(bekoltozesekData, { transaction });

      return {
        szoba_id: szoba_id,
        szoba_szama: szoba.szoba_szama,
        bekoltozes_datum: bekoltozes_datum,
        total_students: uniqueDiakIds.length,
        transfers: createdBekoltozesek.map(bekoltozes => ({
          diak_id: bekoltozes.diak_id,
          bekoltozes_id: bekoltozes.bekoltozes_id,
          status: 'success'
        }))
      };
    });

    res.status(201).json({
      success: true,
      message: 'Tömeges beköltözés sikeresen végrehajtva',
      data: result
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Tesztek futtatása
async function runTests() {
  try {
    // Adatbázis inicializálása
    await sequelize.sync({ force: true });

    // Tesztadatok létrehozása
    const szoba = await Szoba.create({
      szoba_szama: 'A101',
      osszes_hely: 4
    });

    const diak1 = await Diak.create({
      nev: 'Kiss János',
      email: 'kiss.janos@example.com'
    });

    const diak2 = await Diak.create({
      nev: 'Nagy Mari',
      email: 'nagy.mari@example.com'
    });

    const diak3 = await Diak.create({
      nev: 'Szabó Péter',
      email: 'szabo.peter@example.com'
    });

    console.log('🧪 Tömeges beköltözés tesztek futtatása...\n');

    // Teszt 1: Sikeres tömeges beköltözés
    console.log('✅ Teszt 1: Sikeres tömeges beköltözés');
    const response1 = await request(app)
      .post('/api/szobas/bulk-bekoltozes')
      .send({
        szoba_id: szoba.szoba_id,
        bekoltozes_datum: '2024-09-01',
        diak_ids: [diak1.diak_id, diak2.diak_id, diak3.diak_id]
      });

    console.log('Válasz:', JSON.stringify(response1.body, null, 2));
    console.log('Státusz:', response1.status);
    console.log('');

    // Teszt 2: Kapacitás túllépés
    console.log('❌ Teszt 2: Kapacitás túllépés (várható hiba)');
    const response2 = await request(app)
      .post('/api/szobas/bulk-bekoltozes')
      .send({
        szoba_id: szoba.szoba_id,
        bekoltozes_datum: '2024-09-01',
        diak_ids: [diak1.diak_id, diak2.diak_id, diak3.diak_id, 999, 888] // Túl sok diák
      });

    console.log('Válasz:', JSON.stringify(response2.body, null, 2));
    console.log('Státusz:', response2.status);
    console.log('');

    // Teszt 3: Nem létező diák
    console.log('❌ Teszt 3: Nem létező diák (várható hiba)');
    const response3 = await request(app)
      .post('/api/szobas/bulk-bekoltozes')
      .send({
        szoba_id: szoba.szoba_id,
        bekoltozes_datum: '2024-09-01',
        diak_ids: [diak1.diak_id, 99999] // Nem létező diák
      });

    console.log('Válasz:', JSON.stringify(response3.body, null, 2));
    console.log('Státusz:', response3.status);
    console.log('');

    // Teszt 4: Duplikált diák ID-k
    console.log('✅ Teszt 4: Duplikált diák ID-k (egyedieként kezelve)');
    const response4 = await request(app)
      .post('/api/szobas/bulk-bekoltozes')
      .send({
        szoba_id: szoba.szoba_id,
        bekoltozes_datum: '2024-09-01',
        diak_ids: [diak1.diak_id, diak1.diak_id, diak2.diak_id] // Duplikált ID
      });

    console.log('Válasz:', JSON.stringify(response4.body, null, 2));
    console.log('Státusz:', response4.status);
    console.log('');

    console.log('🎉 Összes teszt lefutott!');

  } catch (error) {
    console.error('❌ Tesztek futtatása közben hiba:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Tesztek futtatása, ha ezt a fájlt közvetlenül futtatják
if (require.main === module) {
  runTests();
}

module.exports = { app, runTests };