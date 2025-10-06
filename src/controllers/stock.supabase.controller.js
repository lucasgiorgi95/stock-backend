const supabase = require('../config/supabase');

/**
 * @desc    Ajustar el stock de un producto
 * @route   POST /api/v1/stock/adjust
 * @access  Private
 */
const adjustStock = async (req, res) => {
  try {
    const { productId, quantity, reason, notes } = req.body;
    const userId = req.user.id;

    // Validar campos requeridos
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del producto es requerido'
      });
    }

    if (quantity === undefined || isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad es requerida y debe ser un número'
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El motivo del ajuste es requerido'
      });
    }

    // Verificar que el producto exista
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
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
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert([{
        product_id: productId,
        user_id: userId,
        type,
        quantity: quantityAdjusted,
        reason: `Ajuste de inventario: ${reason}`,
        notes: notes ? notes.trim() : null,
        movement_date: new Date().toISOString(),
        is_adjustment: true
      }]);

    if (movementError) {
      throw movementError;
    }

    // Actualizar el stock del producto
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (updateError) {
      throw updateError;
    }

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
    const { count: totalProducts, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) {
      throw countError;
    }

    console.log('📊 Total productos:', totalProducts);

    // Obtener todos los productos para calcular stock bajo
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, code, stock, min_stock')
      .eq('is_active', true);

    if (productsError) {
      throw productsError;
    }

    const lowStockProducts = allProducts.filter(product => product.stock <= product.min_stock);
    const outOfStockProducts = allProducts.filter(product => product.stock === 0);
    
    console.log('📊 Productos con stock bajo:', lowStockProducts.length);
    console.log('📊 Productos sin stock:', outOfStockProducts.length);

    // Obtener movimientos recientes
    const { data: recentMovements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('id, type, quantity, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (movementsError) {
      throw movementsError;
    }

    console.log('📊 Movimientos recientes:', recentMovements.length);

    const response = {
      total_products: totalProducts || 0,
      low_stock_count: lowStockProducts.length,
      out_of_stock_count: outOfStockProducts.length,
      recent_movements: recentMovements || []
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