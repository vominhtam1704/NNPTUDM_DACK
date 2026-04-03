// ============================================
// CATEGORYCONTROLLER.JS - CATEGORY MANAGEMENT
// ============================================
const Category = require('../models/Category');
const { formatSuccess, formatError, formatPaginated } = require('../utils/response');

/**
 * Get All Categories - GET /categories
 * Get all service categories with optional nesting
 */
exports.getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, parentId, search } = req.query;
    const skip = (page - 1) * limit;

    // ===== BUILD FILTER =====
    const filter = {};
    if (parentId) {
      filter.parentId = parentId;
    } else {
      filter.parentId = null; // Only root categories
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // ===== FETCH DATA =====
    const categories = await Category.find(filter)
      .populate('parentId', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Category.countDocuments(filter);

    res.status(200).json(
      formatPaginated(categories, page, limit, total)
    );
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json(
      formatError('Failed to fetch categories: ' + error.message)
    );
  }
};

/**
 * Get Category by ID - GET /categories/:id
 * Get single category with subcategories
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate('parentId', 'name');

    if (!category) {
      return res.status(404).json(
        formatError('Category not found')
      );
    }

    res.status(200).json(
      formatSuccess(category, 'Category retrieved successfully')
    );
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json(
      formatError('Failed to fetch category: ' + error.message)
    );
  }
};

/**
 * Create Category - POST /categories
 * Admin only - create new service category
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description, parentId, slug, image } = req.body;

    // ===== VALIDATION =====
    if (!name) {
      return res.status(400).json(
        formatError('Category name is required')
      );
    }

    // Generate slug if not provided
    let categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-');

    // Check if slug already exists
    const existingSlug = await Category.findOne({ slug: categorySlug });
    if (existingSlug) {
      return res.status(409).json(
        formatError('Slug already exists')
      );
    }

    // Validate parent category exists if provided
    if (parentId) {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return res.status(404).json(
          formatError('Parent category not found')
        );
      }
    }

    // ===== CREATE CATEGORY =====
    const newCategory = new Category({
      name: name.trim(),
      slug: categorySlug,
      description: description || '',
      parentId: parentId || null,
      image: image || null
    });

    await newCategory.save();
    await newCategory.populate('parentId', 'name');

    res.status(201).json(
      formatSuccess(newCategory, 'Category created successfully')
    );
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json(
      formatError('Failed to create category: ' + error.message)
    );
  }
};

/**
 * Update Category - PUT /categories/:id
 * Admin only
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, image } = req.body;

    // ===== VALIDATION =====
    if (!name && !description && !parentId && !image) {
      return res.status(400).json(
        formatError('No fields to update')
      );
    }

    // ===== BUILD UPDATE OBJECT =====
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (parentId) updateData.parentId = parentId;
    if (image) updateData.image = image;

    // ===== UPDATE CATEGORY =====
    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentId', 'name');

    if (!category) {
      return res.status(404).json(
        formatError('Category not found')
      );
    }

    res.status(200).json(
      formatSuccess(category, 'Category updated successfully')
    );
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json(
      formatError('Failed to update category: ' + error.message)
    );
  }
};

/**
 * Delete Category - DELETE /categories/:id
 * Admin only - cannot delete if has products or subcategories
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has subcategories
    const subcategories = await Category.countDocuments({ parentId: id });
    if (subcategories > 0) {
      return res.status(400).json(
        formatError('Cannot delete category with subcategories')
      );
    }

    // Check if category has products
    const Product = require('../models/Product');
    const products = await Product.countDocuments({ categoryId: id });
    if (products > 0) {
      return res.status(400).json(
        formatError('Cannot delete category with products')
      );
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json(
        formatError('Category not found')
      );
    }

    res.status(200).json(
      formatSuccess(null, 'Category deleted successfully')
    );
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json(
      formatError('Failed to delete category: ' + error.message)
    );
  }
};

/**
 * Get Category Hierarchy - GET /categories/tree/all
 * Get all categories organized in tree structure
 */
exports.getCategoryTree = async (req, res) => {
  try {
    // Get all root categories
    const rootCategories = await Category.find({ parentId: null })
      .sort({ name: 1 });

    // Recursively build tree
    const buildTree = async (parent) => {
      const children = await Category.find({ parentId: parent._id })
        .sort({ name: 1 });
      
      return {
        ...parent.toObject(),
        children: await Promise.all(children.map(buildTree))
      };
    };

    const tree = await Promise.all(rootCategories.map(buildTree));

    res.status(200).json(
      formatSuccess(tree, 'Category tree retrieved successfully')
    );
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json(
      formatError('Failed to fetch category tree: ' + error.message)
    );
  }
};
