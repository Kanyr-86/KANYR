/**
 * Migration: Create audit logs table for tracking all CRUD operations
 * 
 * This migration creates a comprehensive audit trail system that tracks
 * who made changes, what was changed, when, and the old/new values.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('audit_logs', {
        audit_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        table_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Name of the table that was modified'
        },
        record_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the record that was modified'
        },
        operation: {
          type: Sequelize.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE'),
          allowNull: false,
          comment: 'Type of operation performed'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'ID of the user who performed the operation'
        },
        user_email: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Email of the user who performed the operation'
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true,
          comment: 'IP address from which the operation was performed'
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'User agent string of the client'
        },
        old_values: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'JSON representation of the old values (for UPDATE/DELETE)'
        },
        new_values: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'JSON representation of the new values (for CREATE/UPDATE)'
        },
        changes: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'JSON representation of the specific changes made'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Add indexes for better query performance
      await queryInterface.addIndex('audit_logs', ['table_name'], {
        name: 'idx_audit_logs_table_name',
        transaction
      });

      await queryInterface.addIndex('audit_logs', ['record_id'], {
        name: 'idx_audit_logs_record_id',
        transaction
      });

      await queryInterface.addIndex('audit_logs', ['operation'], {
        name: 'idx_audit_logs_operation',
        transaction
      });

      await queryInterface.addIndex('audit_logs', ['user_id'], {
        name: 'idx_audit_logs_user_id',
        transaction
      });

      await queryInterface.addIndex('audit_logs', ['created_at'], {
        name: 'idx_audit_logs_created_at',
        transaction
      });

      // Composite indexes for common queries
      await queryInterface.addIndex('audit_logs', ['table_name', 'operation'], {
        name: 'idx_audit_logs_table_operation',
        transaction
      });

      await queryInterface.addIndex('audit_logs', ['user_id', 'created_at'], {
        name: 'idx_audit_logs_user_created',
        transaction
      });

      await transaction.commit();
      console.log('✓ Audit logs table created successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Failed to create audit logs table:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove all indexes
      await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_table_name', { transaction });
      await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_record_id', { transaction });
      await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_operation', { transaction });
      await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_user_id', { transaction });
      await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_created_at', { transaction });
      await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_table_operation', { transaction });
      await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_user_created', { transaction });

      // Drop the table
      await queryInterface.dropTable('audit_logs', { transaction });

      await transaction.commit();
      console.log('✓ Audit logs table removed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Failed to remove audit logs table:', error);
      throw error;
    }
  }
};