/**
 * Database Migration Runner
 * 
 * This script runs all pending migrations in the migrations folder.
 * Usage: node run-migrations.js
 *        node run-migrations.js --rollback (to rollback last migration)
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('./config/database');

const migrationsDir = path.join(__dirname, 'migrations');

// Migration tracking table name
const MIGRATION_TABLE = 'SequelizeMeta';

/**
 * Initialize the migrations tracking table
 */
async function initMigrationTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      name VARCHAR(255) PRIMARY KEY
    )
  `);
}

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
 * Record a migration as applied
 */
async function recordMigration(migrationName) {
  await sequelize.query(
    `INSERT INTO ${MIGRATION_TABLE} (name) VALUES (?)`,
    { replacements: [migrationName] }
  );
}

/**
 * Remove a migration record
 */
async function removeMigrationRecord(migrationName) {
  await sequelize.query(
    `DELETE FROM ${MIGRATION_TABLE} WHERE name = ?`,
    { replacements: [migrationName] }
  );
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
 * Run all pending migrations
 */
async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  try {
    await initMigrationTable();
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();

    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('✓ No pending migrations');
      return;
    }

    for (const migrationFile of pendingMigrations) {
      console.log(`  → Running: ${migrationFile}`);
      
      const migration = require(path.join(migrationsDir, migrationFile));
      await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
      await recordMigration(migrationFile);
      
      console.log(`    ✓ Completed`);
    }

    console.log(`\n✓ Successfully ran ${pendingMigrations.length} migration(s)`);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Rollback the last migration
 */
async function rollbackMigration() {
  console.log('🔄 Rolling back last migration...\n');

  try {
    await initMigrationTable();
    const appliedMigrations = await getAppliedMigrations();

    if (appliedMigrations.length === 0) {
      console.log('✓ No migrations to rollback');
      return;
    }

    const lastMigration = appliedMigrations[appliedMigrations.length - 1];
    console.log(`  → Rolling back: ${lastMigration}`);

    const migration = require(path.join(migrationsDir, lastMigration));
    await migration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await removeMigrationRecord(lastMigration);

    console.log(`    ✓ Rolled back successfully`);
    console.log(`\n✓ Rollback complete`);
  } catch (error) {
    console.error('\n✗ Rollback failed:', error.message);
    process.exit(1);
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  console.log('📊 Migration Status\n');

  try {
    await initMigrationTable();
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();

    console.log(`Applied migrations: ${appliedMigrations.length}`);
    console.log(`Pending migrations: ${migrationFiles.length - appliedMigrations.length}\n`);

    migrationFiles.forEach(file => {
      const isApplied = appliedMigrations.includes(file);
      console.log(`  ${isApplied ? '✓' : '○'} ${file}`);
    });
  } catch (error) {
    console.error('✗ Failed to get status:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    await sequelize.authenticate();
    
    switch (command) {
      case '--rollback':
        await rollbackMigration();
        break;
      case '--status':
        await showStatus();
        break;
      default:
        await runMigrations();
    }
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();