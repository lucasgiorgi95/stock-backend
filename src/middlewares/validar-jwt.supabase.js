const { response } = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Middleware para validar el token JWT usando Supabase
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función para continuar con el siguiente middleware
 */
const validarJWT = async (req, res = response, next) => {
  // Buscar token en diferentes headers
  let token = req.header('x-token');
  
  // Si no está en x-token, buscar en Authorization header
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remover 'Bearer ' del inicio
    }
  }

  console.log('🔍 Token recibido:', token ? `${token.substring(0, 20)}...` : 'No token');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No hay token en la petición'
    });
  }

  try {
    // El token JWT contiene 'id' no 'uid' según el controlador de auth
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Token decodificado:', { id: decoded.id, email: decoded.email });
    
    const userId = decoded.id || decoded.uid;
    
    // Buscar el usuario en Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, is_active')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.log('❌ Usuario no encontrado para ID:', userId, error?.message);
      return res.status(401).json({
        success: false,
        message: 'Token no válido - usuario no existe en BD'
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      console.log('❌ Usuario inactivo:', user.username);
      return res.status(401).json({
        success: false,
        message: 'Token no válido - usuario inactivo'
      });
    }

    console.log('✅ Usuario autenticado:', user.username);
    // Agregar el usuario a la petición (convertir is_active a isActive para compatibilidad)
    req.user = {
      ...user,
      isActive: user.is_active
    };
    next();
  } catch (error) {
    console.log('❌ Error validando token:', error.message);
    res.status(401).json({
      success: false,
      message: 'Token no válido'
    });
  }
};

module.exports = {
  validarJWT
};