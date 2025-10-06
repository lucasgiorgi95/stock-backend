require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

// Iniciar el servidor (sin Sequelize, usando Supabase)
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Usando Supabase como base de datos`);
});
