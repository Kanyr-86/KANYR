const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    audit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    table_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Name of the table that was modified'
    },
    record_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of the record that was modified'
    },
    operation: {
      type: DataTypes.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE'),
      allowNull: false,
      comment: 'Type of operation performed'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the user who performed the operation'
    },
    user_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Email of the user who performed the operation'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address from which the operation was performed'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent string of the client'
    },
    old_values: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON representation of the old values (for UPDATE/DELETE)'
    },
    new_values: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON representation of the new values (for CREATE/UPDATE)'
    },
    changes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON representation of the specific changes made'
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['table_name'] },
      { fields: ['record_id'] },
      { fields: ['operation'] },
      { fields: ['user_id'] },
      { fields: ['created_at'] },
      { fields: ['table_name', 'operation'] },
      { fields: ['user_id', 'created_at'] }
    ]
  });

  // Kapcsolatok definiálása
  AuditLog.associate = (_models) => {
    // AuditLog nem rendelkezik külső kulcsokkal, csak referencia jelleggel tárolja az adatokat
  };

  return AuditLog;
};