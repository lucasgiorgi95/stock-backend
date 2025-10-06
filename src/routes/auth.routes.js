const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt.supabase');
const { register, login, getMe } = require('../controllers/auth.supabase.controller');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post(
  '/register',
  [
    check('username', 'El nombre de usuario es requerido y debe tener al menos 3 caracteres')
      .isLength({ min: 3 }),
    check('email', 'Por favor, introduce un correo electrónico válido')
      .isEmail(),
    check('password', 'La contraseña debe tener al menos 6 caracteres')
      .isLength({ min: 6 }),
    validarCampos
  ],
  register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión de usuario y obtener token
 * @access  Public
 */
router.post(
  '/login',
  [
    // Validar que al menos uno de los campos esté presente
    check('password', 'La contraseña es requerida').exists(),
    validarCampos
  ],
  login
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener información del usuario actual
 * @access  Private
 */
router.get('/me', validarJWT, getMe);

module.exports = router;
