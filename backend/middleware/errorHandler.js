/**
 * Globális hibakezelő middleware Express-hez
 * Központosítja a hibakezelést és egységes hibaválaszokat biztosít
 */

const { 
  AppError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError, 
  NotFoundError, 
  ConflictError 
} = require('../utils/AppError');

/**
 * Express hibakezelő middleware
 * @param {Error} err - Hiba objektum
 * @param {Request} req - Express kérés objektum
 * @param {Response} res - Express válasz objektum
 * @param {Function} next - Express next függvény
 */
const errorHandler = (err, req, res, next) => {
  // Hiba naplózása a konzolra
  console.error(`[${err.name}] ${err.message}`);
  
  // Stack trace naplózása fejlesztői környezetben
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Alapértelmezett értékek
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Belső szerver hiba';

  // Konkrét hibatípusok kezelése
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    message = err.message;
  } else if (err instanceof AppError) {
    // Egyedi AppError konkrét státuszkóddal
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // Váratlan hiba - részletek elrejtése éles környezetben
    if (process.env.NODE_ENV === 'production') {
      message = 'Valami hiba történt';
    }
  }

  // JSON válasz küldése
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

module.exports = errorHandler;