const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const db = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration - read from environment variables
const getAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  // Fallback for development
  return ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
};

// Middleware
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
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
// Szoba route-ok inicializálása csak az adatbázis elérés után
let szobaRoutes;

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

    // Szoba route-ok inicializálása
    const SzobaRoutes = require('./routes/SzobaRoutes');
    app.use('/api/szobas', SzobaRoutes(app.locals.db));
    console.log('✓ Szoba route-ok inicializálva');

    // Szulo route-ok inicializálása
    app.use('/api/szulos', require('./routes/SzuloRoutes'));
    console.log('✓ Szulo route-ok inicializálva');

    // Lakcim route-ok inicializálása
    app.use('/api/lakcims', require('./routes/LakcimRoutes'));
    console.log('✓ Lakcim route-ok inicializálva');

    // Auth route-ok inicializálása
    app.use('/api/auth', require('./routes/authRoutes'));
    console.log('✓ Auth route-ok inicializálva');

    // Felhasznalo route-ok inicializálása
    app.use('/api/felhasznalos', require('./routes/FelhasznaloRoutes'));
    console.log('✓ Felhasznalo route-ok inicializálva');

    // SzobaValtoztatas route-ok inicializálása
    app.use('/api/szobavaltoztatas', require('./routes/SzobaValtoztatasRoutes'));
    console.log('✓ SzobaValtoztatas route-ok inicializálva');

    // 404 handler - csak most regisztráljuk, miután minden route be van állítva
    app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint nem található',
        path: req.path
      });
    });

    // Error handler - csak most regisztráljuk, miután minden route be van állítva
    app.use((err, req, res, next) => {
      console.error('Hiba:', err);
      res.status(err.status || 500).json({
        error: err.message || 'Szerver hiba',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

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
