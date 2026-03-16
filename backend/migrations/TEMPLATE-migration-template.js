/**
 * Migration Template
 * 
 * Use this template as a starting point for creating new migrations.
 * 
 * To create a new migration:
 * 1. Copy this template file
 * 2. Rename it with the format: YYYYMMDDHHMMSS-description.js
 * 3. Replace the template content with your specific migration logic
 * 4. Test the migration thoroughly before deploying to production
 */

module.exports = {
  /**
   * Up migration - applies the schema changes
   * 
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize constructor
   */
  up: async (queryInterface, _Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // TODO: Add your schema changes here
      // Examples:
      
      // 1. Create a new table
      // await queryInterface.createTable('new_table', {
      //   id: {
      //     type: Sequelize.INTEGER,
      //     primaryKey: true,
      //     autoIncrement: true,
      //     allowNull: false
      //   },
      //   name: {
      //     type: Sequelize.STRING(100),
      //     allowNull: false
      //   },
      //   created_at: {
      //     type: Sequelize.DATE,
      //     allowNull: false,
      //     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      //   },
      //   updated_at: {
      //     type: Sequelize.DATE,
      //     allowNull: false,
      //     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      //   }
      // }, { transaction });

      // 2. Add a column to an existing table
      // await queryInterface.addColumn('existing_table', 'new_column', {
      //   type: Sequelize.STRING(50),
      //   allowNull: true
      // }, { transaction });

      // 3. Modify a column
      // await queryInterface.changeColumn('table_name', 'column_name', {
      //   type: Sequelize.STRING(200),
      //   allowNull: false
      // }, { transaction });

      // 4. Add an index
      // await queryInterface.addIndex('table_name', ['column_name'], { transaction });

      // 5. Add a foreign key constraint
      // await queryInterface.addConstraint('child_table', {
      //   fields: ['parent_id'],
      //   type: 'foreign key',
      //   name: 'fk_child_table_parent_id',
      //   references: {
      //     table: 'parent_table',
      //     field: 'id'
      //   },
      //   onDelete: 'CASCADE',
      //   onUpdate: 'CASCADE',
      //   transaction
      // });

      console.log('✓ Migration completed successfully');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Migration failed:', error);
      throw error;
    }
  },

  /**
   * Down migration - reverses the schema changes
   * 
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize constructor
   */
  down: async (queryInterface, _Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // TODO: Add the reverse operations here
      // Examples:
      
      // 1. Drop the table created in up()
      // await queryInterface.dropTable('new_table', { transaction });

      // 2. Remove the column added in up()
      // await queryInterface.removeColumn('existing_table', 'new_column', { transaction });

      // 3. Reverse column modifications
      // await queryInterface.changeColumn('table_name', 'column_name', {
      //   type: Sequelize.STRING(100), // Original type
      //   allowNull: true // Original allowNull setting
      // }, { transaction });

      // 4. Remove indexes
      // await queryInterface.removeIndex('table_name', 'column_name', { transaction });

      // 5. Remove foreign key constraints
      // await queryInterface.removeConstraint('child_table', 'fk_child_table_parent_id', { transaction });

      console.log('✓ Rollback completed successfully');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Rollback failed:', error);
      throw error;
    }
  }
};

/**
 * Migration Best Practices:
 * 
 * 1. Always use transactions for data integrity
 * 2. Test migrations on a copy of production data
 * 3. Make migrations idempotent when possible
 * 4. Use descriptive migration names
 * 5. Document breaking changes in comments
 * 6. Consider data migration in addition to schema changes
 * 7. Always provide a working down() method
 * 8. Use proper foreign key constraints with CASCADE/RESTRICT rules
 * 9. Add appropriate indexes for performance
 * 10. Validate data integrity after migration
 */

/**
 * Common Migration Patterns:
 * 
 * Adding a new table with relationships:
 * - Create the table
 * - Add foreign key constraints
 * - Add indexes for performance
 * - Consider soft delete columns if needed
 * 
 * Modifying existing data:
 * - Backup data if necessary
 * - Update data in batches for large tables
 * - Validate data integrity
 * - Update related tables if needed
 * 
 * Renaming columns/tables:
 * - Create new column/table
 * - Copy data
 * - Update foreign keys and indexes
 * - Drop old column/table
 * 
 * Adding constraints:
 * - Validate existing data meets new constraints
 * - Add constraints with proper error handling
 * - Consider performance impact
 */