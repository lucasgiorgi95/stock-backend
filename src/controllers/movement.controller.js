const { StockMovement, Product } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Crear un nuevo movimiento de stock
 * @route   POST /api/v1/movements
 * @access  Private
 */
const createMovement = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { productId, type, quantity, reason, reference, notes } = req.body;
    const userId = req.user.id;

    // Validar campos requeridos
    if (!productId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El ID del producto es requerido'
      });
    }

    if (!['entrada', 'salida'].includes(type)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El tipo de movimiento debe ser "entrada" o "salida"'
      });
    }

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser un número mayor a cero'
      });
    }

    if (!reason || reason.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El motivo del movimiento es requerido'
      });
    }

    // Verificar que el producto exista y pertenezca al usuario
    const product = await Product.findOne({
      where: { 
        id: productId,
        userId 
      },
      transaction
    });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar stock suficiente para salidas
    if (type === 'salida' && product.stock < quantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente para realizar la salida',
        data: {
          stockDisponible: product.stock,
          cantidadSolicitada: quantity
        }
      });
    }

    // Crear el movimiento
    const movement = await StockMovement.create({
      productId,
      type,
      quantity: parseFloat(quantity),
      reason: reason.trim(),
      reference: reference ? reference.trim() : null,
      notes: notes ? notes.trim() : null,
      userId,
      movement_date: new Date()
    }, { transaction });

    // Actualizar el stock del producto
    const newStock = type === 'entrada' 
      ? product.stock + parseFloat(quantity)
      : product.stock - parseFloat(quantity);

    await product.update({ stock: newStock }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Movimiento registrado exitosamente',
      data: {
        movement,
        stockActual: newStock
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear el movimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el movimiento',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener historial de movimientos de un producto
 * @route   GET /api/v1/movements/:productId
 * @access  Private
 */
const getMovementsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, startDate, endDate, type } = req.query;
    const offset = (page - 1) * limit;

    // Verificar que el producto exista y pertenezca al usuario
    const product = await Product.findOne({
      where: { 
        id: productId,
        userId: req.user.id 
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Construir condiciones de búsqueda
    const whereClause = {
      productId,
      userId: req.user.id
    };

    // Filtrar por tipo de movimiento si se especifica
    if (type && ['entrada', 'salida'].includes(type)) {
      whereClause.type = type;
    }

    // Filtrar por rango de fechas si se especifica
    if (startDate || endDate) {
      whereClause.movement_date = {};
      
      if (startDate) {
        whereClause.movement_date[Op.gte] = new Date(startDate);
      }
      
      if (endDate) {
        // Añadir un día completo al final para incluir todo el día de la fecha final
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        whereClause.movement_date[Op.lt] = end;
      }
    }

    // Obtener movimientos con paginación
    const { count, rows: movements } = await StockMovement.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['movement_date', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    // Obtener información resumida
    const summary = await StockMovement.findAll({
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
      ],
      where: { productId },
      group: ['type']
    });

    const entrada = summary.find(s => s.type === 'entrada')?.dataValues.totalQuantity || 0;
    const salida = summary.find(s => s.type === 'salida')?.dataValues.totalQuantity || 0;
    const saldo = entrada - salida;

    res.json({
      success: true,
      data: movements,
      summary: {
        entrada: parseFloat(entrada),
        salida: parseFloat(salida),
        saldo
      },
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener el historial de movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de movimientos',
      error: error.message
    });
  }
};

module.exports = {
  createMovement,
  getMovementsByProduct
};
