// ============================================
// INVENTORYCONTROLLER.JS - INVENTORY MANAGEMENT
// ============================================
const Inventory = require('../models/Inventory');
const { formatSuccess, formatError, formatPaginated } = require('../utils/response');

/**
 * Get All Inventory - GET /inventory
 * Admin only
 */
exports.getAllInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, lowStock } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$minStock'] };
    }

    const inventory = await Inventory.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ quantity: 1 });

    const total = await Inventory.countDocuments(filter);

    res.status(200).json(
      formatPaginated(inventory, page, limit, total)
    );
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json(
      formatError('Failed to fetch inventory: ' + error.message)
    );
  }
};

/**
 * Get Inventory Item by ID - GET /inventory/:id
 */
exports.getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json(
        formatError('Inventory item not found')
      );
    }

    res.status(200).json(
      formatSuccess(inventory, 'Inventory item retrieved')
    );
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json(
      formatError('Failed to fetch inventory: ' + error.message)
    );
  }
};

/**
 * Create Inventory Item - POST /inventory
 */
exports.createInventoryItem = async (req, res) => {
  try {
    const { productName, sku, quantity, minStock, price, supplier } = req.body;

    if (!productName || !sku || quantity === undefined || minStock === undefined) {
      return res.status(400).json(
        formatError('Missing required fields')
      );
    }

    const existing = await Inventory.findOne({ sku });
    if (existing) {
      return res.status(409).json(
        formatError('SKU already exists')
      );
    }

    const inventory = new Inventory({
      productName,
      sku,
      quantity: parseInt(quantity),
      minStock: parseInt(minStock),
      price: parseFloat(price) || 0,
      supplier: supplier || ''
    });

    await inventory.save();

    res.status(201).json(
      formatSuccess(inventory, 'Inventory item created')
    );
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json(
      formatError('Failed to create inventory: ' + error.message)
    );
  }
};

/**
 * Update Inventory Item - PUT /inventory/:id
 */
exports.updateInventoryItem = async (req, res) => {
  try {
    const { productName, quantity, minStock, price, supplier } = req.body;

    const updateData = {};
    if (productName) updateData.productName = productName;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (minStock !== undefined) updateData.minStock = parseInt(minStock);
    if (price !== undefined) updateData.price = parseFloat(price);
    if (supplier) updateData.supplier = supplier;

    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!inventory) {
      return res.status(404).json(
        formatError('Inventory item not found')
      );
    }

    res.status(200).json(
      formatSuccess(inventory, 'Inventory item updated')
    );
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json(
      formatError('Failed to update inventory: ' + error.message)
    );
  }
};

/**
 * Delete Inventory Item - DELETE /inventory/:id
 */
exports.deleteInventoryItem = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json(
        formatError('Inventory item not found')
      );
    }

    res.status(200).json(
      formatSuccess(null, 'Inventory item deleted')
    );
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json(
      formatError('Failed to delete inventory: ' + error.message)
    );
  }
};

/**
 * Adjust Stock - PUT /inventory/:id/adjust-stock
 */
exports.adjustStock = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json(
        formatError('Quantity is required')
      );
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json(
        formatError('Inventory item not found')
      );
    }

    inventory.quantity += quantity;
    await inventory.save();

    res.status(200).json(
      formatSuccess(inventory, 'Stock adjusted successfully')
    );
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json(
      formatError('Failed to adjust stock: ' + error.message)
    );
  }
};
