const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// JWT titkos kulcs - KÖTELEZŐEN környezeti változóban kell lennie
if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET must be set in environment variables!');
}

// JWT payload encryption key - KÖTELEZŐEN környezeti változóban kell lennie
if (!process.env.JWT_ENCRYPTION_KEY) {
  throw new Error('CRITICAL: JWT_ENCRYPTION_KEY must be set in environment variables!');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_ENCRYPTION_KEY = process.env.JWT_ENCRYPTION_KEY;

// Validate encryption key length (must be 32 bytes for AES-256)
if (Buffer.from(JWT_ENCRYPTION_KEY, 'hex').length !== 32) {
  throw new Error('CRITICAL: JWT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes) for AES-256 encryption!');
}

/**
 * Encrypts data using AES-256-GCM
 * @param {Object} data - Data to encrypt
 * @returns {string} - Encrypted data in format: iv:authTag:ciphertext (base64)
 */
function encryptPayload(data) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(JWT_ENCRYPTION_KEY, 'hex'),
      iv
    );

    const jsonData = JSON.stringify(data);
    let encrypted = cipher.update(jsonData, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all base64 encoded)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    throw new Error('Hiba a JWT payload titkosítása közben');
  }
}

/**
 * Decrypts data using AES-256-GCM
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:ciphertext (base64)
 * @returns {Object} - Decrypted data
 */
function decryptPayload(encryptedData) {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(JWT_ENCRYPTION_KEY, 'hex'),
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Hiba a JWT payload visszafejtése közben');
  }
}

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
 * JWT token generálása token verzióval (titkosított payload)
 * @param {Object} user - Felhasználó objektum
 * @param {string} expiresIn - Egyedi lejárati idő (opcionális)
 * @returns {string} - JWT token titkosított payload-dal
 */
function generateTokenWithVersion(user, expiresIn = JWT_EXPIRES_IN) {
  try {
    // Sensitive payload data that needs encryption
    const sensitivePayload = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      admin: user.admin,
      tokenVersion: user.token_version || 1
    };

    // Encrypt the sensitive payload
    const encryptedData = encryptPayload(sensitivePayload);

    // JWT payload only contains encrypted data and iat (issued at)
    // iat is not sensitive and useful for token age validation
    const payload = {
      data: encryptedData,
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
 * JWT token ellenőrzése (titkosított payload visszafejtéssel)
 * @param {string} token - Ellenőrizendő JWT token
 * @returns {Object} - Dekódolt és visszafejtett token adatok
 */
function verifyToken(token) {
  try {
    // First verify the JWT signature
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if this is a new encrypted format token
    if (decoded.data) {
      // Decrypt the encrypted payload
      const decryptedData = decryptPayload(decoded.data);

      // Return merged data: decrypted payload + iat from outer token
      return {
        ...decryptedData,
        iat: decoded.iat,
        exp: decoded.exp // Include expiration if present
      };
    }

    // Return legacy format (non-encrypted) for backward compatibility
    // This will be removed after all tokens are migrated
    return decoded;
  } catch (error) {
    if (error.message === 'Hiba a JWT payload visszafejtése közben') {
      throw new Error('Érvénytelen token formátum');
    }
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
  encryptPayload,
  decryptPayload,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_ENCRYPTION_KEY
};
