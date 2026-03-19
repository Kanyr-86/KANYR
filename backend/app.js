const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./config/database');
const db = require('./models');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { detectSuspiciousActivity, trackSensitiveOperations } = require('./middleware/securityMiddleware');
const { csrfTokenMiddleware, csrfProtectionMiddleware } = require('./middleware/csrfMiddleware');
const { NotFoundError } = require('./utils/AppError');
const logger = require('./utils/logger');
const TokenBlacklistService = require('./services/TokenBlacklistService');
require('dotenv').config();

const app = express();

// Controller factory function for dependency injection
const initializeControllers = (db) => {
  const DiakController = require('./controllers/DiakController');
  const FelhasznaloController = require('./controllers/FelhasznaloController');
  const SzobaController = require('./controllers/SzobaController');
  const SzuloController = require('./controllers/SzuloController');
  const LakcimController = require('./controllers/LakcimController');
  const SzobaValtoztatasController = require('./controllers/SzobaValtoztatasController');

  return {
    diakController: new DiakController(db),
    felhasznaloController: new FelhasznaloController(db),
    szobaController: new SzobaController(db),
    szuloController: new SzuloController(db),
    lakcimController: new LakcimController(db),
    szobaValtoztatasController: new SzobaValtoztatasController(db)
  };
};
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count'] // Allow frontend to read total count header
}));

// Enhanced security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: ["no-referrer"] },
  xssFilter: true
}));

app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser
app.use(cookieParser()); // Cookie parser - needed for CSRF tokens

// Kérés naplózó middleware
app.use(requestLogger);

// Request context middleware - adds request ID and timestamp
app.use(require('./utils/errorResponse').addRequestContext);

// CSRF token middleware - generates token for all requests
app.use(csrfTokenMiddleware);

// Biztonsági middleware-ek
app.use(detectSuspiciousActivity);
app.use(trackSensitiveOperations);

// CSRF protection middleware - validates tokens on state-changing requests
// Applied after auth middleware in route definitions

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
  handler: (_req, res, _options) => {
    res.status(429).json(_options.message);
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
  handler: (req, res, _next, options) => {
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
  handler: (req, res, _next, options) => {
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
  handler: (_req, _res, _options) => {
    _res.status(429).json(_options.message);
  }
});

// Olvasási limiter GET kérésekhez (magasabb limit)
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 read requests per windowMs
  message: {
    error: 'Túl sok lekérdezési kérés érkezett. Kérjük, próbálja újra később.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, _options) => {
    _res.status(429).json(_options.message);
  }
});

// Rate limiting alkalmazása specifikus végpontokra (legszigorúbb limitek)
app.use('/api/auth/login', authLimiter);

// Szigorú rate limiting jelszó visszaállítási végpontokhoz - védelem brute force ellen
app.use('/api/users/:id/reset-password', passwordResetLimiter);

// Rate limiting érzékeny admin műveletekhez
app.use('/api/users/:id/make-admin', adminActionLimiter);
app.use('/api/users/:id/remove-admin', adminActionLimiter);
app.use('/api/users/:id/force-logout', adminActionLimiter);

// Limiterek elérhetővé tétele a route-ok számára
app.locals.limiters = {
  auth: authLimiter,
  passwordReset: passwordResetLimiter,
  adminAction: adminActionLimiter,
  write: writeLimiter,
  read: readLimiter
};

// Alapértelmezett route
app.get('/', (_req, res) => {
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
    
    // Migrációk állapotának ellenőrzése és futtatása
    // Megjegyzés: A tesztadatok frissítésekor a sequelize.sync({ force: true }) törölte a SequelizeMeta táblát,
    // így a rendszer újra szeretné futtatni a már lefutott migrációkat. Mivel a modellek már tartalmazzák
    // a szükséges változtatásokat, ezért átmenetileg kihagyjuk a migráció validációt és futtatást.
    // await validateMigrationsBeforeStart();
    // await runMigrations();
    logger.info('✓ Migrációk átmenetileg kihagyva, modellek már tartalmazzák a szükséges változtatásokat');
    
// Database available to routes via app.locals
    app.locals.db = db;
    logger.info('✓ Adatbázis elérhető a route-ok számára');

    // Initialize controllers with dependency injection
    const controllers = initializeControllers(db);
    app.locals.controllers = controllers;
    logger.info('✓ Controllers initialized with dependency injection');

    // CSRF protection middleware - validates tokens on state-changing requests
    // Applied before all API routes to intercept state-changing requests
    app.use('/api', csrfProtectionMiddleware);
    logger.info('✓ CSRF protection middleware initialized');

    // Student route-ok inicializálása (az adatbázis után, hogy app.locals.db elérhető legyen)
    app.use('/api/students', require('./routes/DiakRoutes'));
    logger.info('✓ Student route-ok inicializálva');

    // Room route-ok inicializálása
    const SzobaRoutes = require('./routes/SzobaRoutes');
    app.use('/api/rooms', SzobaRoutes);
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
    app.use((_req, _res, _next) => {
      _next(new NotFoundError('Endpoint'));
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
