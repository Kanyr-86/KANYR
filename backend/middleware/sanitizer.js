/**
 * Bemeneti adat tisztító middleware
 * Védelem a NoSQL injekciós támadások ellen veszélyes kulcsok eltávolításával
 */

/**
 * Rekurzívan tisztít egy objektumot a '$'-el kezdődő kulcsok eltávolításával
 * @param {*} obj - Tisztítandó objektum, tömb vagy primitív érték
 * @returns {*} - A bemenet tisztított másolata
 */
const sanitizeObject = (obj) => {
  // Primitív értékek változtatás nélküli visszaadása
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Tömbök kezelése - minden elem rekurzív tisztítása
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  // Objektumok kezelése - veszélyes kulcsok eltávolítása és értékek rekurzív tisztítása
  const sanitized = {};
  for (const key in obj) {
    // '$'-el kezdődő kulcsok kihagyása (NoSQL injekció elleni védelem)
    if (key.startsWith('$')) {
      continue;
    }

    // '.'-t tartalmazó kulcsok kihagyása is (MongoDB dot notation injekció)
    if (key.includes('.')) {
      continue;
    }

    // Beágyazott objektumok/tömbök rekurzív tisztítása
    sanitized[key] = sanitizeObject(obj[key]);
  }

  return sanitized;
};

/**
 * Middleware az összes bejövő kérés adatának tisztításához
 * @param {Object} req - Express kérés objektum
 * @param {Object} res - Express válasz objektum
 * @param {Function} next - Express next függvény
 */
const sanitizeInput = (req, res, next) => {
  // Body tisztítása
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Lekérdezési paraméterek tisztítása
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Route paraméterek tisztítása
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

module.exports = sanitizeInput;