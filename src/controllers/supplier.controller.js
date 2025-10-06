const { Supplier } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Obtener todos los proveedores
 * @route   GET /api/v1/suppliers
 * @access  Private
 */
const getSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      userId: req.user.id,
      ...(search && {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { contact: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ]
      })
    };

    const { count, rows: suppliers } = await Supplier.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los proveedores',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener un proveedor por ID
 * @route   GET /api/v1/suppliers/:id
 * @access  Private
 */
const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findOne({
      where: { 
        id,
        userId: req.user.id 
      },
      include: ['products']
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error al obtener el proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el proveedor',
      error: error.message
    });
  }
};

/**
 * @desc    Crear un nuevo proveedor
 * @route   POST /api/v1/suppliers
 * @access  Private
 */
const createSupplier = async (req, res) => {
  try {
    const { name, contact, phone, email, address } = req.body;
    
    // Validar campos requeridos
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del proveedor es requerido'
      });
    }

    // Verificar si ya existe un proveedor con el mismo nombre para este usuario
    const supplierExistente = await Supplier.findOne({
      where: { 
        name: { [Op.iLike]: name },
        userId: req.user.id 
      }
    });

    if (supplierExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proveedor con este nombre'
      });
    }

    const nuevoProveedor = await Supplier.create({
      name: name.trim(),
      contact: contact ? contact.trim() : null,
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: nuevoProveedor
    });
  } catch (error) {
    console.error('Error al crear el proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el proveedor',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un proveedor
 * @route   PUT /api/v1/suppliers/:id
 * @access  Private
 */
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, phone, email, address, isActive } = req.body;

    // Buscar el proveedor
    const supplier = await Supplier.findOne({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar si el nuevo nombre ya existe (si se está actualizando el nombre)
    if (name && name !== supplier.name) {
      const nombreExistente = await Supplier.findOne({
        where: { 
          name: { [Op.iLike]: name },
          userId: req.user.id,
          id: { [Op.ne]: id }
        }
      });

      if (nombreExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro proveedor con este nombre'
        });
      }
    }

    // Actualizar el proveedor
    const datosActualizados = {};
    if (name !== undefined) datosActualizados.name = name.trim();
    if (contact !== undefined) datosActualizados.contact = contact ? contact.trim() : null;
    if (phone !== undefined) datosActualizados.phone = phone ? phone.trim() : null;
    if (email !== undefined) datosActualizados.email = email ? email.trim() : null;
    if (address !== undefined) datosActualizados.address = address ? address.trim() : null;
    if (isActive !== undefined) datosActualizados.isActive = isActive;

    await supplier.update(datosActualizados);

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: supplier
    });
  } catch (error) {
    console.error('Error al actualizar el proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el proveedor',
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar un proveedor
 * @route   DELETE /api/v1/suppliers/:id
 * @access  Private
 */
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el proveedor
    const supplier = await Supplier.findOne({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar si el proveedor tiene productos asociados
    const productosCount = await supplier.countProducts();
    
    if (productosCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el proveedor porque tiene productos asociados',
        data: { productosAsociados: productosCount }
      });
    }

    // Eliminar el proveedor
    await supplier.destroy();

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar el proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el proveedor',
      error: error.message
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
