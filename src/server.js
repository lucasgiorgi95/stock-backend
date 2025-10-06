require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 3001; // Usar 3001 como puerto por defecto

// Sincronizar modelos con la base de datos
const init = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // En desarrollo, forzar la sincronización (eliminar en producción)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false });
      console.log('Modelos sincronizados con la base de datos.');
    }
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
    process.exit(1);
  }
};

init();
