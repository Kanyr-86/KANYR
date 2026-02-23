const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { testConnection } = require('./config/database');
const db = require('./models');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { NotFoundError } = require('./utils/AppError');
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

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
}));

app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser

// Request logging middleware
app.use(requestLogger);

// Alapértelmezett route
app.get('/', (req, res) => {
  res.json({
    message: 'KANYR - Kollégiumi Adatbázis Nyilvántartó Rendszer API',
    version: '1.0.0',
    status: 'running'
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

    // Diak route-ok inicializálása (az adatbázis után, hogy app.locals.db elérhető legyen)
    app.use('/api/diaks', require('./routes/DiakRoutes'));
    console.log('✓ Diak route-ok inicializálva');

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
    app.use((req, res, next) => {
      next(new NotFoundError('Endpoint'));
    });

    // Global error handler - csak most regisztráljuk, miután minden route be van állítva
    app.use(errorHandler);

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
