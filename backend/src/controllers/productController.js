// ============================================
// PRODUCTCONTROLLER.JS - PRODUCT/SERVICE MANAGEMENT
// ============================================
const Product = require('../models/Product');
const Category = require('../models/Category');
const { formatSuccess, formatError, formatPaginated } = require('../utils/response');

/**
 * Get All Products - GET /products
 * Get all services/products with pagination and filters
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, sortBy = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    // ===== BUILD FILTER =====
    const filter = {};
    if (category) filter.categoryId = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // ===== FETCH DATA =====
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortBy);

    const total = await Product.countDocuments(filter);

    res.status(200).json(
      formatPaginated(products, page, limit, total)
    );
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json(
      formatError('Failed to fetch products: ' + error.message)
    );
  }
};

/**
 * Get Product by ID - GET /products/:id
 * Get single product details
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('categoryId', 'name');
    if (!product) {
      return res.status(404).json(
        formatError('Product not found')
      );
    }

    res.status(200).json(
      formatSuccess(product, 'Product retrieved successfully')
    );
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json(
      formatError('Failed to fetch product: ' + error.message)
    );
  }
};

/**
 * Create Product - POST /products
 * Admin only - create new service/product
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, duration, categoryId, thumbnail, images } = req.body;

    // ===== VALIDATION =====
    if (!name || !price || !duration || !categoryId) {
      return res.status(400).json(
        formatError('Missing required fields: name, price, duration, categoryId')
      );
    }

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json(
        formatError('Category not found')
      );
    }

    // ===== HANDLE UPLOADED FILE =====
    let thumbnailPath = thumbnail || null;
    if (req.file) {
      thumbnailPath = `/uploads/${req.file.filename}`;
    }

    // ===== CREATE PRODUCT =====
    const newProduct = new Product({
      name: name.trim(),
      description: description || '',
      price: parseFloat(price),
      duration: parseInt(duration),
      categoryId,
      thumbnail: thumbnailPath,
      images: images || []
    });

    await newProduct.save();
    await newProduct.populate('categoryId', 'name');

    res.status(201).json(
      formatSuccess(newProduct, 'Product created successfully')
    );
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json(
      formatError('Failed to create product: ' + error.message)
    );
  }
};

/**
 * Update Product - PUT /products/:id
 * Admin only - update product details
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, categoryId, images } = req.body;

    // ===== VALIDATION =====
    if (!name && !price && !duration && !categoryId && !description && !thumbnail && !images) {
      return res.status(400).json(
        formatError('No fields to update')
      );
    }

    // ===== BUILD UPDATE OBJECT =====
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (duration) updateData.duration = parseInt(duration);
    if (categoryId) updateData.categoryId = categoryId;
    if (images) updateData.images = images;

    // ===== HANDLE UPLOADED FILE =====
    if (req.file) {
      updateData.thumbnail = `/uploads/${req.file.filename}`;
    } else if (thumbnail) {
      updateData.thumbnail = thumbnail;
    }

    // ===== UPDATE PRODUCT =====
    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name');

    if (!product) {
      return res.status(404).json(
        formatError('Product not found')
      );
    }

    res.status(200).json(
      formatSuccess(product, 'Product updated successfully')
    );
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json(
      formatError('Failed to update product: ' + error.message)
    );
  }
};

/**
 * Delete Product - DELETE /products/:id
 * Admin only
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json(
        formatError('Product not found')
      );
    }

    res.status(200).json(
      formatSuccess(null, 'Product deleted successfully')
    );
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json(
      formatError('Failed to delete product: ' + error.message)
    );
  }
};

/**
 * Get Products by Category - GET /products/category/:categoryId
 * Get all products in a specific category
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const products = await Product.find({ categoryId })
      .populate('categoryId', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Product.countDocuments({ categoryId });

    res.status(200).json(
      formatPaginated(products, page, limit, total)
    );
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json(
      formatError('Failed to fetch products: ' + error.message)
    );
  }
};
