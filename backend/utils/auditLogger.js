const logger = require('./logger');

/**
 * Audit logging utility for tracking all CRUD operations
 * 
 * This utility provides centralized audit logging functionality that can be
 * used across the application to track who made changes, what was changed,
 * when, and the old/new values.
 */

class AuditLogger {
  /**
   * Log a CRUD operation
   * @param {Object} options - Audit log options
   * @param {string} options.tableName - Name of the table that was modified
   * @param {number} options.recordId - ID of the record that was modified
   * @param {string} options.operation - Type of operation (CREATE, READ, UPDATE, DELETE)
   * @param {Object} options.req - Express request object (optional)
   * @param {Object} options.oldValues - Old values before the change (optional)
   * @param {Object} options.newValues - New values after the change (optional)
   * @param {Object} options.changes - Specific changes made (optional)
   */
  static async logOperation(options) {
    try {
      const {
        tableName,
        recordId,
        operation,
        req,
        oldValues,
        newValues,
        changes
      } = options;

      // Extract user information from request
      const userId = req?.user?.userId || null;
      const userEmail = req?.user?.email || null;
      const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
      const userAgent = req?.get('User-Agent') || null;

      // Prepare audit log data
      const auditData = {
        table_name: tableName,
        record_id: recordId,
        operation: operation.toUpperCase(),
        user_id: userId,
        user_email: userEmail,
        ip_address: ipAddress,
        user_agent: userAgent,
        old_values: oldValues || null,
        new_values: newValues || null,
        changes: changes || null
      };

      // Log to structured logger for immediate visibility
      logger.info('Audit log entry', {
        type: 'audit',
        ...auditData,
        timestamp: new Date().toISOString()
      });

      // Store in database through the model (if available)
      if (req?.app?.locals?.db?.AuditLog) {
        try {
          await req.app.locals.db.AuditLog.create(auditData);
        } catch (dbError) {
          logger.error('Failed to store audit log in database', {
            error: dbError.message,
            auditData
          });
        }
      }

    } catch (error) {
      logger.error('Audit logging error', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Log a CREATE operation
   * @param {Object} options - Audit log options
   */
  static async logCreate(options) {
    await this.logOperation({
      ...options,
      operation: 'CREATE',
      newValues: this.sanitizeValues(options.newValues)
    });
  }

  /**
   * Log a READ operation
   * @param {Object} options - Audit log options
   */
  static async logRead(options) {
    await this.logOperation({
      ...options,
      operation: 'READ'
    });
  }

  /**
   * Log an UPDATE operation
   * @param {Object} options - Audit log options
   */
  static async logUpdate(options) {
    const changes = this.calculateChanges(options.oldValues, options.newValues);
    
    await this.logOperation({
      ...options,
      operation: 'UPDATE',
      oldValues: this.sanitizeValues(options.oldValues),
      newValues: this.sanitizeValues(options.newValues),
      changes: changes
    });
  }

  /**
   * Log a DELETE operation
   * @param {Object} options - Audit log options
   */
  static async logDelete(options) {
    await this.logOperation({
      ...options,
      operation: 'DELETE',
      oldValues: this.sanitizeValues(options.oldValues)
    });
  }

  /**
   * Calculate the specific changes between old and new values
   * @param {Object} oldValues - Old values
   * @param {Object} newValues - New values
   * @returns {Object} Changes object
   */
  static calculateChanges(oldValues, newValues) {
    if (!oldValues || !newValues) return null;

    const changes = {};
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of allKeys) {
      const oldValue = oldValues[key];
      const newValue = newValues[key];

      if (oldValue !== newValue) {
        changes[key] = {
          old: oldValue,
          new: newValue
        };
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }

  /**
   * Sanitize values to remove sensitive information before logging
   * @param {Object} values - Values to sanitize
   * @returns {Object} Sanitized values
   */
  static sanitizeValues(values) {
    if (!values || typeof values !== 'object') return values;

    const sensitiveFields = [
      'password', 'password_hash', 'token', 'secret', 'key',
      'ssn', 'social_security_number', 'credit_card', 'card_number'
    ];

    const sanitized = { ...values };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Create audit logging middleware for automatic logging
   * @param {string} tableName - Name of the table to log
   * @returns {Function} Express middleware function
   */
  static createMiddleware(tableName) {
    return (req, res, next) => {
      // Store original methods
      const originalJson = res.json;
      const originalSend = res.send;

      // Override res.json to capture responses
      res.json = function(data) {
        // Log READ operations for GET requests
        if (req.method === 'GET' && data) {
          const recordId = req.params.id || (Array.isArray(data) && data[0]?.id) || null;
          if (recordId) {
            AuditLogger.logRead({
              tableName,
              recordId,
              req
            });
          }
        }

        // Log CREATE operations for POST requests
        if (req.method === 'POST' && data && data.id) {
          AuditLogger.logCreate({
            tableName,
            recordId: data.id,
            req,
            newValues: data
          });
        }

        // Log UPDATE operations for PUT/PATCH requests
        if ((req.method === 'PUT' || req.method === 'PATCH') && data) {
          AuditLogger.logUpdate({
            tableName,
            recordId: req.params.id || data.id,
            req,
            newValues: data,
            oldValues: req.body // This would need to be enhanced to capture original values
          });
        }

        return originalJson.call(this, data);
      };

      // Override res.send for non-JSON responses
      res.send = function(data) {
        if (req.method === 'DELETE' && res.statusCode === 200) {
          AuditLogger.logDelete({
            tableName,
            recordId: req.params.id,
            req
          });
        }
        return originalSend.call(this, data);
      };

      next();
    };
  }
}

module.exports = AuditLogger;