const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
    // Removido el auto-hash para evitar doble hash
    // El hash se hace manualmente en el controlador
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['password'] } // No devolver la contraseña por defecto
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] } // Incluir la contraseña cuando se use este scope
    }
  }
});

// Método para verificar contraseña
User.prototype.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = User;
