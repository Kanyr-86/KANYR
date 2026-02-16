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
    }
  }, {
    tableName: 'szobavaltoztatas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
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

  return SzobaValtoztatas;
};