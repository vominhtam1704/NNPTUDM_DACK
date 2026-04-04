// ============================================
// SEED.JS - INITIALIZE DEFAULT DATA
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
const { hashPassword } = require('./src/utils/password');
const { ROLES, APPOINTMENT_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require('./src/config/constants');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/barber_atelier';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[INFO] MongoDB connected for seeding');
  } catch (error) {
    console.error('[ERROR] MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedRoles = async () => {
  try {
    const existingRoles = await Role.countDocuments();
    if (existingRoles > 0) {
      console.log('[SKIP] Roles already exist - skipping');
      return;
    }

    const defaultRoles = [
      {
        name: 'admin',
        description: 'Administrator with full access',
        permissions: ['manage_users', 'manage_services', 'manage_appointments', 'manage_payments', 'view_reports']
      },
      {
        name: 'barber',
        description: 'Barber staff member',
        permissions: ['manage_appointments', 'view_reports', 'update_profile']
      },
      {
        name: 'customer',
        description: 'Regular customer',
        permissions: ['book_appointment', 'update_profile']
      }
    ];

    await Role.insertMany(defaultRoles);
    console.log('[SUCCESS] Default roles created');
  } catch (error) {
    console.error('[ERROR] Error seeding roles:', error.message);
  }
};

const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@barber.com' });
    if (existingAdmin) {
      console.log('[SKIP] Admin user already exists - skipping');
      return;
    }

    const hashedPassword = await hashPassword('Admin@123456');

    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@barber.com',
      password: hashedPassword,
      phone: '0901234567',
      avatar: null,
      bio: 'System Administrator',
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    console.log('[SUCCESS] Admin user created - Email: admin@barber.com | Password: Admin@123456');
  } catch (error) {
    console.error('[ERROR] Error seeding admin user:', error.message);
  }
};

const seedSampleBarbersAndCustomers = async () => {
  try {
    const existingBarbers = await User.countDocuments({ role: 'barber' });
    if (existingBarbers > 0) {
      console.log('[SKIP] Sample barbers/customers already exist - skipping');
      return;
    }

    const hashedPassword = await hashPassword('User@123456');

    // Create sample barbers
    const barbers = [
      {
        name: 'Nguyen Van A',
        email: 'barber1@barber.com',
        phone: '0912345678',
        bio: 'Expert barber with 10 years experience',
        role: 'barber'
      },
      {
        name: 'Tran Van B',
        email: 'barber2@barber.com',
        phone: '0912345679',
        bio: 'Master of modern styles',
        role: 'barber'
      },
      {
        name: 'Hoang Van C',
        email: 'barber3@barber.com',
        phone: '0912345680',
        bio: 'Specialist in traditional cuts',
        role: 'barber'
      }
    ];

    // Create sample customers
    const customers = [
      {
        name: 'Khach hang 1',
        email: 'customer1@email.com',
        phone: '0901111111',
        role: 'customer'
      },
      {
        name: 'Khach hang 2',
        email: 'customer2@email.com',
        phone: '0901111112',
        role: 'customer'
      }
    ];

    const allUsers = [...barbers, ...customers];

    for (let user of allUsers) {
      user.password = hashedPassword;
      user.isActive = true;
    }

    await User.insertMany(allUsers);
    console.log('[SUCCESS] Created ' + barbers.length + ' sample barbers and ' + customers.length + ' sample customers');
    console.log('[INFO] Sample login: barber1@barber.com | Password: User@123456');
    console.log('[INFO] Sample login: customer1@email.com | Password: User@123456');
  } catch (error) {
    console.error('[ERROR] Error seeding users:', error.message);
  }
};

