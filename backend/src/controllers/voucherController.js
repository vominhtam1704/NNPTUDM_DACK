const Voucher = require('../models/Voucher');
const { formatSuccess, formatError } = require('../utils/response');

/**
 * Create Voucher - POST /vouchers
 * Admin only
 */
exports.createVoucher = async (req, res) => {
  try {
    const voucherData = req.body;
    
    // Check if code already exists
    const existing = await Voucher.findOne({ code: voucherData.code?.toUpperCase() });
    if (existing) {
      return res.status(400).json(formatError('Voucher code already exists'));
    }

    const voucher = new Voucher(voucherData);
    await voucher.save();
    
    res.status(201).json(formatSuccess(voucher, 'Voucher created successfully'));
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(400).json(formatError('Failed to create voucher: ' + error.message));
  }
};

/**
 * Get All Vouchers - GET /vouchers
 * List all vouchers with filters
 */
exports.getAllVouchers = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = {};
    
    if (activeOnly === 'true') {
      const now = new Date();
      filter.isActive = true;
      filter.startDate = { $lte: now };
      filter.expiryDate = { $gte: now };
      filter.$expr = { $lt: ['$usageCount', '$usageLimit'] };
    }

    const vouchers = await Voucher.find(filter).sort({ createdAt: -1 });
    res.status(200).json(formatSuccess(vouchers, 'Vouchers retrieved successfully'));
  } catch (error) {
    console.error('Get all vouchers error:', error);
    res.status(500).json(formatError('Failed to fetch vouchers: ' + error.message));
  }
};

/**
 * Get Voucher By ID - GET /vouchers/:id
 */
exports.getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json(formatError('Voucher not found'));
    }
    res.status(200).json(formatSuccess(voucher, 'Voucher retrieved successfully'));
  } catch (error) {
    console.error('Get voucher by ID error:', error);
    res.status(500).json(formatError('Failed to fetch voucher: ' + error.message));
  }
};

/**
 * Update Voucher - PUT /vouchers/:id
 */
exports.updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!voucher) {
      return res.status(404).json(formatError('Voucher not found'));
    }
    
    res.status(200).json(formatSuccess(voucher, 'Voucher updated successfully'));
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(400).json(formatError('Failed to update voucher: ' + error.message));
  }
};

/**
 * Delete Voucher - DELETE /vouchers/:id
 */
exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json(formatError('Voucher not found'));
    }
    res.status(200).json(formatSuccess(null, 'Voucher deleted successfully'));
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json(formatError('Failed to delete voucher: ' + error.message));
  }
};

/**
 * Validate Voucher - POST /vouchers/validate
 * Public - for checkout validation
 */
exports.validateVoucher = async (req, res) => {
  try {
    const { code, amount } = req.body;
    
    if (!code) {
      return res.status(400).json(formatError('Voucher code is required'));
    }

    const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (!voucher) {
      return res.status(400).json(formatError('Mã giảm giá không hợp lệ hoặc đã hết hạn.'));
    }

    const now = new Date();
    if (now < voucher.startDate) {
      return res.status(400).json(formatError('Voucher is not yet available'));
    }

    if (now > voucher.expiryDate) {
      return res.status(400).json(formatError('Voucher has expired'));
    }

    if (voucher.usageCount >= voucher.usageLimit) {
      return res.status(400).json(formatError('Voucher limit has been reached'));
    }

    if (amount < voucher.minPurchase) {
      return res.status(400).json(formatError(`Minimum purchase amount of ${voucher.minPurchase} required`));
    }

    // Calculate discount
    let discount = 0;
    if (voucher.discountType === 'percentage') {
      discount = (amount * voucher.discountValue) / 100;
      if (voucher.maxDiscount > 0 && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount;
      }
    } else {
      discount = voucher.discountValue;
    }

    // Ensure discount doesn't exceed total amount
    discount = Math.min(discount, amount);

    res.status(200).json(formatSuccess({
      voucherId: voucher._id,
      code: voucher.code,
      discount: Math.round(discount),
      finalAmount: Math.round(amount - discount)
    }, 'Voucher is valid'));

  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json(formatError('Failed to validate voucher: ' + error.message));
  }
};
