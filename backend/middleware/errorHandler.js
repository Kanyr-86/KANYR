/**
 * Globális hibakezelő middleware Express-hez
 * Központosítja a hibakezelést és egységes hibaválaszokat biztosít
 * Éles környezetben nem teszi közzé a belső hibák részleteit
 */

const logger = require('../utils/logger');
const { 
  AppError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError, 
  NotFoundError, 
  ConflictError 
} = require('../utils/AppError');

// Általános, biztonságos hibaüzenetek éles környezethez
// Ezek nem tartalmaznak implementációs részleteket vagy adatbázis-információkat
const SAFE_ERROR_MESSAGES = {
  400: 'Érvénytelen kérés',
  401: 'Hitelesítés szükséges',
  403: 'Hozzáférés megtagadva',
  404: 'A keresett erőforrás nem található',
  409: 'Ütközés történt a kérés feldolgozása során',
  422: 'A kérés feldolgozása nem sikerült',
  429: 'Túl sok kérés, próbálja újra később',
  500: 'Szerverhiba történt, próbálja újra később'
};

/**
 * Biztonságos hibaüzenet lekérdezése éles környezethez
 * @param {number} statusCode - HTTP státuszkód
 * @returns {string} Biztonságos hibaüzenet
 */
const getSafeErrorMessage = (statusCode) => {
  return SAFE_ERROR_MESSAGES[statusCode] || SAFE_ERROR_MESSAGES[500];
};

/**
 * Ellenőrzi, hogy a környezet fejlesztői mód-e
 * @returns {boolean} true, ha fejlesztői módban futunk
 */
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
};

/**
 * Express hibakezelő middleware
 * @param {Error} err - Hiba objektum
 * @param {Request} req - Express kérés objektum
 * @param {Response} res - Express válasz objektum
 * @param {Function} next - Express next függvény
 */
const errorHandler = (err, req, res, next) => {
  // Hiba naplózása a strukturált loggerrel (mindig részletesen naplózunk)
  logger.logError(err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId || null,
    // Csak fejlesztői módban naplózzuk a stack trace-t a válaszban
    ...(isDevelopment() && { stack: err.stack })
  });

  // Alapértelmezett értékek
  let statusCode = err.statusCode || 500;
  
  // Meghatározzuk a hiba típusát a megfelelő státuszkód beállításához
  if (err instanceof ValidationError) {
    statusCode = 400;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
  } else if (err instanceof ConflictError) {
    statusCode = 409;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
  }

  // Hibaüzenet meghatározása a környezettől függően
  let message;
  let errorDetails = null;
  
  if (isDevelopment()) {
    // Fejlesztői módban részletes hibaüzeneteket adunk vissza
    message = err.message || 'Belső szerver hiba';
    
    // Validációs hibák részletei csak fejlesztői módban
    if (err instanceof ValidationError && err.details) {
      errorDetails = err.details;
    }
  } else {
    // Éles környezetben biztonságos, általános hibaüzeneteket adunk vissza
    // Ez megakadályozza az adatbázis-struktúra, fájl elérési utak és belső
    // implementációs részletek kiszivárgását
    message = getSafeErrorMessage(statusCode);
  }

  // Válasz összeállítása
  const response = {
    success: false,
    error: message
  };

  // Hiba részletek csak fejlesztői módban (és csak validációs hibáknál)
  if (errorDetails) {
    response.details = errorDetails;
  }

  // Stack trace csak fejlesztői módban
  if (isDevelopment() && err.stack) {
    response.stack = err.stack.split('\n');
  }

  // JSON válasz küldése
  res.status(statusCode).json(response);
};

module.exports = errorHandler;
