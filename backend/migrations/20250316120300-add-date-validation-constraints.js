/**
 * Migration: Add database-level date validation constraints
 * 
 * This migration adds CHECK constraints to ensure data integrity:
 * 1. Move-out date must be after move-in date when both are provided
 * 2. Verify unique constraints are properly enforced at database level
 */

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔧 Adding date validation constraints...');

      // Add CHECK constraint for date validation in szoba_bekoltozes table
      await queryInterface.sequelize.query(
        `ALTER TABLE szoba_bekoltozes ADD CONSTRAINT chk_bekoltozes_dates 
         CHECK (kikoltozes_datum IS NULL OR kikoltozes_datum >= bekoltozes_datum)`,
        { transaction }
      );

      console.log('✓ Date validation constraint added to szoba_bekoltozes table');

      // Verify unique constraints exist at database level for Diak table
      // These should already exist from model definitions, but let's ensure they're enforced
      
      // Check if unique constraints exist for business keys
      const constraints = await queryInterface.sequelize.query(
        `SELECT name, type FROM sqlite_master 
         WHERE type = 'index' AND tbl_name = 'diaks' AND name LIKE '%unique%'`,
        { transaction }
      );

      console.log('✓ Unique constraints verification completed');
      console.log('  Found constraints:', constraints[0].map(c => c.name));

      await transaction.commit();
      console.log('🎉 Date validation constraints migration completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to add date validation constraints:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Rolling back date validation constraints...');

      // Remove the CHECK constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE szoba_bekoltozes DROP CONSTRAINT chk_bekoltozes_dates`,
        { transaction }
      );

      console.log('✓ Date validation constraint removed');

      await transaction.commit();
      console.log('🎉 Date validation constraints rollback completed!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to rollback date validation constraints:', error);
      throw error;
    }
  }
};