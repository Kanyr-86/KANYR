/**
 * Winston Logger Configuration
 * Provides structured logging with environment-based log levels and log rotation
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Determine log level based on environment
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const level = process.env.LOG_LEVEL;
  
  if (level) return level;
  
  switch (env) {
    case 'production':
      return 'info';
    case 'test':
      return 'warn';
    default:
      return 'debug';
  }
};

// Determine if logs should be in JSON format (structured logging)
const useJsonFormat = process.env.LOG_FORMAT === 'json' || process.env.NODE_ENV === 'production';

// Custom format for console output (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Custom format for file output (structured)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const logsDir = process.env.LOGS_DIR || path.join(__dirname, '..', 'logs');

// Configure transports
const transports = [];

// Console transport (always enabled in development, disabled in production unless explicitly enabled)
const enableConsole = process.env.LOG_CONSOLE !== 'false' && (process.env.NODE_ENV !== 'production' || process.env.LOG_CONSOLE === 'true');
if (enableConsole) {
  transports.push(
    new winston.transports.Console({
      format: useJsonFormat ? fileFormat : consoleFormat,
      stderrLevels: ['error'],
    })
  );
}

// File transport with rotation (always enabled)
if (process.env.LOG_TO_FILE !== 'false') {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      format: fileFormat,
      level: getLogLevel(),
    })
  );

  // Separate error log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '30d',
      format: fileFormat,
      level: 'error',
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  defaultMeta: {
    service: 'kanyr-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan (HTTP request logging integration)
logger.stream = {
  write: (message) => {
    logger.info(message.trim(), { type: 'http' });
  },
};

/**
 * Log database operations (for Sequelize)
 * @param {string} msg - SQL query message
 */
logger.logQuery = (msg) => {
  logger.debug('SQL Query', { sql: msg, type: 'database' });
};

/**
 * Log HTTP requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    type: 'http',
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || null,
  });
};

/**
 * Log errors with full context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...error,
    },
    ...context,
  });
};

module.exports = logger;