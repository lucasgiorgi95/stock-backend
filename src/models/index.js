const User = require('./user.model');
const Product = require('./product.model');
const StockMovement = require('./stockMovement.model');
const Supplier = require('./supplier.model');
const Marca = require('./marca.model');

// Relaciones

// Usuario tiene muchos Productos
User.hasMany(Product, {
  foreignKey: 'userId',
  as: 'products'
});
Product.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Usuario tiene muchos Movimientos de Stock
User.hasMany(StockMovement, {
  foreignKey: 'userId',
  as: 'movements'
});
StockMovement.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Usuario tiene muchos Proveedores
User.hasMany(Supplier, {
  foreignKey: 'userId',
  as: 'suppliers'
});
Supplier.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Usuario tiene muchas Marcas
User.hasMany(Marca, {
  foreignKey: 'userId',
  as: 'marcas'
});
Marca.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Producto pertenece a un Proveedor
Product.belongsTo(Supplier, {
  foreignKey: 'supplierId',
  as: 'supplier'
});
Supplier.hasMany(Product, {
  foreignKey: 'supplierId',
  as: 'products'
});

// Producto pertenece a una Marca
Product.belongsTo(Marca, {
  foreignKey: 'marcaId',
  as: 'marca'
});
Marca.hasMany(Product, {
  foreignKey: 'marcaId',
  as: 'products'
});

// Producto tiene muchos Movimientos de Stock
Product.hasMany(StockMovement, {
  foreignKey: 'productId',
  as: 'stockMovements'
});
StockMovement.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

// Hooks para actualizar el stock automáticamente
StockMovement.afterCreate(async (movement) => {
  const product = await Product.findByPk(movement.productId);
  if (movement.type === 'entrada') {
    await product.increment('stock', { by: movement.quantity });
  } else {
    await product.decrement('stock', { by: movement.quantity });
  }
});

module.exports = {
  User,
  Product,
  StockMovement,
  Supplier,
  Marca
};
