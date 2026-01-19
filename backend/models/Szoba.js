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
    }
  }, {
    tableName: 'szobas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Kapcsolatok definiálása
  Szoba.associate = (models) => {
    // Egy szobához több beköltözés is tartozhat
    Szoba.hasMany(models.SzobaBekoltozes, {
      foreignKey: 'szoba_id',
      as: 'bekoltozesek'
    });
  };

  return Szoba;
};
