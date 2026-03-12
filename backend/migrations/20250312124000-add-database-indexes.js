/**
 * Migration: Add database indexes for performance optimization
 * 
 * This migration adds indexes to frequently queried columns to improve
 * query performance on large tables.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add index on diaks.email for faster email lookups
      await queryInterface.addIndex('diaks', ['email'], {
        name: 'idx_diaks_email',
        transaction
      });

      // Add index on diaks.szulo_id for faster parent lookups
      await queryInterface.addIndex('diaks', ['szulo_id'], {
        name: 'idx_diaks_szulo_id',
        transaction
      });

      // Add index on szobas.szoba_szama for faster room number lookups
      await queryInterface.addIndex('szobas', ['szoba_szama'], {
        name: 'idx_szobas_szoba_szama',
        transaction
      });

      // Add composite index on szoba_bekoltozes for faster occupancy queries
      await queryInterface.addIndex('szoba_bekoltozes', ['diak_id', 'kikoltozes_datum'], {
        name: 'idx_szoba_bekoltozes_diak_kikoltozes',
        transaction
      });

      await transaction.commit();
      console.log('✓ Database indexes added successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Failed to add database indexes:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove all indexes in reverse order
      await queryInterface.removeIndex('szoba_bekoltozes', 'idx_szoba_bekoltozes_diak_kikoltozes', { transaction });
      await queryInterface.removeIndex('szobas', 'idx_szobas_szoba_szama', { transaction });
      await queryInterface.removeIndex('diaks', 'idx_diaks_szulo_id', { transaction });
      await queryInterface.removeIndex('diaks', 'idx_diaks_email', { transaction });

      await transaction.commit();
      console.log('✓ Database indexes removed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Failed to remove database indexes:', error);
      throw error;
    }
  }
};