const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Por ahora usar SQLite para Sequelize y Supabase client para operaciones directas
const isRailway = process.env.RAILWAY_VOLUME_MOUNT_PATH;
let dbPath;

if (isRailway) {
  dbPath = path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'database.sqlite');
} else {
  dbPath = path.join(__dirname, '../../database.sqlite');
}

const sequelize = new Sequelize({
  dialect: 'sqlite',  
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

console.log(`📊 Sequelize configurado: SQLite (${dbPath})`);
console.log('🔗 Supabase client disponible para operaciones directas');

module.exports = sequelize;
