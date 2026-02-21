const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    notification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    cimzett_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Címzett ID-ja (diak_id, szulo_id, vagy user_id)'
    },
    cimzett_tipus: {
      type: DataTypes.ENUM('diak', 'szulo', 'admin'),
      allowNull: false,
      defaultValue: 'diak',
      comment: 'Címzett típusa: diak, szulo vagy admin'
    },
    tipus: {
      type: DataTypes.ENUM('szobavaltas', 'hatarido', 'rendszer', 'egyeb'),
      allowNull: false,
      defaultValue: 'egyeb',
      comment: 'Értesítés típusa'
    },
    cim: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Rövid cím'
    },
    uzenet: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Részletes üzenet'
    },
    adat: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Opcionális metaadatok (pl. szoba_id, diak_id, hatarido)'
    },
    olvasva: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Olvasott-e az értesítés'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Kapcsolatok definiálása
  Notification.associate = (models) => {
    // Egy értesítéshez tartozhat egy diák (ha cimzett_tipus = 'diak')
    Notification.belongsTo(models.Diak, {
      foreignKey: 'cimzett_id',
      as: 'diak_cimzett',
      constraints: false,
      scope: {
        cimzett_tipus: 'diak'
      }
    });

    // Egy értesítéshez tartozhat egy szülő (ha cimzett_tipus = 'szulo')
    Notification.belongsTo(models.Szulo, {
      foreignKey: 'cimzett_id',
      as: 'szulo_cimzett',
      constraints: false,
      scope: {
        cimzett_tipus: 'szulo'
      }
    });
  };

  return Notification;
};