const seedCategories = async () => {
  try {
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      console.log('[SKIP] Categories already exist - skipping');
      return;
    }

    const categories = [
      {
        name: 'Cat toc nam',
        slug: 'cat-toc-nam',
        description: 'Dich vu cat toc cho nam',
        parentId: null
      },
      {
        name: 'Cat toc nu',
        slug: 'cat-toc-nu',
        description: 'Dich vu cat toc cho nu',
        parentId: null
      },
      {
        name: 'Nhuom toc',
        slug: 'nhuom-toc',
        description: 'Dich vu nhuom toc',
        parentId: null
      },
      {
        name: 'Duong toc',
        slug: 'duong-toc',
        description: 'Dich vu cham soc toc',
        parentId: null
      }
    ];

    await Category.insertMany(categories);
    console.log('[SUCCESS] Created ' + categories.length + ' sample categories');
  } catch (error) {
    console.error('[ERROR] Error seeding categories:', error.message);
  }
};

const seedProducts = async () => {
  try {
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('[SKIP] Products already exist - skipping');
      return;
    }

    // Get categories
    const maleCategory = await Category.findOne({ slug: 'cat-toc-nam' });
    const femaleCategory = await Category.findOne({ slug: 'cat-toc-nu' });
    const colorCategory = await Category.findOne({ slug: 'nhuom-toc' });
    const careCategory = await Category.findOne({ slug: 'duong-toc' });

    const products = [
      // Male haircuts
      {
        name: 'Cat toc nam thuong',
        description: 'Cat toc co ban cho nam - duong kinh dien',
        price: 50000,
        duration: 30,
        categoryId: maleCategory._id,
        isActive: true
      },
      {
        name: 'Cat toc nam + Goi dau',
        description: 'Cat toc + goi dau premium cho nam',
        price: 80000,
        duration: 45,
        categoryId: maleCategory._id,
        isActive: true
      },
      {
        name: 'Cat toc nam + Goi dau + Massage',
        description: 'Goi dich vu hoan hao cho nam',
        price: 120000,
        duration: 60,
        categoryId: maleCategory._id,
        isActive: true
      },
      {
        name: 'Cat toc ky thuat',
        description: 'Cat toc ky thuat cao cap',
        price: 100000,
        duration: 45,
        categoryId: maleCategory._id,
        isActive: true
      },

      // Female haircuts
      {
        name: 'Cat toc nu cua',
        description: 'Cat toc cua phom hay cho nu',
        price: 80000,
        duration: 45,
        categoryId: femaleCategory._id,
        isActive: true
      },
      {
        name: 'Cat + Uon toc nu',
        description: 'Cat + uon toc cao cap',
        price: 150000,
        duration: 90,
        categoryId: femaleCategory._id,
        isActive: true
      },
      {
        name: 'Cat + Goi dau + Sap',
        description: 'Cham soc toc nu toan dien',
        price: 120000,
        duration: 60,
        categoryId: femaleCategory._id,
        isActive: true
      },

      // Hair coloring
      {
        name: 'Nhuom toc mau don',
        description: 'Nhuom toc mot mau',
        price: 200000,
        duration: 90,
        categoryId: colorCategory._id,
        isActive: true
      },
      {
        name: 'Nhuom toc mau duo',
        description: 'Nhuom toc hai mau - tao dieu',
        price: 280000,
        duration: 120,
        categoryId: colorCategory._id,
        isActive: true
      },
      {
        name: 'Nhuom toc highlights',
        description: 'Nhuom toc highlights sang trong',
        price: 250000,
        duration: 120,
        categoryId: colorCategory._id,
        isActive: true
      },

      // Hair care services
      {
        name: 'Duong toc tre hoa',
        description: 'Duong toc tre hoa voi serum cao cap',
        price: 180000,
        duration: 60,
        categoryId: careCategory._id,
        isActive: true
      },
      {
        name: 'Duong toc phuc hoi',
        description: 'Duong toc phuc hoi toc hong',
        price: 150000,
        duration: 45,
        categoryId: careCategory._id,
        isActive: true
      },
      {
        name: 'Spa toc sang tron',
        description: 'Spa toc sang tron toan dien',
        price: 220000,
        duration: 90,
        categoryId: careCategory._id,
        isActive: true
      }
    ];

    await Product.insertMany(products);
    console.log('[SUCCESS] Created ' + products.length + ' sample products/services');
  } catch (error) {
    console.error('[ERROR] Error seeding products:', error.message);
  }
};

