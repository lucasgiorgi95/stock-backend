const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt.supabase');
const {
  getMarcas,
  getMarcaById,
  createMarca,
  updateMarca,
  deleteMarca
} = require('../controllers/marca.controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(validarJWT);

/**
 * @route   GET /api/v1/marcas
 * @desc    Obtener todas las marcas del usuario autenticado
 * @access  Private
 */
router.get('/', getMarcas);

/**
 * @route   GET /api/v1/marcas/:id
 * @desc    Obtener una marca por ID
 * @access  Private
 */
router.get('/:id', getMarcaById);

/**
 * @route   POST /api/v1/marcas
 * @desc    Crear una nueva marca
 * @access  Private
 */
router.post(
  '/',
  [
    check('nombre', 'El nombre es obligatorio').not().isEmpty().trim(),
    check('descripcion', 'La descripción debe ser un texto').optional().isString().trim(),
    validarCampos
  ],
  createMarca
);

/**
 * @route   PUT /api/v1/marcas/:id
 * @desc    Actualizar una marca existente
 * @access  Private
 */
router.put(
  '/:id',
  [
    check('nombre', 'El nombre es obligatorio').optional().not().isEmpty().trim(),
    check('descripcion', 'La descripción debe ser un texto').optional().isString().trim(),
    check('activa', 'El estado activo debe ser un valor booleano').optional().isBoolean(),
    validarCampos
  ],
  updateMarca
);

/**
 * @route   DELETE /api/v1/marcas/:id
 * @desc    Eliminar una marca
 * @access  Private
 */
router.delete('/:id', deleteMarca);

module.exports = router;
