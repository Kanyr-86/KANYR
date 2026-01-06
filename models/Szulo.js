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
    //   references: {
    //     model: 'Lakcims',
    //     key: 'cim_id'
    //   }
    }
  }, {
    tableName: 'szulos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
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

  return Szulo;
};
