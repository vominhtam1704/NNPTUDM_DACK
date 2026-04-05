// ============================================
// CLEAR-DB.JS - XÓA TOÀN BỘ DỮ LIỆU DATABASE
// ============================================
require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./src/models/Role');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Reservation = require('./src/models/Reservation');
const Review = require('./src/models/Review');
const Payment = require('./src/models/Payment');
const Inventory = require('./src/models/Inventory');
const Voucher = require('./src/models/Voucher');
const Message = require('./src/models/Message');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/barber_atelier';

    if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD && !uri.includes('@')) {
      const user = encodeURIComponent(process.env.MONGODB_USER);
      const pass = encodeURIComponent(process.env.MONGODB_PASSWORD);
      uri = uri.replace('mongodb://', `mongodb://${user}:${pass}@`);
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[INFO] MongoDB connected');
  } catch (error) {
    console.error('[ERROR] MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const clearDB = async () => {
  try {
    await connectDB();

    console.log('[INFO] Xóa toàn bộ dữ liệu...\n');

    await Message.deleteMany({});
    console.log('[SUCCESS] ✓ Xóa Message');

    await Review.deleteMany({});
    console.log('[SUCCESS] ✓ Xóa Review');

    await Payment.deleteMany({});
    console.log('[SUCCESS] ✓ Xóa Payment');

    await Reservation.deleteMany({});
    console.log('[SUCCESS] ✓ Xóa Reservation');

    await Product.deleteMany({});
    console.log('[SUCCESS] ✓ Xóa Product');

    await Category.deleteMany({});
    console.log('[SUCCESS] ✓ Xóa Category');

    await Voucher.deleteMany({});
    console.log('[SUCCESS] ✓ Xóa Voucher');

    await Inventory.deleteMany({});
    console.log('[SUCCESS] ✓ Xóa Inventory');

    await User.deleteMany({});
    console.log('[SUCCESS] ✓ Xóa User');

    await Role.deleteMany({});
    console.log('[SUCCESS] ✓ Xóa Role');

    console.log('\n[SUCCESS] ✅ XÓA THÀNH CÔNG TẤT CẢ DỮ LIỆU!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Xóa dữ liệu thất bại:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

clearDB();
