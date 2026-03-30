'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add new ENUM value to tipus column for password reset notifications
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_notifications_tipus" ADD VALUE IF NOT EXISTS 'password_reset_required';`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Note: ENUM values cannot be easily removed in PostgreSQL
    // The 'password_reset_required' value will remain but won't be used
    console.log('Migration down: password_reset_required ENUM value cannot be removed in PostgreSQL');
  }
};