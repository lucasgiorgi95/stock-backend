const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt.supabase');
const {
  createMovement,
  getMovementsByProduct
} = require('../controllers/movement.controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(validarJWT);

/**
 * @route   POST /api/v1/movements
 * @desc    Crear un nuevo movimiento de stock
 * @access  Private
 */
router.post(
  '/',
  [
    check('productId', 'El ID del producto es requerido').not().isEmpty(),
    check('type', 'El tipo de movimiento es requerido (entrada/salida)').isIn(['entrada', 'salida']),
    check('quantity', 'La cantidad es requerida y debe ser mayor a 0').isFloat({ gt: 0 }),
    check('reason', 'El motivo del movimiento es requerido').not().isEmpty().trim(),
    check('reference', 'La referencia debe ser un texto').optional().isString().trim(),
    check('notes', 'Las notas deben ser un texto').optional().isString().trim(),
    validarCampos
  ],
  createMovement
);

/**
 * @route   GET /api/v1/movements/:productId
 * @desc    Obtener historial de movimientos de un producto
 * @access  Private
 */
router.get(
  '/:productId',
  [
    check('productId', 'El ID del producto es requerido').not().isEmpty(),
    check('page', 'La página debe ser un número').optional().isInt({ min: 1 }),
    check('limit', 'El límite debe ser un número').optional().isInt({ min: 1 }),
    check('startDate', 'La fecha de inicio debe ser una fecha válida').optional().isISO8601(),
    check('endDate', 'La fecha de fin debe ser una fecha válida').optional().isISO8601(),
    check('type', 'El tipo debe ser "entrada" o "salida"').optional().isIn(['entrada', 'salida']),
    validarCampos
  ],
  getMovementsByProduct
);

module.exports = router;