const seedReservations = async () => {
  try {
    const existingReservations = await Reservation.countDocuments();
    if (existingReservations > 0) {
      console.log('[SKIP] Reservations already exist - skipping');
      return;
    }

    const barbers = await User.find({ role: 'barber' }).limit(3);
    const customers = await User.find({ role: 'customer' }).limit(3);
    const products = await Product.find().limit(5);

    if (barbers.length === 0 || customers.length === 0 || products.length === 0) {
      console.log('[SKIP] Not enough barbers/customers/products for reservations');
      return;
    }

    const reservations = [];
    const today = new Date();

    // Create reservations from -30 days to +30 days
    for (let i = -15; i < 15; i++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + i);

      const statuses = [APPOINTMENT_STATUS.DONE, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.PENDING];
      // Past dates are usually DONE, future are PENDING/CONFIRMED
      const status = i < 0 ? APPOINTMENT_STATUS.DONE : statuses[Math.abs(i) % 3];

      const timeSlots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

      reservations.push({
        customerId: customers[Math.abs(i) % customers.length]._id,
        barberId: barbers[Math.abs(i) % barbers.length]._id,
        serviceId: products[Math.abs(i) % products.length]._id,
        appointmentDate: appointmentDate,
        appointmentTime: timeSlots[Math.abs(i) % timeSlots.length],
        status: status,
        totalPrice: products[Math.abs(i) % products.length].price,
        notes: `Du lieu mau - ${['Cat toc le', 'Uon toc', 'Nhuom toc', 'Combo VIP'][Math.abs(i) % 4]}`
      });
    }

    await Reservation.insertMany(reservations);
    console.log('[SUCCESS] Created ' + reservations.length + ' sample reservations');
  } catch (error) {
    console.error('[ERROR] Error seeding reservations:', error.message);
  }
};

const seedReviews = async () => {
  try {
    const existingReviews = await Review.countDocuments();
    if (existingReviews > 0) {
      console.log('[SKIP] Reviews already exist - skipping');
      return;
    }

    const completedReservations = await Reservation.find({ status: APPOINTMENT_STATUS.DONE }).limit(5);

    if (completedReservations.length === 0) {
      console.log('[SKIP] No completed reservations for reviews');
      return;
    }

    const reviews = [];
    const comments = [
      'Tao toc rat dep, thanh thao va chat luong dung danh gia',
      'Dich vu tot, o clean va nhan vien than thien',
      'Gia hoi hop, ket qua rat y man',
      'Khong gop y chi, se quay lai thoi',
      'Nhan vien cua hang rat chuyen nghiep va kinh nghiem'
    ];

    for (let i = 0; i < completedReservations.length; i++) {
      const reservation = completedReservations[i];
      reviews.push({
        customerId: reservation.customerId,
        barberId: reservation.barberId,
        productId: reservation.serviceId,
        reservationId: reservation._id,
        rating: [4.5, 5, 4, 4.5, 5][i % 5],
        comment: comments[i % comments.length],
        images: []
      });
    }

    await Review.insertMany(reviews);
    console.log('[SUCCESS] Created ' + reviews.length + ' sample reviews');
  } catch (error) {
    console.error('[ERROR] Error seeding reviews:', error.message);
  }
};

