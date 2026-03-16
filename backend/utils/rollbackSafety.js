/**
 * Rollback Safety Procedures
 * 
 * This utility provides functions to safely rollback migrations and ensure
 * data integrity during rollback operations.
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const logger = require('./logger');

const migrationsDir = path.join(__dirname, '../migrations');
const MIGRATION_TABLE = 'SequelizeMeta';

/**
 * Create a database backup before migration operations
 */
async function createBackup() {
  try {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
    
    // For SQLite, we can use the .dump command
    const sqlite3 = require('sqlite3');
    const db = new sqlite3.Database(path.join(__dirname, '../config/database.sqlite'));
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const backupStream = fs.createWriteStream(backupFile);
        
        db.on('profile', (sql) => {
          backupStream.write(sql + '\n');
        });

        db.each("SELECT sql FROM sqlite_master WHERE type='table'", (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          backupStream.write(row.sql + ';\n');
        });

        db.each("SELECT * FROM sqlite_master WHERE type='index'", (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          if (row.sql) {
            backupStream.write(row.sql + ';\n');
          }
        });

        // Export data
        db.each("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          const tableName = row.name;
          if (tableName.startsWith('sqlite_')) return;

          db.each(`SELECT * FROM ${tableName}`, (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            
            const values = Object.values(row).map(val => {
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return val;
            }).join(', ');

            backupStream.write(`INSERT INTO ${tableName} VALUES (${values});\n`);
          });
        });

        // Close backup stream when all operations are complete
        db.on('close', () => {
          backupStream.end(() => {
            logger.info(`Database backup created: ${backupFile}`);
            resolve(backupFile);
          });
        });
      });

      db.close(() => {
        // The stream is already closed in the 'close' event handler above
      });
    });
  } catch (error) {
    logger.error('Failed to create database backup:', error);
    throw error;
  }
}

/**
 * Validate rollback safety before proceeding
 */
async function validateRollbackSafety(migrationName) {
  try {
    // Check if migration exists and has a down() method
    const migrationPath = path.join(migrationsDir, migrationName);
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationName}`);
    }

    const migration = require(migrationPath);
    if (typeof migration.down !== 'function') {
      throw new Error(`Migration ${migrationName} does not have a down() method`);
    }

    // Check if migration has been applied
    const [results] = await sequelize.query(`
      SELECT name FROM ${MIGRATION_TABLE} WHERE name = ?
    `, { replacements: [migrationName] });

    if (results.length === 0) {
      throw new Error(`Migration ${migrationName} has not been applied`);
    }

    logger.info(`Rollback safety validation passed for: ${migrationName}`);
    return true;
  } catch (error) {
    logger.error('Rollback safety validation failed:', error);
    throw error;
  }
}

/**
 * Safe rollback with backup and validation
 */
async function safeRollback(migrationName) {
  const transaction = await sequelize.transaction();
  
  try {
    // Create backup before rollback
    logger.info('Creating backup before rollback...');
    const backupFile = await createBackup();

    // Validate rollback safety
    await validateRollbackSafety(migrationName);

    // Execute rollback
    const migrationPath = path.join(migrationsDir, migrationName);
    const migration = require(migrationPath);
    
    logger.info(`Rolling back migration: ${migrationName}`);
    await migration.down(sequelize.getQueryInterface(), sequelize.Sequelize);

    // Remove migration from tracking table
    await sequelize.query(
      `DELETE FROM ${MIGRATION_TABLE} WHERE name = ?`,
      { replacements: [migrationName], transaction }
    );

    await transaction.commit();
    
    logger.info(`✓ Successfully rolled back migration: ${migrationName}`);
    logger.info(`Backup saved to: ${backupFile}`);
    
    return {
      success: true,
      migrationName,
      backupFile,
      rollbackTime: new Date().toISOString()
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`✗ Rollback failed for migration: ${migrationName}`, { error: error.message });
    throw error;
  }
}

/**
 * Get rollback history and status
 */
async function getRollbackStatus() {
  try {
    const [appliedResults] = await sequelize.query(`
      SELECT name FROM ${MIGRATION_TABLE} ORDER BY name DESC
    `);

    const appliedMigrations = appliedResults.map(r => r.name);
    const migrationFiles = fs.existsSync(migrationsDir) 
      ? fs.readdirSync(migrationsDir).filter(file => file.endsWith('.js')).sort()
      : [];

    const pendingRollbacks = appliedMigrations.filter(migration => 
      migrationFiles.includes(migration)
    );

    return {
      appliedMigrations,
      totalMigrations: migrationFiles.length,
      pendingRollbacks,
      canRollback: pendingRollbacks.length > 0
    };
  } catch (error) {
    logger.error('Failed to get rollback status:', error);
    throw error;
  }
}

/**
 * Emergency rollback - rollback all migrations
 */
async function emergencyRollback() {
  try {
    const status = await getRollbackStatus();
    
    if (!status.canRollback) {
      logger.info('No migrations to rollback');
      return { success: true, rolledBack: 0 };
    }

    // Create emergency backup
    const backupFile = await createBackup();
    logger.info(`Emergency backup created: ${backupFile}`);

    let rolledBackCount = 0;

    // Rollback in reverse order
    for (const migrationName of status.pendingRollbacks) {
      try {
        await safeRollback(migrationName);
        rolledBackCount++;
        logger.info(`Emergency rollback: ${migrationName}`);
      } catch (error) {
        logger.error(`Emergency rollback failed for ${migrationName}:`, error);
        throw new Error(`Emergency rollback stopped at ${migrationName}: ${error.message}`, { cause: error });
      }
    }

    logger.info(`✓ Emergency rollback completed. Rolled back ${rolledBackCount} migrations`);
    return {
      success: true,
      rolledBack: rolledBackCount,
      backupFile,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Emergency rollback failed:', error);
    throw error;
  }
}

module.exports = {
  createBackup,
  validateRollbackSafety,
  safeRollback,
  getRollbackStatus,
  emergencyRollback
};