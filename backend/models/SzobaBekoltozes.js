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
    }
  }, {
    tableName: 'szoba_bekoltozes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['diak_id'] },
      { fields: ['szoba_id'] },
      { fields: ['bekoltozes_datum'] },
      { fields: ['kikoltozes_datum'] },
      { fields: ['diak_id', 'kikoltozes_datum'] }
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

  return SzobaBekoltozes;
};
