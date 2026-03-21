/**
 * Migration to create the revoked_tokens table
 * 
 * This table is used by the TokenBlacklistService to store revoked JWT tokens
 * for proper logout functionality and security.
 */

module.exports = {
  /**
   * Up migration - creates the revoked_tokens table
   * 
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize constructor
   */
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('revoked_tokens', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        token: {
          type: Sequelize.TEXT,
          allowNull: false,
          validate: {
            notEmpty: {
              msg: 'A token nem lehet üres'
            }
          }
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'felhasznalos',
            key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false,
          validate: {
            isDate: {
              msg: 'Érvényes dátumot kell megadni'
            }
          }
        },
        revoked_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, {
        transaction,
        indexes: [
          { unique: true, fields: ['token'] },
          { fields: ['user_id'] },
          { fields: ['expires_at'] },
          { fields: ['revoked_at'] }
        ]
      });

      console.log('✓ revoked_tokens table created successfully');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Failed to create revoked_tokens table:', error);
      throw error;
    }
  },

  /**
   * Down migration - drops the revoked_tokens table
   * 
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize constructor
   */
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('revoked_tokens', { transaction });
      console.log('✓ revoked_tokens table dropped successfully');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Failed to drop revoked_tokens table:', error);
      throw error;
    }
  }
};