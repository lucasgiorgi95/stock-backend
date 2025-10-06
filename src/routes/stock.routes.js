const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt.supabase');
const {
  adjustStock,
  getDashboardData
} = require('../controllers/stock.supabase.controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(validarJWT);

/**
 * @route   POST /api/v1/stock/adjust
 * @desc    Ajustar el stock de un producto
 * @access  Private
 */
router.post(
  '/adjust',
  [
    check('productId', 'El ID del producto es requerido').not().isEmpty(),
    check('quantity', 'La cantidad es requerida').isNumeric(),
    check('reason', 'El motivo del ajuste es requerido').not().isEmpty().trim(),
    check('notes', 'Las notas deben ser un texto').optional().isString().trim(),
    validarCampos
  ],
  adjustStock
);

/**
 * @route   GET /api/v1/stock/dashboard
 * @desc    Obtener datos para el dashboard de stock
 * @access  Private
 */
router.get('/dashboard', getDashboardData);

module.exports = router;
