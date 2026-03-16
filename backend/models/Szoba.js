const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Szoba = sequelize.define('Szoba', {
    szoba_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    szoba_szama: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'A szoba száma nem lehet üres'
        }
      }
    },
    osszes_hely: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'A férőhely szám egész számnak kell legyen'
        },
        min: {
          args: [1],
          msg: 'A férőhely számnak legalább 1-nek kell lennie'
        }
      }
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'szobas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Enable soft delete functionality
    deletedAt: 'deleted_at',
    indexes: [
      { unique: true, fields: ['szoba_szama'] },
      { fields: ['deleted_at'] }
    ]
  });

  // Kapcsolatok definiálása
  Szoba.associate = (models) => {
    // Egy szobához több beköltözés is tartozhat
    Szoba.hasMany(models.SzobaBekoltozes, {
      foreignKey: 'szoba_id',
      as: 'bekoltozesek'
    });

    // Egy szobához több szobaváltás is tartozhat (jelenlegi és kívánt szobaként)
    Szoba.hasMany(models.SzobaValtoztatas, {
      foreignKey: 'jelenlegi_szoba_id',
      as: 'jelenlegi_valtoztatasok'
    });

    Szoba.hasMany(models.SzobaValtoztatas, {
      foreignKey: 'kivant_szoba_id',
      as: 'kivant_valtoztatasok'
    });
  };

  // Audit logging hooks
  Szoba.addHook('afterCreate', async (szoba, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logCreate({
        tableName: 'szobas',
        recordId: szoba.szoba_id,
        req: options.transaction.req,
        newValues: szoba.toJSON()
      });
    }
  });

  Szoba.addHook('afterUpdate', async (szoba, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      const oldValues = options.attributes ? options.attributes.old : null;
      await AuditLogger.logUpdate({
        tableName: 'szobas',
        recordId: szoba.szoba_id,
        req: options.transaction.req,
        oldValues: oldValues,
        newValues: szoba.toJSON()
      });
    }
  });

  Szoba.addHook('afterDestroy', async (szoba, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logDelete({
        tableName: 'szobas',
        recordId: szoba.szoba_id,
        req: options.transaction.req,
        oldValues: szoba.toJSON()
      });
    }
  });

  return Szoba;
};
