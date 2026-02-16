const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    notification_id: {
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
    szoba_valtoztatas_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'szobavaltoztatas',
        key: 'valtoztatas_id'
      }
    },
    tipus: {
      type: DataTypes.ENUM('room_change_approved', 'room_change_denied', 'room_change_pending'),
      allowNull: false
    },
    uzenet: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    elolvasva: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Kapcsolatok definiálása
  Notification.associate = (models) => {
    // Egy értesítéshez tartozik egy diák
    Notification.belongsTo(models.Diak, {
      foreignKey: 'diak_id',
      as: 'diak'
    });

    // Egy értesítéshez tartozhat egy szobaváltás
    Notification.belongsTo(models.SzobaValtoztatas, {
      foreignKey: 'szoba_valtoztatas_id',
      as: 'szoba_valtoztatas'
    });
  };

  return Notification;
};