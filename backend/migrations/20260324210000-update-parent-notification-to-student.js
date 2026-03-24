'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Add student_notification to ENUM
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_notifications_tipus" ADD VALUE IF NOT EXISTS 'student_notification';`,
        { transaction }
      );

      // 2. Update existing parent_notification records to student_notification
      await queryInterface.sequelize.query(
        `UPDATE notifications SET tipus = 'student_notification' WHERE tipus = 'parent_notification';`,
        { transaction }
      );

      // 3. Set cimzettkor to 'student' for room_change_approved and room_change_denied notifications
      await queryInterface.sequelize.query(
        `UPDATE notifications SET cimzettkor = 'student' WHERE tipus IN ('room_change_approved', 'room_change_denied') AND cimzettkor != 'student';`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Revert student_notification back to parent_notification
      await queryInterface.sequelize.query(
        `UPDATE notifications SET tipus = 'parent_notification' WHERE tipus = 'student_notification';`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};