const logger = require('./logger');

/**
 * Soft delete utility for handling soft delete operations
 * 
 * This utility provides centralized soft delete functionality that can be
 * used across the application to implement soft delete behavior.
 */

class SoftDelete {
  /**
   * Soft delete a record
   * @param {Object} model - Sequelize model
   * @param {number} id - Record ID to soft delete
   * @param {Object} options - Additional options
   * @param {Object} options.transaction - Database transaction (optional)
   * @param {Object} options.auditLogger - Audit logger instance (optional)
   * @param {Object} options.req - Express request object (optional)
   * @returns {Promise<Object>} The soft deleted record
   */
  static async softDelete(model, id, options = {}) {
    const { transaction, auditLogger, req } = options;

    try {
      // Find the record first to get old values for audit logging
      const record = await model.findByPk(id, { transaction });
      
      if (!record) {
        throw new Error(`Record not found: ${model.name} with ID ${id}`);
      }

      // Check if already soft deleted
      if (record.deleted_at) {
        logger.warn('Record already soft deleted', {
          model: model.name,
          id: id,
          deletedAt: record.deleted_at
        });
        return record;
      }

      // Perform soft delete
      const updatedRecord = await model.update(
        { deleted_at: new Date() },
        {
          where: { [model.primaryKeyAttribute]: id },
          transaction
        }
      );

      if (updatedRecord[0] === 0) {
        throw new Error(`Failed to soft delete record: ${model.name} with ID ${id}`);
      }

      // Log audit trail
      if (auditLogger && req) {
        await auditLogger.logDelete({
          tableName: model.getTableName(),
          recordId: id,
          req,
          oldValues: record.toJSON()
        });
      }

      logger.info('Record soft deleted successfully', {
        model: model.name,
        id: id
      });

      return record;

    } catch (error) {
      logger.error('Soft delete operation failed', {
        model: model.name,
        id: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Restore a soft deleted record
   * @param {Object} model - Sequelize model
   * @param {number} id - Record ID to restore
   * @param {Object} options - Additional options
   * @param {Object} options.transaction - Database transaction (optional)
   * @param {Object} options.auditLogger - Audit logger instance (optional)
   * @param {Object} options.req - Express request object (optional)
   * @returns {Promise<Object>} The restored record
   */
  static async restore(model, id, options = {}) {
    const { transaction, auditLogger, req } = options;

    try {
      // Find the soft deleted record
      const record = await model.findByPk(id, {
        paranoid: false, // Include soft deleted records
        transaction
      });

      if (!record) {
        throw new Error(`Record not found: ${model.name} with ID ${id}`);
      }

      // Check if already restored
      if (!record.deleted_at) {
        logger.warn('Record already restored', {
          model: model.name,
          id: id
        });
        return record;
      }

      // Restore the record
      const [affectedRows] = await model.update(
        { deleted_at: null },
        {
          where: { [model.primaryKeyAttribute]: id },
          transaction
        }
      );

      if (affectedRows === 0) {
        throw new Error(`Failed to restore record: ${model.name} with ID ${id}`);
      }

      // Get the updated record
      const restoredRecord = await model.findByPk(id, { transaction });

      // Log audit trail
      if (auditLogger && req) {
        await auditLogger.logUpdate({
          tableName: model.getTableName(),
          recordId: id,
          req,
          oldValues: { deleted_at: record.deleted_at },
          newValues: { deleted_at: null },
          changes: { deleted_at: { old: record.deleted_at, new: null } }
        });
      }

      logger.info('Record restored successfully', {
        model: model.name,
        id: id
      });

      return restoredRecord;

    } catch (error) {
      logger.error('Restore operation failed', {
        model: model.name,
        id: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all soft deleted records
   * @param {Object} model - Sequelize model
   * @param {Object} options - Query options
   * @param {Object} options.where - Additional where conditions
   * @param {Object} options.include - Include options
   * @param {Object} options.limit - Limit
   * @param {Object} options.offset - Offset
   * @param {Object} options.order - Order
   * @returns {Promise<Array>} Array of soft deleted records
   */
  static async getDeleted(model, options = {}) {
    try {
      const queryOptions = {
        where: {
          deleted_at: {
            [model.sequelize.Op.ne]: null
          },
          ...options.where
        },
        paranoid: false, // Include soft deleted records
        ...options
      };

      const records = await model.findAll(queryOptions);

      logger.info('Retrieved soft deleted records', {
        model: model.name,
        count: records.length
      });

      return records;

    } catch (error) {
      logger.error('Failed to retrieve soft deleted records', {
        model: model.name,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Permanently delete a record (hard delete)
   * @param {Object} model - Sequelize model
   * @param {number} id - Record ID to permanently delete
   * @param {Object} options - Additional options
   * @param {Object} options.transaction - Database transaction (optional)
   * @param {Object} options.auditLogger - Audit logger instance (optional)
   * @param {Object} options.req - Express request object (optional)
   * @returns {Promise<boolean>} True if successfully deleted
   */
  static async hardDelete(model, id, options = {}) {
    const { transaction, auditLogger, req } = options;

    try {
      // Find the record first to get old values for audit logging
      const record = await model.findByPk(id, {
        paranoid: false, // Include soft deleted records
        transaction
      });

      if (!record) {
        throw new Error(`Record not found: ${model.name} with ID ${id}`);
      }

      // Log audit trail before deletion
      if (auditLogger && req) {
        await auditLogger.logDelete({
          tableName: model.getTableName(),
          recordId: id,
          req,
          oldValues: record.toJSON()
        });
      }

      // Perform hard delete
      const deleted = await model.destroy({
        where: { [model.primaryKeyAttribute]: id },
        force: true, // Force delete (hard delete)
        transaction
      });

      if (deleted === 0) {
        throw new Error(`Failed to permanently delete record: ${model.name} with ID ${id}`);
      }

      logger.info('Record permanently deleted', {
        model: model.name,
        id: id
      });

      return true;

    } catch (error) {
      logger.error('Hard delete operation failed', {
        model: model.name,
        id: id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a query scope for excluding soft deleted records
   * @param {Object} _model - Sequelize model (unused parameter for future extensibility)
   * @returns {Object} Query scope object
   */
  static getActiveScope(_model) {
    return {
      where: {
        deleted_at: null
      }
    };
  }

  /**
   * Create a query scope for including only soft deleted records
   * @param {Object} _model - Sequelize model (unused parameter for future extensibility)
   * @returns {Object} Query scope object
   */
  static getDeletedScope(_model) {
    return {
      where: {
        deleted_at: {
          [Object.prototype.sequelize.Op.ne]: null
        }
      }
    };
  }

  /**
   * Check if a record is soft deleted
   * @param {Object} record - Sequelize record
   * @returns {boolean} True if soft deleted
   */
  static isDeleted(record) {
    return record && record.deleted_at !== null && record.deleted_at !== undefined;
  }

  /**
   * Get the soft delete status of a record
   * @param {Object} record - Sequelize record
   * @returns {Object} Status object with deleted and deletedAt properties
   */
  static getStatus(record) {
    if (!record) {
      return { deleted: false, deletedAt: null };
    }

    return {
      deleted: this.isDeleted(record),
      deletedAt: record.deleted_at
    };
  }
}

module.exports = SoftDelete;