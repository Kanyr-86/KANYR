const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SzobaValtoztatas = sequelize.define('SzobaValtoztatas', {
    valtoztatas_id: {
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
    jelenlegi_szoba_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'szobas',
        key: 'szoba_id'
      }
    },
    kivant_szoba_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'szobas',
        key: 'szoba_id'
      }
    },
    statusz: {
      type: DataTypes.ENUM('pending', 'approved', 'denied'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'approved', 'denied']],
          msg: 'A státusz csak pending, approved vagy denied lehet'
        }
      }
    },
    indok: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    academic_year: {
      type: DataTypes.STRING(9), // Format: "2024-2025"
      allowNull: false
    },
    semester_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 3
      }
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'szobavaltoztatas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Enable soft delete functionality
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['diak_id'] },
      { fields: ['jelenlegi_szoba_id'] },
      { fields: ['kivant_szoba_id'] },
      { fields: ['statusz'] },
      { fields: ['academic_year'] },
      { fields: ['statusz', 'academic_year'] },
      { fields: ['deleted_at'] }
    ]
  });

  // Kapcsolatok definiálása
  SzobaValtoztatas.associate = (models) => {
    // Egy szobaváltáshoz tartozik egy diák
    SzobaValtoztatas.belongsTo(models.Diak, {
      foreignKey: 'diak_id',
      as: 'diak'
    });

    // Egy szobaváltáshoz tartozik egy jelenlegi szoba
    SzobaValtoztatas.belongsTo(models.Szoba, {
      foreignKey: 'jelenlegi_szoba_id',
      as: 'jelenlegi_szoba'
    });

    // Egy szobaváltáshoz tartozik egy kívánt szoba
    SzobaValtoztatas.belongsTo(models.Szoba, {
      foreignKey: 'kivant_szoba_id',
      as: 'kivant_szoba'
    });
  };

  // Audit logging hooks
  SzobaValtoztatas.addHook('afterCreate', async (valtoztatas, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logCreate({
        tableName: 'szobavaltoztatas',
        recordId: valtoztatas.valtoztatas_id,
        req: options.transaction.req,
        newValues: valtoztatas.toJSON()
      });
    }
  });

  SzobaValtoztatas.addHook('afterUpdate', async (valtoztatas, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      const oldValues = options.attributes ? options.attributes.old : null;
      await AuditLogger.logUpdate({
        tableName: 'szobavaltoztatas',
        recordId: valtoztatas.valtoztatas_id,
        req: options.transaction.req,
        oldValues: oldValues,
        newValues: valtoztatas.toJSON()
      });
    }
  });

  SzobaValtoztatas.addHook('afterDestroy', async (valtoztatas, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logDelete({
        tableName: 'szobavaltoztatas',
        recordId: valtoztatas.valtoztatas_id,
        req: options.transaction.req,
        oldValues: valtoztatas.toJSON()
      });
    }
  });

  return SzobaValtoztatas;
};
