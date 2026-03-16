const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SzobaBekoltozes = sequelize.define('SzobaBekoltozes', {
    bekoltozes_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    diak_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'diaks',
        key: 'diak_id'
      }
    },
    szoba_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'szobas',
        key: 'szoba_id'
      }
    },
    bekoltozes_datum: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'Érvényes dátumot adjon meg'
        },
        notEmpty: {
          msg: 'A beköltözés dátuma nem lehet üres'
        }
      }
    },
    kikoltozes_datum: {
      type: DataTypes.DATEONLY,
      allowNull: true, // NULL = diák jelenleg is a szobában lakik
      validate: {
        isDate: {
          msg: 'Érvényes dátumot adjon meg'
        }
      }
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'szoba_bekoltozes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Enable soft delete functionality
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['diak_id'] },
      { fields: ['szoba_id'] },
      { fields: ['bekoltozes_datum'] },
      { fields: ['kikoltozes_datum'] },
      { fields: ['diak_id', 'kikoltozes_datum'] },
      { fields: ['deleted_at'] }
    ]
  });

  // Kapcsolatok definiálása
  SzobaBekoltozes.associate = (models) => {
    // Egy beköltözéshez tartozik egy diák
    SzobaBekoltozes.belongsTo(models.Diak, {
      foreignKey: 'diak_id',
      as: 'diak'
    });

    // Egy beköltözéshez tartozik egy szoba
    SzobaBekoltozes.belongsTo(models.Szoba, {
      foreignKey: 'szoba_id',
      as: 'szoba'
    });
  };

  // Audit logging hooks
  SzobaBekoltozes.addHook('afterCreate', async (bekoltozes, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logCreate({
        tableName: 'szoba_bekoltozes',
        recordId: bekoltozes.bekoltozes_id,
        req: options.transaction.req,
        newValues: bekoltozes.toJSON()
      });
    }
  });

  SzobaBekoltozes.addHook('afterUpdate', async (bekoltozes, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      const oldValues = options.attributes ? options.attributes.old : null;
      await AuditLogger.logUpdate({
        tableName: 'szoba_bekoltozes',
        recordId: bekoltozes.bekoltozes_id,
        req: options.transaction.req,
        oldValues: oldValues,
        newValues: bekoltozes.toJSON()
      });
    }
  });

  SzobaBekoltozes.addHook('afterDestroy', async (bekoltozes, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logDelete({
        tableName: 'szoba_bekoltozes',
        recordId: bekoltozes.bekoltozes_id,
        req: options.transaction.req,
        oldValues: bekoltozes.toJSON()
      });
    }
  });

  return SzobaBekoltozes;
};
