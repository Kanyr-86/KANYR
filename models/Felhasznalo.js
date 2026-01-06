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
    admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        isBoolean: {
          msg: 'Az admin mező csak true vagy false értéket vehet fel'
        }
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
    // Egyelőre nincsenek kapcsolatok
    // A jövőben itt definiálhatók kapcsolatok
  };

  return Felhasznalo;
};
