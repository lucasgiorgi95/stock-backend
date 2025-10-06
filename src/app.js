const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { validarJWT } = require('./middlewares/validar-jwt');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rutas públicas
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Bienvenido a la API de Gestión de Inventario',
    version: '1.0.0'
  });
});

// Rutas de autenticación (públicas)
app.use('/api/v1/auth', require('./routes/auth.routes'));

// Rutas de la API (protegidas) - cada ruta maneja su propia autenticación
app.use('/api/v1/marcas', require('./routes/marca.routes'));
app.use('/api/v1/suppliers', require('./routes/supplier.routes'));
app.use('/api/v1/movements', require('./routes/movement.routes'));
app.use('/api/v1/stock', require('./routes/stock.routes'));
app.use('/api/v1/products', require('./routes/product.routes'));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: '¡Algo salió mal en el servidor!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada' 
  });
});

module.exports = app;
