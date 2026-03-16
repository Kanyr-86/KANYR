const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Diak = sequelize.define('Diak', {
    diak_id: {
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
    szuletesi_datum: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'Érvényes dátumot adjon meg'
        },
        notEmpty: {
          msg: 'A születési dátum nem lehet üres'
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
    taj_szam: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'A TAJ szám nem lehet üres'
        }
      }
    },
    diakigazolvany_szam: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'A diákigazolvány szám nem lehet üres'
        }
      }
    },
    szulo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'szulos',
        key: 'szulo_id'
      }
    },
    kapcsolat_tipusa: {
      type: DataTypes.ENUM('anya', 'apa', 'gondviselo'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['anya', 'apa', 'gondviselo']],
          msg: 'A kapcsolat típusa csak anya, apa vagy gondviselo lehet'
        }
      }
    },
    cim_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'lakcims',
        key: 'cim_id'
      }
    },
    nem: {
      type: DataTypes.ENUM('férfi', 'nő'),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'A nem megadása kötelező'
        },
        isIn: {
          args: [['férfi', 'nő']],
          msg: 'A nem csak "férfi" vagy "nő" lehet'
        }
      }
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'diaks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Enable soft delete functionality
    deletedAt: 'deleted_at',
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['szulo_id'] },
      { fields: ['cim_id'] },
      { fields: ['nev'] },
      { unique: true, fields: ['szemelyi_igazolvany_szam'] },
      { unique: true, fields: ['taj_szam'] },
      { unique: true, fields: ['diakigazolvany_szam'] },
      { fields: ['deleted_at'] }
    ]
  });

  // Kapcsolatok definiálása
  Diak.associate = (models) => {
    // Egy diákhoz tartozik egy szülő
    Diak.belongsTo(models.Szulo, {
      foreignKey: 'szulo_id',
      as: 'szulo'
    });

    // Egy diákhoz tartozik egy lakcím
    Diak.belongsTo(models.Lakcim, {
      foreignKey: 'cim_id',
      as: 'lakcim'
    });

    // Egy diákhoz több beköltözés is tartozhat
    Diak.hasMany(models.SzobaBekoltozes, {
      foreignKey: 'diak_id',
      as: 'bekoltozesek'
    });

    // Egy diákhoz több értesítés is tartozhat
    Diak.hasMany(models.Notification, {
      foreignKey: 'diak_id',
      as: 'notifications'
    });
  };

  // Audit logging hooks
  Diak.addHook('afterCreate', async (diak, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logCreate({
        tableName: 'diaks',
        recordId: diak.diak_id,
        req: options.transaction.req,
        newValues: diak.toJSON()
      });
    }
  });

  Diak.addHook('afterUpdate', async (diak, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      const oldValues = options.attributes ? options.attributes.old : null;
      await AuditLogger.logUpdate({
        tableName: 'diaks',
        recordId: diak.diak_id,
        req: options.transaction.req,
        oldValues: oldValues,
        newValues: diak.toJSON()
      });
    }
  });

  Diak.addHook('afterDestroy', async (diak, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logDelete({
        tableName: 'diaks',
        recordId: diak.diak_id,
        req: options.transaction.req,
        oldValues: diak.toJSON()
      });
    }
  });

  return Diak;
};
