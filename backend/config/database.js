const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config();

// SQLite adatbázis konfiguráció
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: process.env.NODE_ENV === 'production' ? false : logger.logQuery, // SQL lekérdezések naplózása (csak development)
  define: {
    // Alapértelmezett beállítások minden modellhez
    freezeTableName: false, // Sequelize automatikusan többesszámúvá alakítja a táblaneveket
    underscored: true, // snake_case használata camelCase helyett
  },
  dialectOptions: {
    // Engedélyezi az idegen kulcs korlátozásokat SQLite-ban
    foreignKeys: true
  },
  // Explicitan engedélyezzük a foreign key constraint-eket SQLite-ban
  hooks: {
    afterConnect: async (connection) => {
      await connection.run('PRAGMA foreign_keys = ON');
    }
  }
});

// Adatbázis kapcsolat tesztelése
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✓ Sikeres adatbázis kapcsolat létrehozva');
  } catch (error) {
    logger.error('✗ Nem sikerült kapcsolódni az adatbázishoz', { error: error.message, stack: error.stack });
  }
};

module.exports = { sequelize, testConnection };
