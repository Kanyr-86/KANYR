const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Lakcim = sequelize.define('Lakcim', {
    cim_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    orszag: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Magyarország',
      validate: {
        notEmpty: {
          msg: 'Az ország nem lehet üres'
        }
      }
    },
    iranyitoszam: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Az irányítószám nem lehet üres'
        }
      }
    },
    varos: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'A város nem lehet üres'
        }
      }
    },
    utca_hazszam: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Az utca és házszám nem lehet üres'
        }
      }
    }
  }, {
    tableName: 'lakcims',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Kapcsolatok definiálása
  Lakcim.associate = (models) => {
    // Egy lakcímhez több diák is tartozhat
    Lakcim.hasMany(models.Diak, {
      foreignKey: 'cim_id',
      as: 'diaks'
    });

    // Egy lakcímhez több szülő is tartozhat
    Lakcim.hasMany(models.Szulo, {
      foreignKey: 'cim_id',
      as: 'szulos'
    });
  };

  return Lakcim;
};
