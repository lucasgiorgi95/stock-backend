const { Marca } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Obtener todas las marcas
 * @route   GET /api/v1/marcas
 * @access  Private
 */
const getMarcas = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {
      userId: req.user.id,
      ...(search && {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}%` } },
          { descripcion: { [Op.iLike]: `%${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}%` } }
        ]
      })
    };

    const { count, rows: marcas } = await Marca.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: marcas,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las marcas',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener una marca por ID
 * @route   GET /api/v1/marcas/:id
 * @access  Private
 */
const getMarcaById = async (req, res) => {
  try {
    const { id } = req.params;
    const marca = await Marca.findOne({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!marca) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    res.json({
      success: true,
      data: marca
    });
  } catch (error) {
    console.error('Error al obtener la marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la marca',
      error: error.message
    });
  }
};

/**
 * @desc    Crear una nueva marca
 * @route   POST /api/v1/marcas
 * @access  Private
 */
const createMarca = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    
    // Validar que el nombre no esté vacío
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la marca es requerido'
      });
    }

    // Verificar si ya existe una marca con el mismo nombre para este usuario
    const marcaExistente = await Marca.findOne({
      where: { 
        nombre: { [Op.iLike]: nombre },
        userId: req.user.id 
      }
    });

    if (marcaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una marca con este nombre'
      });
    }

    const nuevaMarca = await Marca.create({
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : null,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Marca creada exitosamente',
      data: nuevaMarca
    });
  } catch (error) {
    console.error('Error al crear la marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la marca',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar una marca
 * @route   PUT /api/v1/marcas/:id
 * @access  Private
 */
const updateMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activa } = req.body;

    // Buscar la marca
    const marca = await Marca.findOne({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!marca) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    // Verificar si el nuevo nombre ya existe (si se está actualizando el nombre)
    if (nombre && nombre !== marca.nombre) {
      const nombreExistente = await Marca.findOne({
        where: { 
          nombre: { [Op.iLike]: nombre },
          userId: req.user.id,
          id: { [Op.ne]: id } // Excluir la marca actual de la búsqueda
        }
      });

      if (nombreExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra marca con este nombre'
        });
      }
    }

    // Actualizar la marca
    const datosActualizados = {};
    if (nombre !== undefined) datosActualizados.nombre = nombre.trim();
    if (descripcion !== undefined) datosActualizados.descripcion = descripcion ? descripcion.trim() : null;
    if (activa !== undefined) datosActualizados.activa = activa;

    await marca.update(datosActualizados);

    res.json({
      success: true,
      message: 'Marca actualizada exitosamente',
      data: marca
    });
  } catch (error) {
    console.error('Error al actualizar la marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la marca',
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar una marca
 * @route   DELETE /api/v1/marcas/:id
 * @access  Private
 */
const deleteMarca = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar la marca
    const marca = await Marca.findOne({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!marca) {
      return res.status(404).json({
        success: false,
        message: 'Marca no encontrada'
      });
    }

    // Verificar si la marca tiene productos asociados
    const productosCount = await marca.countProducts();
    
    if (productosCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la marca porque tiene productos asociados',
        data: { productosAsociados: productosCount }
      });
    }

    // Eliminar la marca
    await marca.destroy();

    res.json({
      success: true,
      message: 'Marca eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar la marca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la marca',
      error: error.message
    });
  }
};

module.exports = {
  getMarcas,
  getMarcaById,
  createMarca,
  updateMarca,
  deleteMarca
};
