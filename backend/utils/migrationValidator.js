/**
 * Migration Validator
 * 
 * This utility provides functions to validate migration status and ensure
 * the database schema is in sync with the application models.
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

const migrationsDir = path.join(__dirname, '../migrations');
const MIGRATION_TABLE = 'SequelizeMeta';

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations() {
  const [results] = await sequelize.query(`
    SELECT name FROM ${MIGRATION_TABLE} ORDER BY name
  `);
  return results.map(r => r.name);
}

/**
 * Get all migration files sorted by name
 */
function getMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort();
}

/**
 * Check if migrations are up to date
 */
async function checkMigrationStatus() {
  try {
    // Ensure migration table exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
        name VARCHAR(255) PRIMARY KEY
      )
    `);

    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();
    
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );

    return {
      isUpToDate: pendingMigrations.length === 0,
      appliedCount: appliedMigrations.length,
      totalMigrations: migrationFiles.length,
      pendingMigrations,
      appliedMigrations
    };
  } catch (error) {
    throw new Error(`Migration status check failed: ${error.message}`, { cause: error });
  }
}

/**
 * Validate that migrations are up to date before starting the application
 */
async function validateMigrationsBeforeStart() {
  try {
    const status = await checkMigrationStatus();
    
    if (!status.isUpToDate) {
      console.error('\n❌ MIGRATION VALIDATION FAILED');
      console.error('================================');
      console.error('Database schema is not up to date. Pending migrations:');
      console.error('');
      
      status.pendingMigrations.forEach(migration => {
        console.error(`  • ${migration}`);
      });
      
      console.error('');
      console.error('Please run the following command to apply pending migrations:');
      console.error('  npm run migrate');
      console.error('');
      console.error('Or run migrations with rollback capability:');
      console.error('  node run-migrations.js');
      console.error('');
      
      throw new Error('Database migrations are not up to date');
    }
    
    console.log('✅ Migration validation passed - database is up to date');
    return true;
  } catch (error) {
    console.error('❌ Migration validation failed:', error.message);
    throw error;
  }
}

/**
 * Get migration status summary for monitoring
 */
async function getMigrationSummary() {
  try {
    const status = await checkMigrationStatus();
    
    return {
      timestamp: new Date().toISOString(),
      database: process.env.NODE_ENV || 'development',
      migrations: {
        total: status.totalMigrations,
        applied: status.appliedCount,
        pending: status.pendingMigrations.length,
        isUpToDate: status.isUpToDate
      },
      details: {
        appliedMigrations: status.appliedMigrations,
        pendingMigrations: status.pendingMigrations
      }
    };
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      database: process.env.NODE_ENV || 'development',
      error: error.message,
      migrations: {
        total: 0,
        applied: 0,
        pending: 0,
        isUpToDate: false
      }
    };
  }
}

module.exports = {
  checkMigrationStatus,
  validateMigrationsBeforeStart,
  getMigrationSummary
};