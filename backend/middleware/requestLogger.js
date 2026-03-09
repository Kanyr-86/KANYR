/**
 * Kérés naplózó middleware
 * HTTP kérés részleteit naplózza válaszidővel együtt
 */

/**
 * Middleware az összes HTTP kérés naplózásához
 * @param {Object} req - Express kérés objektum
 * @param {Object} res - Express válasz objektum
 * @param {Function} next - Express next függvény
 * 
 * @example
 * // Kimenet formátuma:
 * // [2026-02-23T08:30:45.123Z] GET /api/diaks - 200 - 45ms - ::1
 */
const requestLogger = (req, res, next) => {
  // Kezdési idő rögzítése
  const startTime = Date.now();

  // Válasz befejezés esemény figyelése
  res.on('finish', () => {
    // Időtartam számítása
    const duration = Date.now() - startTime;
    
    // ISO időbélyeg lekérdezése
    const timestamp = new Date().toISOString();
    
    // Kérés részleteinek naplózása
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`
    );
  });

  // Folytatás a következő middleware-rel
  next();
};

module.exports = requestLogger;