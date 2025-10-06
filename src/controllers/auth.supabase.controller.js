const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * @desc    Registrar un nuevo usuario
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    console.log('🔍 Datos recibidos en registro:', req.body);
    const { username, email, password } = req.body;

    // Validar campos requeridos
    if (!username || !email || !password) {
      console.log('❌ Faltan campos requeridos');
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos (username, email, password)'
      });
    }

    // Verificar si el usuario ya existe
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, email, username')
      .or(`email.eq.${email.toLowerCase()},username.eq.${username.toLowerCase()}`);

    if (checkError) {
      throw checkError;
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      console.log('❌ Usuario ya existe:', existingUser);
      return res.status(400).json({
        success: false,
        message: `Ya existe un usuario con ${existingUser.email === email.toLowerCase() ? 'ese email' : 'ese nombre de usuario'}`
      });
    }

    console.log('✅ Usuario no existe, procediendo a crear...');

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert([{
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        is_active: true
      }])
      .select('id, username, email, is_active, created_at')
      .single();

    if (createError) {
      throw createError;
    }

    console.log('✅ Usuario creado exitosamente:', user.id);

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el usuario',
      error: error.message
    });
  }
};
/**

 * @desc    Iniciar sesión de usuario
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginField = email || username;

    // Validar campos requeridos
    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico/usuario y la contraseña son requeridos'
      });
    }

    console.log(`🔍 Intentando login con: ${loginField}`);

    // Buscar usuario por email O username
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${loginField.toLowerCase()},username.eq.${loginField.toLowerCase()}`)
      .limit(1);

    if (findError) {
      throw findError;
    }

    const user = users && users.length > 0 ? users[0] : null;

    console.log(`👤 Usuario encontrado: ${user ? 'SÍ' : 'NO'}`);

    // Verificar si el usuario existe
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si la cuenta está activa
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'La cuenta está desactivada. Por favor, contacte al administrador.'
      });
    }

    // Verificar contraseña
    console.log(`🔐 Verificando contraseña...`);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`✅ Contraseña válida: ${isMatch}`);
    
    if (!isMatch) {
      console.log(`❌ Contraseña incorrecta para usuario: ${user.username}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Omitir la contraseña en la respuesta
    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener información del usuario actual
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    // Obtener información del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email, is_active, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener productos recientes del usuario (si los hay)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, code, stock')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    // Obtener movimientos recientes
    const { data: movements } = await supabase
      .from('stock_movements')
      .select(`
        id, 
        type, 
        quantity, 
        movement_date,
        products!inner(id, name, code)
      `)
      .order('movement_date', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        ...user,
        products: products || [],
        movements: movements || []
      }
    });
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};