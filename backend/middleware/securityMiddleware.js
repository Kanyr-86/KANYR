const logger = require('../utils/logger');
const FelhasznaloService = require('../services/FelhasznaloService');
const FelhasznaloRepository = require('../repositories/FelhasznaloRepository');

/**
 * Security Middleware - Gyanús tevékenységek észlelése és kezelése
 * Nyomon követi a potenciálisan veszélyes műveleteket és automatikusan
 * érvényteleníti a tokeneket szükség esetén.
 */

// Emlékezzünk a kérések számára IP-címenként és felhasználónként
const requestTracker = new Map();
const SUSPICIOUS_THRESHOLD = 10; // 10 gyanús kérés 5 percben
const TRACKING_WINDOW = 5 * 60 * 1000; // 5 perc

/**
 * Kérés nyomkövető - számolja a kéréseket IP és felhasználó alapján
 */
class RequestTracker {
  constructor() {
    this.requests = new Map();
  }

  /**
   * Kérés hozzáadása a nyomkövetőhöz
   * @param {string} key - Azonosító (IP vagy userId)
   * @returns {number} - Kérések száma az ablakban
   */
  addRequest(key) {
    const now = Date.now();

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key);
    timestamps.push(now);

    // Régi kérések törlése
    const cutoff = now - TRACKING_WINDOW;
    const filtered = timestamps.filter(ts => ts > cutoff);
    this.requests.set(key, filtered);

    return filtered.length;
  }

  /**
   * Kérések számának lekérdezése
   * @param {string} key - Azonosító
   * @returns {number} - Kérések száma
   */
  getCount(key) {
    if (!this.requests.has(key)) {
      return 0;
    }

    const now = Date.now();
    const cutoff = now - TRACKING_WINDOW;
    const timestamps = this.requests.get(key);
    return timestamps.filter(ts => ts > cutoff).length;
  }

  /**
   * Statisztikák lekérdezése
   * @param {string} key - Azonosító
   * @returns {Object} - Statisztikák
   */
  getStats(key) {
    const count = this.getCount(key);
    return {
      count,
      isSuspicious: count > SUSPICIOUS_THRESHOLD,
      threshold: SUSPICIOUS_THRESHOLD
    };
  }
}

const tracker = new RequestTracker();

/**
 * Middleware - Gyanús tevékenység észlelése
 * Nyomon követi a kérések gyakoriságát és jelzi a gyanús mintákat
 */
function detectSuspiciousActivity(req, res, next) {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user?.userId;
    const key = userId ? `user:${userId}` : `ip:${ip}`;

    // Kérés hozzáadása a nyomkövetőhöz
    const count = tracker.addRequest(key);
    const stats = tracker.getStats(key);

    // Ha gyanús tevékenységet észlelünk, naplózzuk
    if (stats.isSuspicious) {
      logger.warn('Suspicious activity detected', {
        key,
        ip,
        userId,
        requestCount: count,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent']
      });

      // Ha bejelentkezett felhasználóról van szó, jelöljük meg
      if (userId && req.app.locals.db) {
        const db = req.app.locals.db;
        const felhasznaloService = new FelhasznaloService(db, {
          repository: new FelhasznaloRepository(db)
        });

        felhasznaloService.flagSuspiciousActivity(userId, {
          type: 'high_request_rate',
          ip,
          requestCount: count,
          path: req.path,
          method: req.method,
          userAgent: req.headers['user-agent']
        }).catch(error => {
          logger.error('Error flagging suspicious activity', { error: error.message, userId });
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error in suspicious activity detection', { error: error.message });
    next();
  }
}

/**
 * Middleware - Nem szokványos műveletek észlelése
 * Például: admin jogosultságok megváltoztatása, jelszó változtatás stb.
 */
function trackSensitiveOperations(req, res, next) {
  const sensitivePaths = [
    { path: '/password', methods: ['POST'], name: 'password_change' },
    { path: '/reset-password', methods: ['POST'], name: 'password_reset' },
    { path: '/make-admin', methods: ['POST'], name: 'grant_admin' },
    { path: '/remove-admin', methods: ['POST'], name: 'revoke_admin' },
    { path: '/force-logout', methods: ['POST'], name: 'force_logout' }
  ];

  const isSensitive = sensitivePaths.some(op =>
    req.path.includes(op.path) && op.methods.includes(req.method)
  );

  if (isSensitive && req.user) {
    logger.info('Sensitive operation detected', {
      userId: req.user.userId,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }

  next();
}

/**
 * Middleware - IP cím változás észlelése
 * Ha a felhasználó IP címe hirtelen megváltozik, az gyanús lehet
 */
function detectIPChange(req, res, next) {
  if (!req.user) {
    return next();
  }

  const currentIP = req.ip || req.connection.remoteAddress;
  const userId = req.user.userId;

  // Ellenőrizzük az IP címet a token metadata-ban (ha van)
  if (req.tokenInfo && req.tokenInfo.decoded) {
    const tokenIP = req.tokenInfo.decoded.ip;

    if (tokenIP && tokenIP !== currentIP) {
      logger.warn('IP address change detected', {
        userId,
        tokenIP,
        currentIP,
        path: req.path
      });

      // Ha szükséges, itt értesíthetjük a felhasználót vagy érvényteleníthetjük a tokent
      // Ez a funkció kikapcsolható, ha a mobil felhasználók gyakran változtatnak hálózatot
    }
  }

  next();
}

/**
 * Middleware - Új eszköz/location észlelése
 * Jelzi, ha a felhasználó egy új eszközről vagy helyről jelentkezik be
 */
function detectNewDevice(req, res, next) {
  if (!req.user || req.path !== '/api/auth/login') {
    return next();
  }

  const userAgent = req.headers['user-agent'];
  const ip = req.ip || req.connection.remoteAddress;

  logger.info('Login attempt', {
    userId: req.user.userId,
    userAgent,
    ip,
    timestamp: new Date().toISOString()
  });

  next();
}

/**
 * Rate limiting helper - visszaszámláló a rate limithez
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 perc
    maxRequests = 100,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress
  } = options;

  const requests = new Map();

  return function rateLimiter(req, res, next) {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const timestamps = requests.get(key);
    timestamps.push(now);

    // Régi kérések törlése
    const cutoff = now - windowMs;
    const filtered = timestamps.filter(ts => ts > cutoff);
    requests.set(key, filtered);

    if (filtered.length > maxRequests) {
      logger.warn('Rate limit exceeded', {
        key,
        count: filtered.length,
        max: maxRequests
      });

      return res.status(429).json({
        success: false,
        error: 'Túl sok kérés. Kérjük, próbálja újra később.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Rate limit header-ek hozzáadása
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - filtered.length));
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
}

module.exports = {
  detectSuspiciousActivity,
  trackSensitiveOperations,
  detectIPChange,
  detectNewDevice,
  createRateLimiter,
  requestTracker: tracker
};
