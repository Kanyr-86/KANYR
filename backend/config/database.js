const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// SQLite adatbázis konfiguráció
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: process.env.NODE_ENV === 'production' ? false : console.log, // SQL lekérdezések naplózása (csak development)
  define: {
    // Alapértelmezett beállítások minden modellhez
    freezeTableName: false, // Sequelize automatikusan többesszámúvá alakítja a táblaneveket
    underscored: true, // snake_case használata camelCase helyett
  }
});

// Adatbázis kapcsolat tesztelése
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Sikeres adatbázis kapcsolat létrehozva');
  } catch (error) {
    console.error('✗ Nem sikerült kapcsolódni az adatbázishoz:', error);
  }
};

module.exports = { sequelize, testConnection };
