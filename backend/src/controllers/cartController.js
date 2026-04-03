// ============================================
// CARTCONTROLLER.JS - SHOPPING CART
// ============================================
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { formatSuccess, formatError } = require('../utils/response');

/**
 * Get My Cart - GET /carts/me
 * Get logged-in user's shopping cart
 */
exports.getMyCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    let cart = await Cart.findOne({ userId })
      .populate('items.productId', 'name price image');

    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    res.status(200).json(
      formatSuccess(cart, 'Cart retrieved successfully')
    );
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json(
      formatError('Failed to fetch cart: ' + error.message)
    );
  }
};

/**
 * Add to Cart - POST /carts/items
 * Add product to shopping cart
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

    // ===== VALIDATION =====
    if (!productId || quantity < 1) {
      return res.status(400).json(
        formatError('Invalid productId or quantity')
      );
    }

    // ===== VALIDATE PRODUCT =====
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json(
        formatError('Product not found')
      );
    }

    // ===== GET OR CREATE CART =====
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // ===== CHECK IF ITEM ALREADY IN CART =====
    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );

    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();
    await cart.populate('items.productId', 'name price image');

    res.status(200).json(
      formatSuccess(cart, 'Item added to cart')
    );
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json(
      formatError('Failed to add item to cart: ' + error.message)
    );
  }
};

/**
 * Update Cart Item - PUT /carts/items/:itemId
 * Update quantity of item in cart
 */
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    // ===== VALIDATION =====
    if (!quantity || quantity < 1) {
      return res.status(400).json(
        formatError('Quantity must be at least 1')
      );
    }

    // ===== FIND CART =====
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json(
        formatError('Cart not found')
      );
    }

    // ===== FIND ITEM IN CART =====
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return res.status(404).json(
        formatError('Item not found in cart')
      );
    }

    // ===== UPDATE QUANTITY =====
    cartItem.quantity = quantity;
    await cart.save();
    await cart.populate('items.productId', 'name price image');

    res.status(200).json(
      formatSuccess(cart, 'Cart item updated')
    );
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json(
      formatError('Failed to update cart: ' + error.message)
    );
  }
};

/**
 * Remove from Cart - DELETE /carts/items/:itemId
 * Remove item from shopping cart
 */
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;

    // ===== FIND CART =====
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json(
        formatError('Cart not found')
      );
    }

    // ===== FIND AND REMOVE ITEM =====
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return res.status(404).json(
        formatError('Item not found in cart')
      );
    }

    cartItem.deleteOne();
    await cart.save();
    await cart.populate('items.productId', 'name price image');

    res.status(200).json(
      formatSuccess(cart, 'Item removed from cart')
    );
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json(
      formatError('Failed to remove item from cart: ' + error.message)
    );
  }
};

/**
 * Clear Cart - DELETE /carts
 * Clear all items from shopping cart
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items: [] },
      { new: true }
    ).populate('items.productId', 'name price image');

    res.status(200).json(
      formatSuccess(cart, 'Cart cleared successfully')
    );
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json(
      formatError('Failed to clear cart: ' + error.message)
    );
  }
};

/**
 * Get Cart Total - GET /carts/total
 * Calculate total amount in cart
 */
exports.getCartTotal = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ userId })
      .populate('items.productId', 'price');

    if (!cart || cart.items.length === 0) {
      return res.status(200).json(
        formatSuccess(
          { itemCount: 0, totalAmount: 0 },
          'Cart is empty'
        )
      );
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    res.status(200).json(
      formatSuccess(
        {
          itemCount: cart.items.length,
          items: cart.items.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
          })),
          totalAmount
        },
        'Cart total calculated'
      )
    );
  } catch (error) {
    console.error('Get cart total error:', error);
    res.status(500).json(
      formatError('Failed to calculate cart total: ' + error.message)
    );
  }
};
