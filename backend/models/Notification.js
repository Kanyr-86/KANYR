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
      type: DataTypes.ENUM(
        'room_change_approved',
        'room_change_denied',
        'room_change_pending',
        'system_announcement',
        'student_notification',
        'general_alert',
        'password_reset_required'
      ),
      allowNull: false
    },
    cimzettkor: {
      type: DataTypes.ENUM('admin', 'student', 'both'),
      allowNull: false,
      defaultValue: 'student'
    },
    prioritas: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    olvasva_datum: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    uzenet: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    elolvasva: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Enable soft delete functionality
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['diak_id'] },
      { fields: ['szoba_valtoztatas_id'] },
      { fields: ['elolvasva'] },
      { fields: ['diak_id', 'elolvasva'] },
      { fields: ['deleted_at'] }
    ]
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

  // Audit logging hooks
  Notification.addHook('afterCreate', async (notification, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logCreate({
        tableName: 'notifications',
        recordId: notification.notification_id,
        req: options.transaction.req,
        newValues: notification.toJSON()
      });
    }
  });

  Notification.addHook('afterUpdate', async (notification, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      const oldValues = options.attributes ? options.attributes.old : null;
      await AuditLogger.logUpdate({
        tableName: 'notifications',
        recordId: notification.notification_id,
        req: options.transaction.req,
        oldValues: oldValues,
        newValues: notification.toJSON()
      });
    }
  });

  Notification.addHook('afterDestroy', async (notification, options) => {
    if (options.transaction && options.transaction.req) {
      const AuditLogger = require('../utils/auditLogger');
      await AuditLogger.logDelete({
        tableName: 'notifications',
        recordId: notification.notification_id,
        req: options.transaction.req,
        oldValues: notification.toJSON()
      });
    }
  });

  return Notification;
};
