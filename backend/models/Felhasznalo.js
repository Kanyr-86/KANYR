const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Felhasznalo = sequelize.define('Felhasznalo', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'A felhasználónév nem lehet üres'
        },
        len: {
          args: [3, 50],
          msg: 'A felhasználónévnek 3 és 50 karakter között kell lennie'
        }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Az email cím nem lehet üres'
        },
        isEmail: {
          msg: 'Érvénytelen email formátum'
        }
      }
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'A jelszó nem lehet üres'
        },
        len: {
          args: [8, 100],
          msg: 'A jelszónak minimum 8 karakter hosszúnak kell lennie'
        }
      }
    },
    admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        isBoolean: {
          msg: 'Az admin mező csak true vagy false értéket vehet fel'
        }
      }
    },
    diak_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'diaks',
        key: 'diak_id'
      }
    }
  }, {
    tableName: 'felhasznalos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Kapcsolatok definiálása
  // A Felhasznalo modell jelenleg nem kapcsolódik más modellekhez
  // Később itt definiálhatók kapcsolatok más modellekhez (pl. logolás, stb.)
  
  Felhasznalo.associate = (models) => {
    Felhasznalo.belongsTo(models.Diak, {
      foreignKey: 'diak_id',
      as: 'diak'
    });
  };

  return Felhasznalo;
};