const seedPayments = async () => {
  try {
    const existingPayments = await Payment.countDocuments();
    if (existingPayments > 0) {
      console.log('[SKIP] Payments already exist - skipping');
      return;
    }

    const reservations = await Reservation.find().limit(8);

    if (reservations.length === 0) {
      console.log('[SKIP] No reservations for payments');
      return;
    }

    const payments = [];
    const methods = [PAYMENT_METHOD.CASH, PAYMENT_METHOD.TRANSFER, PAYMENT_METHOD.QR];
    const statuses = [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PAID];

    for (let i = 0; i < reservations.length; i++) {
      const reservation = reservations[i];
      const refCode = 'PAY' + Date.now() + '_' + i;
      const transactionId = ['', 'SEPAY_' + Math.random().toString(36).substr(2, 10), ''][i % 3];

      payments.push({
        reservationId: reservation._id,
        customerId: reservation.customerId,
        referenceCode: refCode,
        amount: reservation.totalPrice,
        method: methods[i % methods.length],
        status: statuses[i % statuses.length],
        transactionId: transactionId || undefined,
        paidAt: [new Date(), null, new Date()][i % 3]
      });
    }

    await Payment.insertMany(payments);
    console.log('[SUCCESS] Created ' + payments.length + ' sample payments');
  } catch (error) {
    console.error('[ERROR] Error seeding payments:', error.message);
  }
};

const seedInventory = async () => {
  try {
    const existing = await Inventory.countDocuments();
    if (existing > 0) {
      console.log('[SKIP] Inventory already exists');
      return;
    }

    const items = [
      { name: 'Gôm xịt tóc Silhouette', sku: 'GOM-001', quantity: 45, unit: 'chai', minStock: 10, supplier: 'Schwarzkopf', purchasePrice: 120000 },
      { name: 'Sáp Pomade Reuzel Blue', sku: 'SAP-002', quantity: 28, unit: 'hộp', minStock: 15, supplier: 'Reuzel', purchasePrice: 350000 },
      { name: 'Tinh dầu dưỡng Moroccanoil', sku: 'OIL-003', quantity: 4, unit: 'chai', minStock: 10, supplier: 'Moroccanoil', purchasePrice: 850000 },
      { name: 'Bột tạo phồng Uppercut', sku: 'BOT-004', quantity: 12, unit: 'lọ', minStock: 5, supplier: 'Uppercut Deluxe', purchasePrice: 280000 },
      { name: 'Khăn mặt bông trắng', sku: 'KHA-005', quantity: 120, unit: 'cái', minStock: 30, supplier: 'Det May VN', purchasePrice: 15000 },
      { name: 'Lưỡi dao cạo lam', sku: 'DAO-006', quantity: 8, unit: 'hộp', minStock: 15, supplier: 'Gillette', purchasePrice: 45000 },
      { name: 'Dầu gội bưởi Vijully', sku: 'SHA-007', quantity: 18, unit: 'chai', minStock: 10, supplier: 'Vijully', purchasePrice: 180000 },
      { name: 'Khăn giấy khô Premium', sku: 'PAP-008', quantity: 3, unit: 'gói', minStock: 10, supplier: 'Unicharm', purchasePrice: 25000 }
    ];

    await Inventory.insertMany(items);
    console.log('[SUCCESS] Created ' + items.length + ' inventory items (with low stock alerts)');
  } catch (error) {
    console.error('[ERROR] Error seeding inventory:', error.message);
  }
};

const seed = async () => {
  try {
    await connectDB();

    console.log('[INFO] ==========================================');
    console.log('[INFO]   STARTING DATABASE SEEDING...');
    console.log('[INFO] ==========================================\n');

    await seedRoles();
    await seedAdminUser();
    await seedSampleBarbersAndCustomers();
    await seedCategories();
    await seedProducts();
    await seedReservations();
    await seedReviews();
    await seedPayments();
    await seedInventory();

    console.log('\n[INFO] ==========================================');
    console.log('[SUCCESS] DATABASE SEEDING COMPLETED!');
    console.log('[INFO] ==========================================\n');
    console.log('[INFO] Dang nhap test:');
    console.log('  Admin:    admin@barber.com / Admin@123456');
    console.log('  Barber:   barber1@barber.com / User@123456');
    console.log('  Customer: customer1@email.com / User@123456\n');

    await mongoose.connection.close();
    console.log('[INFO] MongoDB disconnected\n');
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
