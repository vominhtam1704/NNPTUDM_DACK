const mongoose = require('mongoose');
require('dotenv').config();
const Voucher = require('./src/models/Voucher');

async function checkAndFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barber_atelier');
    console.log('Connected to MongoDB');

    // Create a new voucher
    const newVoucher = await Voucher.findOneAndUpdate(
      { code: 'NEWYEAR2024' },
      {
        code: 'NEWYEAR2024',
        discountType: 'percentage',
        discountValue: 30,
        minPurchaseAmount: 100000,
        usageLimit: 100,
        usedCount: 0,
        startDate: new Date(),
        expiryDate: new Date('2026-12-31'),
        isActive: true,
        description: 'Happy New Year 2024'
      },
      { upsert: true, new: true }
    );
    console.log('Created/Updated voucher:', newVoucher.code);

    const vouchers = await Voucher.find();
    console.log('--- Current Vouchers ---');
    vouchers.forEach(v => {
      console.log(`${v.code}: Active=${v.isActive}, Start=${v.startDate}, End=${v.expiryDate}, Usage=${v.usageCount}/${v.usageLimit}`);
    });
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkAndFix();
