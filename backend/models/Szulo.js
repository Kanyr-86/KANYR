const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Szulo = sequelize.define('Szulo', {
    szulo_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nev: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'A név nem lehet üres'
        },
        len: {
          args: [2, 100],
          msg: 'A névnek 2 és 100 karakter között kell lennie'
        }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Érvényes email címet adjon meg'
        },
        notEmpty: {
          msg: 'Az email nem lehet üres'
        }
      }
    },
    telefonszam: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'A telefonszám nem lehet üres'
        }
      }
    },
    szemelyi_igazolvany_szam: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'A személyi igazolvány szám nem lehet üres'
        }
      }
    },
    cim_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lakcims',
        key: 'cim_id'
      }
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'szulos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Enable soft delete functionality
    deletedAt: 'deleted_at',
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['cim_id'] },
      { unique: true, fields: ['szemelyi_igazolvany_szam'] },
      { fields: ['deleted_at'] }
    ]
  });

  // Kapcsolatok definiálása
  Szulo.associate = (models) => {
    // Egy szülőhöz tartozik egy lakcím
    Szulo.belongsTo(models.Lakcim, {
      foreignKey: 'cim_id',
      as: 'lakcim'
    });

    // Egy szülőhöz több diák is tartozhat (kapcsolattartó lehet több gyerekhez)
    Szulo.hasMany(models.Diak, {
      foreignKey: 'szulo_id',
      as: 'diaks'
    });
  };

  // Audit logging hooks
  Szulo.addHook('afterCreate', async (szulo, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logCreate({
        tableName: 'szulos',
        recordId: szulo.szulo_id,
        req: options.transaction.req,
        newValues: szulo.toJSON()
      });
    }
  });

  Szulo.addHook('afterUpdate', async (szulo, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      const oldValues = options.attributes ? options.attributes.old : null;
      await AuditLogger.logUpdate({
        tableName: 'szulos',
        recordId: szulo.szulo_id,
        req: options.transaction.req,
        oldValues: oldValues,
        newValues: szulo.toJSON()
      });
    }
  });

  Szulo.addHook('afterDestroy', async (szulo, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logDelete({
        tableName: 'szulos',
        recordId: szulo.szulo_id,
        req: options.transaction.req,
        oldValues: szulo.toJSON()
      });
    }
  });

  return Szulo;
};
