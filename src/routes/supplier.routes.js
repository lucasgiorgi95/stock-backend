const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt.supabase');
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplier.controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(validarJWT);

/**
 * @route   GET /api/v1/suppliers
 * @desc    Obtener todos los proveedores del usuario autenticado
 * @access  Private
 */
router.get('/', getSuppliers);

/**
 * @route   GET /api/v1/suppliers/:id
 * @desc    Obtener un proveedor por ID
 * @access  Private
 */
router.get('/:id', getSupplierById);

/**
 * @route   POST /api/v1/suppliers
 * @desc    Crear un nuevo proveedor
 * @access  Private
 */
router.post(
  '/',
  [
    check('name', 'El nombre es obligatorio').not().isEmpty().trim(),
    check('contact', 'El contacto debe ser un texto').optional().isString().trim(),
    check('phone', 'El teléfono debe ser válido').optional().isString().trim(),
    check('email', 'El correo electrónico debe ser válido').optional().isEmail(),
    check('address', 'La dirección debe ser un texto').optional().isString().trim(),
    validarCampos
  ],
  createSupplier
);

/**
 * @route   PUT /api/v1/suppliers/:id
 * @desc    Actualizar un proveedor existente
 * @access  Private
 */
router.put(
  '/:id',
  [
    check('name', 'El nombre es obligatorio').optional().not().isEmpty().trim(),
    check('contact', 'El contacto debe ser un texto').optional().isString().trim(),
    check('phone', 'El teléfono debe ser válido').optional().isString().trim(),
    check('email', 'El correo electrónico debe ser válido').optional().isEmail(),
    check('address', 'La dirección debe ser un texto').optional().isString().trim(),
    check('isActive', 'El estado activo debe ser un valor booleano').optional().isBoolean(),
    validarCampos
  ],
  updateSupplier
);

/**
 * @route   DELETE /api/v1/suppliers/:id
 * @desc    Eliminar un proveedor
 * @access  Private
 */
router.delete('/:id', deleteSupplier);

module.exports = router;
