const { Product, StockMovement } = require('../models');
const sequelize = require('sequelize');

/**
 * @desc    Ajustar el stock de un producto
 * @route   POST /api/v1/stock/adjust
 * @access  Private
 */
const adjustStock = async (req, res) => {
  const transaction = await Product.sequelize.transaction();
  
  try {
    const { productId, quantity, reason, notes } = req.body;
    const userId = req.user.id;

    // Validar campos requeridos
    if (!productId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El ID del producto es requerido'
      });
    }

    if (quantity === undefined || isNaN(quantity)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'La cantidad es requerida y debe ser un número'
      });
    }

    if (!reason || reason.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El motivo del ajuste es requerido'
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

    // Calcular el nuevo stock (asegurándonos de que no sea negativo)
    const newStock = Math.max(0, parseFloat(quantity));
    const difference = newStock - product.stock;

    // Si no hay cambio, retornar sin hacer nada
    if (difference === 0) {
      await transaction.rollback();
      return res.status(200).json({
        success: true,
        message: 'No se realizaron cambios en el stock',
        data: {
          stockAnterior: product.stock,
          stockNuevo: newStock,
          diferencia: 0
        }
      });
    }

    // Determinar el tipo de movimiento
    const type = difference > 0 ? 'entrada' : 'salida';
    const quantityAdjusted = Math.abs(difference);

    // Crear el movimiento de ajuste
    await StockMovement.create({
      productId,
      type,
      quantity: quantityAdjusted,
      reason: `Ajuste de inventario: ${reason}`,
      notes: notes ? notes.trim() : null,
      userId,
      movement_date: new Date(),
      isAdjustment: true
    }, { transaction });

    // Actualizar el stock del producto
    await product.update({ stock: newStock }, { transaction });

    // Confirmar la transacción
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Stock ajustado exitosamente',
      data: {
        producto: product.name,
        stockAnterior: product.stock,
        stockNuevo: newStock,
        diferencia: difference,
        tipoAjuste: type
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al ajustar el stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ajustar el stock',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener datos para el dashboard de stock
 * @route   GET /api/v1/stock/dashboard
 * @access  Private
 */
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Obteniendo datos del dashboard para usuario:', userId);

    // Obtener total de productos
    const totalProducts = await Product.count({
      where: { userId }
    });
    console.log('📊 Total productos:', totalProducts);

    // Obtener productos con stock bajo (consulta simplificada)
    const allProducts = await Product.findAll({
      where: { userId },
      attributes: ['id', 'name', 'code', 'stock', 'min_stock']
    });

    const lowStockProducts = allProducts.filter(product => product.stock <= product.min_stock);
    const outOfStockProducts = allProducts.filter(product => product.stock === 0);
    
    console.log('📊 Productos con stock bajo:', lowStockProducts.length);
    console.log('📊 Productos sin stock:', outOfStockProducts.length);

    // Obtener movimientos recientes (simplificado)
    const recentMovements = await StockMovement.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'type', 'quantity', 'reason', 'createdAt']
    });

    console.log('📊 Movimientos recientes:', recentMovements.length);

    const response = {
      total_products: totalProducts,
      low_stock_count: lowStockProducts.length,
      out_of_stock_count: outOfStockProducts.length,
      recent_movements: recentMovements
    };

    console.log('✅ Dashboard data preparado');

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('❌ Error al obtener datos del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los datos del dashboard',
      error: error.message
    });
  }
};

module.exports = {
  adjustStock,
  getDashboardData
};
