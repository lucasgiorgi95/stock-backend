const supabase = require('../config/supabase');

/**
 * @desc    Obtener todos los productos
 * @route   GET /api/v1/products
 * @access  Private
 */
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(offset, offset + parseInt(limit) - 1)
      .order(sortBy, { ascending: sortOrder.toLowerCase() === 'asc' });

    // Agregar búsqueda si existe
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: products, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: products,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los productos',
      error: error.message
    });
  }
};

/**
 * @desc    Buscar producto por código
 * @route   GET /api/v1/products/search?code=XXX
 * @access  Private
 */
const searchProductByCode = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'El código de búsqueda es requerido'
      });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .ilike('code', `%${code}%`)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      throw error;
    }

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    console.error('Error al buscar producto por código:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar el producto',
      error: error.message
    });
  }
};/**

 * @desc    Obtener un producto por ID
 * @route   GET /api/v1/products/:id
 * @access  Private
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el producto',
      error: error.message
    });
  }
};

/**
 * @desc    Crear un nuevo producto
 * @route   POST /api/v1/products
 * @access  Private
 */
const createProduct = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      stock = 0,
      min_stock = 5,
      price = 0,
      image_url
    } = req.body;

    // Validar campos requeridos
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'El código y el nombre son campos requeridos'
      });
    }

    // Verificar si ya existe un producto con el mismo código
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('code', code.trim())
      .single();

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con este código'
      });
    }

    // Crear el producto
    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        code: code.trim(),
        name: name.trim(),
        description: description ? description.trim() : null,
        stock: parseInt(stock) || 0,
        min_stock: parseInt(min_stock) || 5,
        price: parseFloat(price) || 0,
        image_url: image_url ? image_url.trim() : null,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Si hay stock inicial, crear un movimiento de entrada
    if (stock > 0) {
      await supabase
        .from('stock_movements')
        .insert([{
          product_id: product.id,
          user_id: req.user?.id || 1,
          type: 'entrada',
          quantity: parseInt(stock),
          reason: 'Stock inicial',
          movement_date: new Date().toISOString()
        }]);
    }

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: product
    });
  } catch (error) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el producto',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un producto existente
 * @route   PUT /api/v1/products/:id
 * @access  Private
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      description,
      stock,
      min_stock,
      price,
      image_url
    } = req.body;

    // Buscar el producto actual
    const { data: currentProduct, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar si se está actualizando el código
    if (code && code !== currentProduct.code) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('code', code.trim())
        .neq('id', id)
        .single();

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro producto con este código'
        });
      }
    }

    // Preparar datos de actualización
    const updateData = {};
    if (code !== undefined) updateData.code = code.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (min_stock !== undefined) updateData.min_stock = parseInt(min_stock) || 0;
    if (price !== undefined) updateData.price = parseFloat(price) || 0;
    if (image_url !== undefined) updateData.image_url = image_url ? image_url.trim() : null;

    // Si se actualiza el stock, crear un movimiento de ajuste
    if (stock !== undefined && stock !== currentProduct.stock) {
      const newStock = parseInt(stock) || 0;
      const difference = newStock - currentProduct.stock;
      
      if (difference !== 0) {
        await supabase
          .from('stock_movements')
          .insert([{
            product_id: parseInt(id),
            user_id: req.user?.id || 1,
            type: difference > 0 ? 'entrada' : 'salida',
            quantity: Math.abs(difference),
            reason: 'Ajuste de inventario',
            movement_date: new Date().toISOString(),
            is_adjustment: true
          }]);
      }
      
      updateData.stock = newStock;
    }

    // Actualizar el producto
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el producto',
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar un producto
 * @route   DELETE /api/v1/products/:id
 * @access  Private
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el producto tiene movimientos
    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (movementsError) {
      throw movementsError;
    }

    if (movements && movements.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el producto porque tiene movimientos asociados'
      });
    }

    // Marcar como inactivo en lugar de eliminar
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el producto',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener productos con stock bajo
 * @route   GET /api/v1/products/low-stock
 * @access  Private
 */
const getLowStockProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Obtener productos donde stock <= min_stock
    const { data: products, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .filter('stock', 'lte', 'min_stock')
      .range(offset, offset + parseInt(limit) - 1)
      .order('stock', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: products,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos con stock bajo',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  searchProductByCode,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
};