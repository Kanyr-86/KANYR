/**
 * Migration: Add soft delete columns to all critical tables
 * 
 * This migration adds deleted_at columns to enable soft delete functionality
 * while maintaining backward compatibility with existing data.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add deleted_at column to diaks table
      await queryInterface.addColumn('diaks', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Soft delete timestamp'
      }, { transaction });

      // Add deleted_at column to szulos table
      await queryInterface.addColumn('szulos', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Soft delete timestamp'
      }, { transaction });

      // Add deleted_at column to lakcims table
      await queryInterface.addColumn('lakcims', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Soft delete timestamp'
      }, { transaction });

      // Add deleted_at column to szobas table
      await queryInterface.addColumn('szobas', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Soft delete timestamp'
      }, { transaction });

      // Add deleted_at column to szoba_bekoltozes table
      await queryInterface.addColumn('szoba_bekoltozes', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Soft delete timestamp'
      }, { transaction });

      // Add deleted_at column to szobavaltoztatas table
      await queryInterface.addColumn('szobavaltoztatas', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Soft delete timestamp'
      }, { transaction });

      // Add deleted_at column to notifications table
      await queryInterface.addColumn('notifications', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Soft delete timestamp'
      }, { transaction });

      // Add deleted_at column to felhasznalos table
      await queryInterface.addColumn('felhasznalos', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Soft delete timestamp'
      }, { transaction });

      // Add indexes for deleted_at columns to improve query performance
      await queryInterface.addIndex('diaks', ['deleted_at'], {
        name: 'idx_diaks_deleted_at',
        transaction
      });

      await queryInterface.addIndex('szulos', ['deleted_at'], {
        name: 'idx_szulos_deleted_at',
        transaction
      });

      await queryInterface.addIndex('lakcims', ['deleted_at'], {
        name: 'idx_lakcims_deleted_at',
        transaction
      });

      await queryInterface.addIndex('szobas', ['deleted_at'], {
        name: 'idx_szobas_deleted_at',
        transaction
      });

      await queryInterface.addIndex('szoba_bekoltozes', ['deleted_at'], {
        name: 'idx_szoba_bekoltozes_deleted_at',
        transaction
      });

      await queryInterface.addIndex('szobavaltoztatas', ['deleted_at'], {
        name: 'idx_szobavaltoztatas_deleted_at',
        transaction
      });

      await queryInterface.addIndex('notifications', ['deleted_at'], {
        name: 'idx_notifications_deleted_at',
        transaction
      });

      await queryInterface.addIndex('felhasznalos', ['deleted_at'], {
        name: 'idx_felhasznalos_deleted_at',
        transaction
      });

      await transaction.commit();
      console.log('✓ Soft delete columns added successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Failed to add soft delete columns:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove deleted_at columns from all tables
      await queryInterface.removeColumn('diaks', 'deleted_at', { transaction });
      await queryInterface.removeColumn('szulos', 'deleted_at', { transaction });
      await queryInterface.removeColumn('lakcims', 'deleted_at', { transaction });
      await queryInterface.removeColumn('szobas', 'deleted_at', { transaction });
      await queryInterface.removeColumn('szoba_bekoltozes', 'deleted_at', { transaction });
      await queryInterface.removeColumn('szobavaltoztatas', 'deleted_at', { transaction });
      await queryInterface.removeColumn('notifications', 'deleted_at', { transaction });
      await queryInterface.removeColumn('felhasznalos', 'deleted_at', { transaction });

      // Remove indexes
      await queryInterface.removeIndex('diaks', 'idx_diaks_deleted_at', { transaction });
      await queryInterface.removeIndex('szulos', 'idx_szulos_deleted_at', { transaction });
      await queryInterface.removeIndex('lakcims', 'idx_lakcims_deleted_at', { transaction });
      await queryInterface.removeIndex('szobas', 'idx_szobas_deleted_at', { transaction });
      await queryInterface.removeIndex('szoba_bekoltozes', 'idx_szoba_bekoltozes_deleted_at', { transaction });
      await queryInterface.removeIndex('szobavaltoztatas', 'idx_szobavaltoztatas_deleted_at', { transaction });
      await queryInterface.removeIndex('notifications', 'idx_notifications_deleted_at', { transaction });
      await queryInterface.removeIndex('felhasznalos', 'idx_felhasznalos_deleted_at', { transaction });

      await transaction.commit();
      console.log('✓ Soft delete columns removed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Failed to remove soft delete columns:', error);
      throw error;
    }
  }
};