const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT titkos kulcs - KÖTELEZŐEN környezeti változóban kell lennie
if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET must be set in environment variables!');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Jelszó hashelése bcrypt-tel
 * @param {string} password - Egyszerű szöveges jelszó
 * @returns {Promise<string>} - Hashelt jelszó
 */
async function hashPassword(password) {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error('Hiba a jelszó hashelése közben');
  }
}

/**
 * Jelszó összehasonlítása a hashelt jelszóval
 * @param {string} password - Egyszerű szöveges jelszó
 * @param {string} hashedPassword - Adatbázisban tárolt hashelt jelszó
 * @returns {Promise<boolean>} - Igaz, ha a jelszavak egyeznek, egyébként hamis
 */
async function comparePassword(password, hashedPassword) {
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
  } catch (error) {
    throw new Error('Hiba a jelszó összehasonlítása közben');
  }
}

/**
 * JWT token generálása
 * @param {Object} payload - Felhasználói adatok a tokenben
 * @param {string} expiresIn - Egyedi lejárati idő (opcionális)
 * @returns {string} - JWT token
 */
function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: expiresIn
    });
    return token;
  } catch (error) {
    throw new Error('Hiba a token generálása közben');
  }
}

/**
 * JWT token generálása token verzióval
 * @param {Object} user - Felhasználó objektum
 * @param {string} expiresIn - Egyedi lejárati idő (opcionális)
 * @returns {string} - JWT token
 */
function generateTokenWithVersion(user, expiresIn = JWT_EXPIRES_IN) {
  try {
    const payload = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      admin: user.admin,
      tokenVersion: user.token_version || 1,
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: expiresIn
    });
    return token;
  } catch (error) {
    throw new Error('Hiba a token generálása közben');
  }
}

/**
 * JWT token ellenőrzése
 * @param {string} token - Ellenőrizendő JWT token
 * @returns {Object} - Dekódolt token adatok
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Érvénytelen vagy lejárt token');
  }
}

/**
 * JWT token dekódolása ellenőrzés nélkül (payload kinyerése)
 * @param {string} token - JWT token
 * @returns {Object|null} - Dekódolt payload vagy null
 */
function decodeToken(token) {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Véletlenszerű jelszó generálása
 * @param {number} length - Generálandó jelszó hossza
 * @returns {string} - Véletlenszerű jelszó
 */
function generateRandomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateTokenWithVersion,
  verifyToken,
  decodeToken,
  generateRandomPassword,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
