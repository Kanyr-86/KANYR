/**
 * Migration: Create Initial Schema Snapshot
 * 
 * This migration creates a snapshot of the current database schema.
 * It ensures that all tables and their relationships are properly defined
 * and tracked in the migration system.
 * 
 * This migration is idempotent - it will only create tables that don't exist.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Create szulos table (if not exists)
      await queryInterface.createTable('szulos', {
        szulo_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        nev: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        telefonszam: {
          type: Sequelize.STRING(20),
          allowNull: false
        },
        szemelyi_igazolvany_szam: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        }
      }, { transaction });

      // Create lakcims table (if not exists)
      await queryInterface.createTable('lakcims', {
        cim_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        iranyitoszam: {
          type: Sequelize.STRING(10),
          allowNull: false
        },
        varos: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        utca: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        hazszam: {
          type: Sequelize.STRING(10),
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        }
      }, { transaction });

      // Create diaks table (if not exists)
      await queryInterface.createTable('diaks', {
        diak_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        nev: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        telefonszam: {
          type: Sequelize.STRING(20),
          allowNull: false
        },
        szuletesi_datum: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        szemelyi_igazolvany_szam: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        taj_szam: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        diakigazolvany_szam: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        szulo_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'szulos',
            key: 'szulo_id'
          }
        },
        kapcsolat_tipusa: {
          type: Sequelize.ENUM('anya', 'apa', 'gondviselo'),
          allowNull: false
        },
        cim_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'lakcims',
            key: 'cim_id'
          }
        },
        nem: {
          type: Sequelize.ENUM('férfi', 'nő'),
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        }
      }, { transaction });

      // Create szobas table (if not exists)
      await queryInterface.createTable('szobas', {
        szoba_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        szobaszam: {
          type: Sequelize.STRING(10),
          allowNull: false,
          unique: true
        },
        emelet: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        ferohely: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        allapot: {
          type: Sequelize.ENUM('szabad', 'foglalt', 'karbantartas'),
          allowNull: false,
          defaultValue: 'szabad'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        }
      }, { transaction });

      // Create szoba_bekoltozeseks table (if not exists)
      await queryInterface.createTable('szoba_bekoltozeseks', {
        bekoltozes_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        diak_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'diaks',
            key: 'diak_id'
          }
        },
        szoba_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'szobas',
            key: 'szoba_id'
          }
        },
        bekoltozes_datuma: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        kikoltozes_datuma: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        }
      }, { transaction });

      // Create szoba_valtoztatass table (if not exists)
      await queryInterface.createTable('szoba_valtoztatass', {
        valtoztatas_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        diak_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'diaks',
            key: 'diak_id'
          }
        },
        regi_szoba_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'szobas',
            key: 'szoba_id'
          }
        },
        uj_szoba_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'szobas',
            key: 'szoba_id'
          }
        },
        valtoztatas_ideje: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        ok: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        }
      }, { transaction });

      // Create notifications table (if not exists)
      await queryInterface.createTable('notifications', {
        notification_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        diak_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'diaks',
            key: 'diak_id'
          }
        },
        uzenet: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        statusz: {
          type: Sequelize.ENUM('unread', 'read'),
          allowNull: false,
          defaultValue: 'unread'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        }
      }, { transaction });

      // Create felhasznalos table (if not exists)
      await queryInterface.createTable('felhasznalos', {
        felhasznalo_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        felhasznalonev: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        jelszo: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        szerepkor: {
          type: Sequelize.ENUM('admin', 'user'),
          allowNull: false,
          defaultValue: 'user'
        },
        aktiv: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        }
      }, { transaction });

      // Create revoked_tokens table (if not exists)
      await queryInterface.createTable('revoked_tokens', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        token: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        revoked_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Create audit_logs table (if not exists)
      await queryInterface.createTable('audit_logs', {
        audit_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        table_name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        record_id: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        operation: {
          type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE'),
          allowNull: false
        },
        old_values: {
          type: Sequelize.JSON,
          allowNull: true
        },
        new_values: {
          type: Sequelize.JSON,
          allowNull: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        user_email: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Add indexes for performance
      await queryInterface.addIndex('diaks', ['email'], { transaction });
      await queryInterface.addIndex('diaks', ['szulo_id'], { transaction });
      await queryInterface.addIndex('diaks', ['cim_id'], { transaction });
      await queryInterface.addIndex('diaks', ['nev'], { transaction });
      await queryInterface.addIndex('diaks', ['szemelyi_igazolvany_szam'], { transaction });
      await queryInterface.addIndex('diaks', ['taj_szam'], { transaction });
      await queryInterface.addIndex('diaks', ['diakigazolvany_szam'], { transaction });
      await queryInterface.addIndex('diaks', ['deleted_at'], { transaction });

      await queryInterface.addIndex('szobas', ['szobaszam'], { transaction });
      await queryInterface.addIndex('szobas', ['allapot'], { transaction });
      await queryInterface.addIndex('szobas', ['deleted_at'], { transaction });

      await queryInterface.addIndex('szoba_bekoltozeseks', ['diak_id'], { transaction });
      await queryInterface.addIndex('szoba_bekoltozeseks', ['szoba_id'], { transaction });
      await queryInterface.addIndex('szoba_bekoltozeseks', ['bekoltozes_datuma'], { transaction });
      await queryInterface.addIndex('szoba_bekoltozeseks', ['deleted_at'], { transaction });

      await queryInterface.addIndex('szoba_valtoztatass', ['diak_id'], { transaction });
      await queryInterface.addIndex('szoba_valtoztatass', ['regi_szoba_id'], { transaction });
      await queryInterface.addIndex('szoba_valtoztatass', ['uj_szoba_id'], { transaction });
      await queryInterface.addIndex('szoba_valtoztatass', ['valtoztatas_ideje'], { transaction });
      await queryInterface.addIndex('szoba_valtoztatass', ['deleted_at'], { transaction });

      await queryInterface.addIndex('notifications', ['diak_id'], { transaction });
      await queryInterface.addIndex('notifications', ['statusz'], { transaction });
      await queryInterface.addIndex('notifications', ['deleted_at'], { transaction });

      await queryInterface.addIndex('felhasznalos', ['felhasznalonev'], { transaction });
      await queryInterface.addIndex('felhasznalos', ['email'], { transaction });
      await queryInterface.addIndex('felhasznalos', ['szerepkor'], { transaction });
      await queryInterface.addIndex('felhasznalos', ['deleted_at'], { transaction });

      await queryInterface.addIndex('audit_logs', ['table_name'], { transaction });
      await queryInterface.addIndex('audit_logs', ['record_id'], { transaction });
      await queryInterface.addIndex('audit_logs', ['operation'], { transaction });
      await queryInterface.addIndex('audit_logs', ['user_id'], { transaction });
      await queryInterface.addIndex('audit_logs', ['created_at'], { transaction });

      await queryInterface.addIndex('revoked_tokens', ['token'], { transaction });
      await queryInterface.addIndex('revoked_tokens', ['revoked_at'], { transaction });
      await queryInterface.addIndex('revoked_tokens', ['expires_at'], { transaction });

      console.log('✓ Initial schema snapshot migration completed successfully');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Failed to create initial schema snapshot:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Drop tables in reverse order to avoid foreign key constraint issues
      await queryInterface.dropTable('audit_logs', { transaction });
      await queryInterface.dropTable('revoked_tokens', { transaction });
      await queryInterface.dropTable('felhasznalos', { transaction });
      await queryInterface.dropTable('notifications', { transaction });
      await queryInterface.dropTable('szoba_valtoztatass', { transaction });
      await queryInterface.dropTable('szoba_bekoltozeseks', { transaction });
      await queryInterface.dropTable('szobas', { transaction });
      await queryInterface.dropTable('diaks', { transaction });
      await queryInterface.dropTable('lakcims', { transaction });
      await queryInterface.dropTable('szulos', { transaction });

      console.log('✓ Initial schema snapshot rollback completed');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Failed to rollback initial schema snapshot:', error);
      throw error;
    }
  }
};