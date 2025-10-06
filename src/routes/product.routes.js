const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt.supabase');
const {
  getProducts,
  searchProductByCode,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
} = require('../controllers/product.supabase.controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(validarJWT);

/**
 * @route   GET /api/v1/products
 * @desc    Obtener todos los productos
 * @access  Private
 */
router.get('/', getProducts);

/**
 * @route   GET /api/v1/products/search?code=XXX
 * @desc    Buscar producto por código
 * @access  Private
 */
router.get('/search', searchProductByCode);

/**
 * @route   GET /api/v1/products/low-stock
 * @desc    Obtener productos con stock bajo
 * @access  Private
 */
router.get('/low-stock', getLowStockProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Obtener un producto por ID
 * @access  Private
 */
router.get('/:id', getProductById);

/**
 * @route   POST /api/v1/products
 * @desc    Crear un nuevo producto
 * @access  Private
 */
router.post(
  '/',
  [
    check('code', 'El código es requerido').not().isEmpty().trim(),
    check('name', 'El nombre es requerido').not().isEmpty().trim(),
    check('stock', 'El stock debe ser un número').optional().isNumeric(),
    check('min_stock', 'El stock mínimo debe ser un número').optional().isNumeric(),
    check('price', 'El precio debe ser un número').optional().isNumeric(),
    check('supplierId', 'El ID del proveedor debe ser un número entero').optional().isInt(),
    check('marcaId', 'El ID de la marca debe ser un número entero').optional().isInt(),
    validarCampos
  ],
  createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Actualizar un producto existente
 * @access  Private
 */
router.put(
  '/:id',
  [
    check('code', 'El código es requerido').optional().trim().not().isEmpty(),
    check('name', 'El nombre es requerido').optional().trim().not().isEmpty(),
    check('stock', 'El stock debe ser un número').optional().isNumeric(),
    check('min_stock', 'El stock mínimo debe ser un número').optional().isNumeric(),
    check('price', 'El precio debe ser un número').optional().isNumeric(),
    check('supplierId', 'El ID del proveedor debe ser un número entero').optional().isInt(),
    check('marcaId', 'El ID de la marca debe ser un número entero').optional().isInt(),
    validarCampos
  ],
  updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Eliminar un producto
 * @access  Private
 */
router.delete('/:id', deleteProduct);

module.exports = router;
