const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');
const db = require('./models');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { detectSuspiciousActivity, trackSensitiveOperations } = require('./middleware/securityMiddleware');
const { NotFoundError } = require('./utils/AppError');
const logger = require('./utils/logger');
const TokenBlacklistService = require('./services/TokenBlacklistService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS konfiguráció - környezeti változókból olvasva
const getAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  // Tartalék érték fejlesztéshez
  return ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
};

// Middleware-ek
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Biztonsági fejlécek Helmet-tel
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

// Kérés naplózó middleware
app.use(requestLogger);

// Biztonsági middleware-ek
app.use(detectSuspiciousActivity);
app.use(trackSensitiveOperations);

// Rate limiting konfiguráció
// Szigorú limiter hitelesítési végpontokhoz - megakadályozza a brute force támadásokat
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Túl sok bejelentkezési kísérlet. Kérjük, próbálja újra 15 perc múlva.',
    retryAfter: 15 * 60
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests, even successful ones
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

// Nagyon szigorú limiter jelszó visszaállítási műveletekhez - védelem brute force támadások ellen
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 óra
  max: 3, // Maximum 3 jelszó visszaállítás óránként IP címenként
  message: {
    error: 'Túl sok jelszó visszaállítási kísérlet. Kérjük, próbálja újra 1 óra múlva.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Minden kérést számolunk, még a sikereseket is
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded for password reset', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent']
    });
    res.status(429).json(options.message);
  }
});

// Szigorú limiter érzékeny admin műveletekhez (make-admin, remove-admin, force-logout)
const adminActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 perc
  max: 10, // Maximum 10 admin művelet 15 percenként IP címenként
  message: {
    error: 'Túl sok admin művelet. Kérjük, próbálja újra 15 perc múlva.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded for admin actions', {
      ip: req.ip,
      userId: req.user?.userId,
      path: req.path
    });
    res.status(429).json(options.message);
  }
});

// Általános API limiter írási műveletekhez (POST, PUT, DELETE)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 write requests per windowMs
  message: {
    error: 'Túl sok kérés érkezett. Kérjük, próbálja újra később.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

// Megengedőbb limiter csak olvasási végpontokhoz (GET kérések)
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 read requests per windowMs
  message: {
    error: 'Túl sok kérés érkezett. Kérjük, próbálja újra később.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

// Rate limiting alkalmazása auth route-okra (legszigorúbb limitek)
app.use('/api/auth/login', authLimiter);

// Szigorú rate limiting jelszó visszaállítási végpontokhoz - védelem brute force ellen
app.use('/api/users/:id/reset-password', passwordResetLimiter);

// Rate limiting érzékeny admin műveletekhez
app.use('/api/users/:id/make-admin', adminActionLimiter);
app.use('/api/users/:id/remove-admin', adminActionLimiter);
app.use('/api/users/:id/force-logout', adminActionLimiter);

// Írási limiter alkalmazása az összes route-ra (felül lesz írva az olvasási limiterrel GET kéréseknél)
app.use('/api', writeLimiter);

// Olvasási limiter alkalmazása kifejezetten GET kérésekhez (megengedőbb)
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    return readLimiter(req, res, next);
  }
  next();
});

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
    await db.sequelize.sync({ force: false });
    logger.info('✓ Adatbázis szinkronizálva');
    
    // Database available to routes via app.locals
    app.locals.db = db;
    logger.info('✓ Adatbázis elérhető a route-ok számára');

    // Student route-ok inicializálása (az adatbázis után, hogy app.locals.db elérhető legyen)
    app.use('/api/students', require('./routes/DiakRoutes'));
    logger.info('✓ Student route-ok inicializálva');

    // Room route-ok inicializálása
    const SzobaRoutes = require('./routes/SzobaRoutes');
    app.use('/api/rooms', SzobaRoutes(app.locals.db));
    logger.info('✓ Room route-ok inicializálva');

    // Parent route-ok inicializálása
    app.use('/api/parents', require('./routes/SzuloRoutes'));
    logger.info('✓ Parent route-ok inicializálva');

    // Address route-ok inicializálása
    app.use('/api/addresses', require('./routes/LakcimRoutes'));
    logger.info('✓ Address route-ok inicializálva');

    // Auth route-ok inicializálása
    app.use('/api/auth', require('./routes/authRoutes'));
    logger.info('✓ Auth route-ok inicializálva');

    // User route-ok inicializálása
    app.use('/api/users', require('./routes/FelhasznaloRoutes'));
    logger.info('✓ User route-ok inicializálva');

    // Room change route-ok inicializálása
    app.use('/api/room-changes', require('./routes/SzobaValtoztatasRoutes'));
    logger.info('✓ Room change route-ok inicializálva');

// 404 kezelő - csak most regisztráljuk, miután minden route be van állítva
    app.use((req, res, next) => {
      next(new NotFoundError('Endpoint'));
    });

    // Globális hibakezelő - csak most regisztráljuk, miután minden route be van állítva
    app.use(errorHandler);

    // Szerver indítása
    app.listen(PORT, () => {
      logger.info(`✓ Szerver fut a http://localhost:${PORT} címen`);
      logger.info(`✓ Környezet: ${process.env.NODE_ENV || 'development'}`);
    });

    // Időzített takarítás - lejárt tokenek törlése a feketelistáról (24 óránként)
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 óra
    const tokenBlacklistService = new TokenBlacklistService(db);

    const cleanupExpiredTokens = async () => {
      try {
        const deleted = await tokenBlacklistService.cleanupExpiredTokens();
        logger.info('Expired token cleanup completed', { deletedCount: deleted });
      } catch (error) {
        logger.error('Error during token cleanup', { error: error.message });
      }
    };

    // Első takarítás indításkor
    cleanupExpiredTokens();

    // Időzített takarítás beállítása
    setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL);
    logger.info('✓ Token blacklist cleanup scheduler initialized');
  } catch (error) {
    logger.error('✗ Hiba a szerver indításakor', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();

module.exports = app;
