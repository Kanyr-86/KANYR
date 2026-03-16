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
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Az email cím nem lehet üres'
        },
        isEmail: {
          msg: 'Érvénytelen email formátum'
        }
      }
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'A jelszó nem lehet üres'
        },
        len: {
          args: [8, 100],
          msg: 'A jelszónak minimum 8 karakter hosszúnak kell lennie'
        },
        isComplex(value) {
          // Password complexity validation: at least 1 uppercase, 1 lowercase, 1 number, 1 special character
          const hasUppercase = /[A-Z]/.test(value);
          const hasLowercase = /[a-z]/.test(value);
          const hasNumber = /[0-9]/.test(value);
          const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
          
          if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
            throw new Error('A jelszónak tartalmaznia kell legalább egy nagybetűt, egy kisbetűt, egy számot és egy speciális karaktert');
          }
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
    },
    diak_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'diaks',
        key: 'diak_id'
      }
    },
    token_version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isInt: {
          msg: 'A token verziónak egész számnak kell lennie'
        },
        min: {
          args: [1],
          msg: 'A token verzió minimum 1 lehet'
        }
      }
    },
    last_password_change: {
      type: DataTypes.DATE,
      allowNull: true
    },
    security_flags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'Biztonsági jelzők (pl. force_logout, suspicious_activity)'
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'felhasznalos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true, // Enable soft delete functionality
    deletedAt: 'deleted_at',
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['username'] },
      { fields: ['diak_id'] },
      { fields: ['token_version'] },
      { fields: ['deleted_at'] }
    ]
  });

  // Kapcsolatok definiálása
  // A Felhasznalo modell jelenleg nem kapcsolódik más modellekhez
  // Később itt definiálhatók kapcsolatok más modellekhez (pl. logolás, stb.)
  
  Felhasznalo.associate = (_models) => {
    // Egyelőre nincsenek kapcsolatok
    // A jövőben itt definiálhatók kapcsolatok
  };

  return Felhasznalo;
};
