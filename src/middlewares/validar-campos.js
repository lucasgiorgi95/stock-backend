const { validationResult } = require('express-validator');

/**
 * Middleware para validar los campos de la petición
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función para continuar con el siguiente middleware
 */
const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      errors: errors.mapped()
    });
  }
  next();
};

module.exports = {
  validarCampos
};
