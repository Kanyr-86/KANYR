const express = require('express');
const { testConnection } = require('./config/database');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser

// Alapértelmezett route
app.get('/', (req, res) => {
  res.json({
    message: 'KANYR - Kollégiumi Adatbázis Nyilvántartó Rendszer API',
    version: '1.0.0',
    status: 'running'
  });
});

// API végpontok
app.use('/api/diaks', require('./routes/DiakRoutes'));
// app.use('/api/szulos', require('./routes/szuloRoutes'));
// app.use('/api/szobak', require('./routes/szobaRoutes'));
// app.use('/api/bekoltozesek', require('./routes/bekoltozesRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint nem található',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Hiba:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Szerver hiba',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Szerver indítása
const startServer = async () => {
  try {
    // Adatbázis kapcsolat tesztelése
    await testConnection();
    
    // Adatbázis szinkronizálása (táblák létrehozása, ha nem léteznek)
    // { force: false } = csak akkor hoz létre táblákat, ha még nem léteznek
    // Ez megakadályozza a táblák felesleges újraépítését minden indításkor
    await db.sequelize.sync({ force: false });
    console.log('✓ Adatbázis szinkronizálva');
    
    // Database available to routes via app.locals
    app.locals.db = db;
    console.log('✓ Adatbázis elérhető a route-ok számára');
    
    // Szerver indítása
    app.listen(PORT, () => {
      console.log(`✓ Szerver fut a http://localhost:${PORT} címen`);
      console.log(`✓ Környezet: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Hiba a szerver indításakor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
