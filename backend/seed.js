// ============================================
// SEED.JS - INITIALIZE DEFAULT DATA
// ============================================
require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./src/models/Role');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const { hashPassword } = require('./src/utils/password');
const { ROLES } = require('./src/config/constants');

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

    const cutCategory = await Category.findOne({ name: 'Cat toc nam' });

    if (!cutCategory) {
      console.log('[SKIP] Category not found - skipping products');
      return;
    }

    const products = [
      {
        name: 'Cat toc thuong',
        description: 'Cat toc co ban',
        price: 50000,
        duration: 30,
        categoryId: cutCategory._id
      },
      {
        name: 'Cat toc + Goi dau',
        description: 'Cat toc + goi dau premium',
        price: 80000,
        duration: 45,
        categoryId: cutCategory._id
      },
      {
        name: 'Cat toc + Nhuom',
        description: 'Cat toc + nhuom mau',
        price: 150000,
        duration: 90,
        categoryId: cutCategory._id
      }
    ];

    await Product.insertMany(products);
    console.log('[SUCCESS] Created ' + products.length + ' sample products');
  } catch (error) {
    console.error('[ERROR] Error seeding products:', error.message);
  }
};

const seed = async () => {
  try {
    await connectDB();

    console.log('[INFO] SEEDING DATABASE...');

    await seedRoles();
    await seedAdminUser();
    await seedSampleBarbersAndCustomers();
    await seedCategories();
    await seedProducts();

    console.log('[SUCCESS] DATABASE SEEDING COMPLETED!');

    await mongoose.connection.close();
    console.log('[INFO] MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
