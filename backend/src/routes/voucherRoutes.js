const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

/**
 * Public routes
 */
router.post('/validate', voucherController.validateVoucher);

/**
 * Admin routes - Protect all
 */
router.use(authenticateToken);
router.use(authorizeRole(['admin', 'barber'])); // Barber might need to manage their own vouchers too?

router.route('/')
  .post(voucherController.createVoucher)
  .get(voucherController.getAllVouchers);

router.route('/:id')
  .get(voucherController.getVoucherById)
  .put(voucherController.updateVoucher)
  .delete(voucherController.deleteVoucher);

module.exports = router;
