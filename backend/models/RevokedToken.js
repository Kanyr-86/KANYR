const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RevokedToken = sequelize.define('RevokedToken', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'A token nem lehet üres'
        }
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'felhasznalos',
        key: 'user_id'
      }
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'Érvényes dátumot kell megadni'
        }
      }
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'revoked_tokens',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['token'] },
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
      { fields: ['revoked_at'] }
    ]
  });

  RevokedToken.associate = (models) => {
    RevokedToken.belongsTo(models.Felhasznalo, {
      foreignKey: 'user_id',
      as: 'felhasznalo'
    });
  };

  return RevokedToken;
};
