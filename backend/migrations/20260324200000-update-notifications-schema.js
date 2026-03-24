'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Add new ENUM values to tipus column
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_notifications_tipus" ADD VALUE IF NOT EXISTS 'system_announcement';`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_notifications_tipus" ADD VALUE IF NOT EXISTS 'parent_notification';`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_notifications_tipus" ADD VALUE IF NOT EXISTS 'general_alert';`,
        { transaction }
      );

      // 2. Add cimzettkor column
      await queryInterface.addColumn('notifications', 'cimzettkor', {
        type: Sequelize.ENUM('admin', 'student', 'both'),
        allowNull: false,
        defaultValue: 'student'
      }, { transaction });

      // 3. Add prioritas column
      await queryInterface.addColumn('notifications', 'prioritas', {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium'
      }, { transaction });

      // 4. Add olvasva_datum column
      await queryInterface.addColumn('notifications', 'olvasva_datum', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      }, { transaction });

      // 5. Add new indexes for better query performance
      await queryInterface.addIndex('notifications', ['cimzettkor'], {
        name: 'notifications_cimzettkor_idx',
        transaction
      });
      
      await queryInterface.addIndex('notifications', ['prioritas'], {
        name: 'notifications_prioritas_idx',
        transaction
      });

      await queryInterface.addIndex('notifications', ['tipus', 'cimzettkor'], {
        name: 'notifications_tipus_cimzettkor_idx',
        transaction
      });

      // 6. Update existing notifications with default values
      await queryInterface.sequelize.query(
        `UPDATE notifications SET cimzettkor = 'student', prioritas = 'medium' WHERE cimzettkor IS NULL OR prioritas IS NULL;`,
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
      // Remove indexes
      await queryInterface.removeIndex('notifications', 'notifications_cimzettkor_idx', { transaction });
      await queryInterface.removeIndex('notifications', 'notifications_prioritas_idx', { transaction });
      await queryInterface.removeIndex('notifications', 'notifications_tipus_cimzettkor_idx', { transaction });

      // Remove columns
      await queryInterface.removeColumn('notifications', 'olvasva_datum', { transaction });
      await queryInterface.removeColumn('notifications', 'prioritas', { transaction });
      await queryInterface.removeColumn('notifications', 'cimzettkor', { transaction });

      // Note: ENUM values cannot be easily removed in PostgreSQL
      // The old ENUM values will remain but won't be used

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};