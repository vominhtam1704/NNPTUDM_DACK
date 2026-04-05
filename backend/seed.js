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
const Voucher = require('./src/models/Voucher');
const Message = require('./src/models/Message');
const { hashPassword } = require('./src/utils/password');
const { ROLES, APPOINTMENT_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, MESSAGE_TYPE } = require('./src/config/constants');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/barber_atelier';

    // Auto-inject credentials if provided in .env and missing from URI
    if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD && !uri.includes('@')) {
      const user = encodeURIComponent(process.env.MONGODB_USER);
      const pass = encodeURIComponent(process.env.MONGODB_PASSWORD);
      uri = uri.replace('mongodb://', `mongodb://${user}:${pass}@`);
    }

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

    // ===== CREATE 15+ PROFESSIONAL BARBERS =====
    const barbers = [
      {
        name: 'Nguyễn Văn Anh',
        email: 'barber.anh@atelier.com',
        phone: '0912345670',
        address: '123 Đường Nguyễn Huệ, Q1, TP.HCM',
        birthDate: new Date('1985-03-15'),
        gender: 'male',
        bio: 'Thợ cắt chuyên nghiệp 15 năm kinh nghiệm, chuyên gia cắt tóc nam hiện đại',
        loyaltyPoints: 250,
        membershipTier: 'Gold'
      },
      {
        name: 'Trần Văn Bình',
        email: 'barber.binh@atelier.com',
        phone: '0912345671',
        address: '456 Lê Lợi, Q1, TP.HCM',
        birthDate: new Date('1988-07-22'),
        gender: 'male',
        bio: 'Master barber - Chuyên về fade cut, undercut, design tóc cao cấp',
        loyaltyPoints: 180,
        membershipTier: 'Gold'
      },
      {
        name: 'Hoàng Văn Cường',
        email: 'barber.cuong@atelier.com',
        phone: '0912345672',
        address: '789 Nguyễn Thái Học, Q1, TP.HCM',
        birthDate: new Date('1990-11-05'),
        gender: 'male',
        bio: 'Chuyên gia uốn tóc, nhuộm tóc nữ, phục hồi tóc hư tổn',
        loyaltyPoints: 220,
        membershipTier: 'Platinum'
      },
      {
        name: 'Đỗ Thị Lan',
        email: 'barber.lan@atelier.com',
        phone: '0912345673',
        address: '321 Cách Mạng Tháng 8, Q3, TP.HCM',
        birthDate: new Date('1992-05-18'),
        gender: 'female',
        bio: 'Barber nữ chuyên gia - Uốn, nhuộm, phục hồi tóc chuyên sâu',
        loyaltyPoints: 200,
        membershipTier: 'Gold'
      },
      {
        name: 'Lê Văn Đạt',
        email: 'barber.dat@atelier.com',
        phone: '0912345674',
        address: '654 Trần Hưng Đạo, Q5, TP.HCM',
        birthDate: new Date('1987-09-30'),
        gender: 'male',
        bio: 'Cắt uy tín, chuyên color hair và tạo kiểu bồi xứng',
        loyaltyPoints: 190,
        membershipTier: 'Gold'
      },
      {
        name: 'Phạm Thị Hoa',
        email: 'barber.hoa@atelier.com',
        phone: '0912345675',
        address: '987 Hai Bà Trưng, Q1, TP.HCM',
        birthDate: new Date('1994-02-14'),
        gender: 'female',
        bio: 'Stylist nữ giỏi - Chuyên tạo kiểu tóc nữ hiện đại, làm tóc gợn sóng',
        loyaltyPoints: 170,
        membershipTier: 'Silver'
      },
      {
        name: 'Phạm Văn Hùng',
        email: 'barber.hung@atelier.com',
        phone: '0912345676',
        address: '147 Hàng Dương, Q4, TP.HCM',
        birthDate: new Date('1989-08-25'),
        gender: 'male',
        bio: 'Cắt tóc nam chuyên gia, design tóc trendy, fade cut tỉ mỉ',
        loyaltyPoints: 205,
        membershipTier: 'Gold'
      },
      {
        name: 'Ngô Thị Khánh',
        email: 'barber.khanh@atelier.com',
        phone: '0912345677',
        address: '258 Bạch Đằng, Q2, TP.HCM',
        birthDate: new Date('1991-12-08'),
        gender: 'female',
        bio: 'Nhuộm tóc cao cấp, phục hồi tóc hư tổn - tận tâm chuyên nghiệp',
        loyaltyPoints: 195,
        membershipTier: 'Gold'
      },
      {
        name: 'Võ Văn Minh',
        email: 'barber.minh@atelier.com',
        phone: '0912345678',
        address: '369 Tôn Đức Thắng, Q1, TP.HCM',
        birthDate: new Date('1986-04-17'),
        gender: 'male',
        bio: 'Chuyên gia design tóc, cắt kinky, bạc tóc - 12 năm kinh nghiệm',
        loyaltyPoints: 240,
        membershipTier: 'Platinum'
      },
      {
        name: 'Tạ Thị Nhật',
        email: 'barber.nhat@atelier.com',
        phone: '0912345679',
        address: '741 Ký Con, Q1, TP.HCM',
        birthDate: new Date('1993-06-21'),
        gender: 'female',
        bio: 'Styling chuyên nữ, tạo kiểu tóc vintage, hiện đại, thẩm mỹ cao',
        loyaltyPoints: 185,
        membershipTier: 'Silver'
      },
      {
        name: 'Bùi Văn Phú',
        email: 'barber.phu@atelier.com',
        phone: '0912345680',
        address: '852 Âu Cơ, Q5, TP.HCM',
        birthDate: new Date('1988-10-11'),
        gender: 'male',
        bio: 'Cắt tóc nam cao cấp, beard style, điêu khắc tóc tỉ mỉ',
        loyaltyPoints: 215,
        membershipTier: 'Gold'
      },
      {
        name: 'Dương Thị Quyên',
        email: 'barber.quyen@atelier.com',
        phone: '0912345681',
        address: '963 Trường Sơn, Q10, TP.HCM',
        birthDate: new Date('1995-01-09'),
        gender: 'female',
        bio: 'Đặc trị massage tóc, chăm sóc tóc toàn diện, nhuộm tóc đẹp',
        loyaltyPoints: 160,
        membershipTier: 'Silver'
      },
      {
        name: 'Lý Văn Soán',
        email: 'barber.soan@atelier.com',
        phone: '0912345682',
        address: '159 Nguyễn Văn Cư, Q5, TP.HCM',
        birthDate: new Date('1987-07-14'),
        gender: 'male',
        bio: 'Barber uy tín, cắt tóc nam theo yêu cầu, gọi dầu massage thư giãn',
        loyaltyPoints: 220,
        membershipTier: 'Gold'
      },
      {
        name: 'Cao Thị Thủy',
        email: 'barber.thuy@atelier.com',
        phone: '0912345683',
        address: '273 Huỳnh Thực Kháng, Q Tân Bình, TP.HCM',
        birthDate: new Date('1992-03-27'),
        gender: 'female',
        bio: 'Chuyên nhuộm, uốn, phục hồi tóc nữ cao cấp - đội tuyển các sự kiện',
        loyaltyPoints: 210,
        membershipTier: 'Gold'
      },
      {
        name: 'Trương Văn Vũ',
        email: 'barber.vu@atelier.com',
        phone: '0912345684',
        address: '384 Ngô Tất Tố, Q Bình Thạnh, TP.HCM',
        birthDate: new Date('1990-09-19'),
        gender: 'male',
        bio: 'Cắt design cao cấp, tạo phom, sơn lông mày chuyên nghiệp 10 năm',
        loyaltyPoints: 200,
        membershipTier: 'Gold'
      }
    ];

    // ===== CREATE 30+ CUSTOMERS DIVERSE =====
    const customers = [
      { name: 'Trần Huy Hoàng', email: 'customer.huyhoang@gmail.com', phone: '0901111101', gender: 'male', birthDate: new Date('1995-01-10'), address: 'Quận 1, TP.HCM', loyaltyPoints: 45 },
      { name: 'Phạm Minh Tuấn', email: 'customer.minhtuan@gmail.com', phone: '0901111102', gender: 'male', birthDate: new Date('1992-05-22'), address: 'Quận 3, TP.HCM', loyaltyPoints: 120 },
      { name: 'Nguyễn Đức Huy', email: 'customer.duchuy@gmail.com', phone: '0901111103', gender: 'male', birthDate: new Date('1998-08-14'), address: 'Quận 5, TP.HCM', loyaltyPoints: 30 },
      { name: 'Võ Trung Kiên', email: 'customer.trungkien@gmail.com', phone: '0901111104', gender: 'male', birthDate: new Date('1993-03-30'), address: 'Quận 7, TP.HCM', loyaltyPoints: 85 },
      { name: 'Lê Hồng Quân', email: 'customer.hongquan@gmail.com', phone: '0901111105', gender: 'male', birthDate: new Date('1996-11-12'), address: 'Quận 10, TP.HCM', loyaltyPoints: 60 },
      
      { name: 'Đinh Bích Huyền', email: 'customer.bichhuyen@gmail.com', phone: '0901111106', gender: 'female', birthDate: new Date('1997-02-18'), address: 'Quận 1, TP.HCM', loyaltyPoints: 135 },
      { name: 'Tô Minh Phương', email: 'customer.minhphuong@gmail.com', phone: '0901111107', gender: 'female', birthDate: new Date('1994-06-25'), address: 'Quận 3, TP.HCM', loyaltyPoints: 70 },
      { name: 'Ngô Thanh Hương', email: 'customer.thanhhung@gmail.com', phone: '0901111108', gender: 'female', birthDate: new Date('1999-09-07'), address: 'Quận 4, TP.HCM', loyaltyPoints: 50 },
      { name: 'Huỳnh Kim Dung', email: 'customer.kimdung@gmail.com', phone: '0901111109', gender: 'female', birthDate: new Date('1991-12-03'), address: 'Quận 5, TP.HCM', loyaltyPoints: 155 },
      { name: 'Vũ Thị Thanh Tâm', email: 'customer.thanh.tam@gmail.com', phone: '0901111110', gender: 'female', birthDate: new Date('1993-07-19'), address: 'Quận 7, TP.HCM', loyaltyPoints: 95 },
      
      { name: 'Bùi Văn Thao', email: 'customer.vanthao@gmail.com', phone: '0901111111', gender: 'male', birthDate: new Date('1994-04-16'), address: 'Quận 9, TP.HCM', loyaltyPoints: 40 },
      { name: 'Lý Quốc Anh', email: 'customer.quocanh@gmail.com', phone: '0901111112', gender: 'male', birthDate: new Date('1996-10-28'), address: 'Quận 10, TP.HCM', loyaltyPoints: 75 },
      { name: 'Dương Văn Hải', email: 'customer.vanhai@gmail.com', phone: '0901111113', gender: 'male', birthDate: new Date('1991-01-14'), address: 'Quận 11, TP.HCM', loyaltyPoints: 110 },
      { name: 'Phan Thanh Long', email: 'customer.thanhlong@gmail.com', phone: '0901111114', gender: 'male', birthDate: new Date('1997-05-09'), address: 'Quận 12, TP.HCM', loyaltyPoints: 55 },
      { name: 'Hoàng Xuân Nam', email: 'customer.xuannam@gmail.com', phone: '0901111115', gender: 'male', birthDate: new Date('1992-08-21'), address: 'Q. Bình Thạnh, TP.HCM', loyaltyPoints: 80 },
      
      { name: 'Lâm Thúy Anh', email: 'customer.thuyanhh@gmail.com', phone: '0901111116', gender: 'female', birthDate: new Date('1998-03-11'), address: 'Q. Tân Bình, TP.HCM', loyaltyPoints: 35 },
      { name: 'Đặng Hương Ly', email: 'customer.huongly@gmail.com', phone: '0901111117', gender: 'female', birthDate: new Date('1995-09-24'), address: 'Q. Tân Phú, TP.HCM', loyaltyPoints: 92 },
      { name: 'Trịnh Thảo Vy', email: 'customer.thaoqy@gmail.com', phone: '0901111118', gender: 'female', birthDate: new Date('1993-12-05'), address: 'Q. Gò Vấp, TP.HCM', loyaltyPoints: 125 },
      { name: 'Quách Mỹ Nhàn', email: 'customer.mynhan@gmail.com', phone: '0901111119', gender: 'female', birthDate: new Date('1996-06-17'), address: 'Q. Bình Chánh, TP.HCM', loyaltyPoints: 65 },
      { name: 'Lưu Huyền Trang', email: 'customer.huyentrang@gmail.com', phone: '0901111120', gender: 'female', birthDate: new Date('1994-11-02'), address: 'Q. Nhà Bè, TP.HCM', loyaltyPoints: 140 },
      
      { name: 'Trần Anh Tuấn', email: 'customer.anhtuan@gmail.com', phone: '0901111121', gender: 'male', birthDate: new Date('1991-02-28'), address: 'Quận 1, TP.HCM', loyaltyPoints: 100 },
      { name: 'Ngô Minh Châu', email: 'customer.minhchau@gmail.com', phone: '0901111122', gender: 'male', birthDate: new Date('1997-04-13'), address: 'Quận 3, TP.HCM', loyaltyPoints: 48 },
      { name: 'Thái Huy Hoàng', email: 'customer.huyhoangg@gmail.com', phone: '0901111123', gender: 'male', birthDate: new Date('1993-07-20'), address: 'Quận 5, TP.HCM', loyaltyPoints: 88 },
      { name: 'Phan Hoàng Quân', email: 'customer.hoangquan@gmail.com', phone: '0901111124', gender: 'male', birthDate: new Date('1995-10-06'), address: 'Quận 7, TP.HCM', loyaltyPoints: 62 },
      { name: 'Vũ Đức Thắng', email: 'customer.ducthang@gmail.com', phone: '0901111125', gender: 'male', birthDate: new Date('1992-03-15'), address: 'Q. Tân Bình, TP.HCM', loyaltyPoints: 72 },
      
      { name: 'Tạ Minh Hà', email: 'customer.minhha@gmail.com', phone: '0901111126', gender: 'female', birthDate: new Date('1996-08-22'), address: 'Q. Gò Vấp, TP.HCM', loyaltyPoints: 108 },
      { name: 'Đỗ Kiều Oanh', email: 'customer.kieuoanh@gmail.com', phone: '0901111127', gender: 'female', birthDate: new Date('1994-01-10'), address: 'Q. Bình Tân, TP.HCM', loyaltyPoints: 54 },
      { name: 'Hà Hương Linh', email: 'customer.huonglinh@gmail.com', phone: '0901111128', gender: 'female', birthDate: new Date('1999-05-16'), address: 'Q. Tân Phú, TP.HCM', loyaltyPoints: 32 },
      { name: 'Phạm Thu Hà', email: 'customer.thuha@gmail.com', phone: '0901111129', gender: 'female', birthDate: new Date('1991-09-09'), address: 'Q. Phú Nhuận, TP.HCM', loyaltyPoints: 150 },
      { name: 'Trương Thị Minh', email: 'customer.thiminhh@gmail.com', phone: '0901111130', gender: 'female', birthDate: new Date('1997-12-14'), address: 'Q. Nhà Bè, TP.HCM', loyaltyPoints: 66 }
    ];

    const allUsers = [...barbers, ...customers];

    for (let user of allUsers) {
      user.password = hashedPassword;
      user.isActive = true;
    }

    // Ensure roles are set correctly
    barbers.forEach(b => b.role = 'barber');
    customers.forEach(c => c.role = 'customer');

    await User.insertMany(allUsers);
    console.log('[SUCCESS] Tạo ' + barbers.length + ' thợ cắt + ' + customers.length + ' khách hàng = ' + allUsers.length + ' người dùng');
    console.log('[INFO] Đăng nhập test: barber.anh@atelier.com / User@123456');
    console.log('[INFO] Đăng nhập test: customer.huyhoang@gmail.com / User@123456\n');
  } catch (error) {
    console.error('[ERROR] Lỗi seeding users:', error.message);
  }
};

const seedCategories = async () => {
  try {
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      console.log('[SKIP] Danh mục sản phẩm đã tồn tại - bỏ qua');
      return;
    }

    const categories = [
      // MEN HAIRCUTS
      {
        name: 'Cắt Tóc Nam',
        slug: 'cat-toc-nam',
        description: 'Dịch vụ cắt tóc chuyên nghiệp cho nam',
        image: 'https://via.placeholder.com/300?text=Men+Haircut',
        parentId: null
      },
      {
        name: 'Fade & Undercut',
        slug: 'fade-undercut',
        description: 'Cắt kiểu fade, undercut hiện đại',
        parentId: null
      },
      
      // WOMEN HAIRCUTS
      {
        name: 'Cắt Tóc Nữ',
        slug: 'cat-toc-nu',
        description: 'Dịch vụ cắt tóc chuyên sâu cho nữ',
        image: 'https://via.placeholder.com/300?text=Women+Haircut',
        parentId: null
      },
      {
        name: 'Uốn Tóc',
        slug: 'uon-toc',
        description: 'Uốn tóc gợn sóng, xoăn, uốn permanent',
        parentId: null
      },
      
      // COLORING
      {
        name: 'Nhuộm Tóc',
        slug: 'nhuom-toc',
        description: 'Dịch vụ nhuộm tóc từ cơ bản đến cao cấp',
        image: 'https://via.placeholder.com/300?text=Hair+Coloring',
        parentId: null
      },
      {
        name: 'Nhuộm Highlights',
        slug: 'nhuom-highlights',
        description: 'Nhuộm highlights, balayage sáng bóng',
        parentId: null
      },
      
      // TREATMENT & CARE
      {
        name: 'Dưỡng & Chăm Sóc Tóc',
        slug: 'duong-toc',
        description: 'Dịch vụ chăm sóc, phục hồi tóc hư tổn',
        image: 'https://via.placeholder.com/300?text=Hair+Care',
        parentId: null
      },
      {
        name: 'Spa Tóc',
        slug: 'spa-toc',
        description: 'Spa tóc toàn diện, massage đầu thư giãn',
        parentId: null
      },
      {
        name: 'Phục Hồi Tóc',
        slug: 'phuc-hoi-toc',
        description: 'Phục hồi tóc hư tổn, xơ rối từ hóa chất',
        parentId: null
      },
      
      // BONUS SERVICES
      {
        name: 'Gọi Dầu & Massage',
        slug: 'goi-dau-massage',
        description: 'Gọi dầu gội cao cấp kèm massage đầu thư giãn',
        parentId: null
      },
      {
        name: 'Combo Gói Dịch Vụ',
        slug: 'combo-dich-vu',
        description: 'Các gói combo tiết kiệm kết hợp nhiều dịch vụ',
        parentId: null
      },
      {
        name: 'Dịch Vụ Bổ Sung',
        slug: 'dich-vu-bo-sung',
        description: 'Sơn lông mày, tỉa râu, chăm sóc hàng ngày',
        parentId: null
      }
    ];

    await Category.insertMany(categories);
    console.log('[SUCCESS] Tạo ' + categories.length + ' danh mục dịch vụ');
  } catch (error) {
    console.error('[ERROR] Lỗi seeding danh mục:', error.message);
  }
};

const seedProducts = async () => {
  try {
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('[SKIP] Sản phẩm/dịch vụ đã tồn tại - bỏ qua');
      return;
    }

    // Get categories
    const cats = {};
    const allCats = await Category.find();
    allCats.forEach(c => {
      cats[c.slug] = c._id;
    });

    const products = [
      // ===== MALE HAIRCUTS =====
      { 
        name: 'Cắt Tóc Nam Cơ Bản', 
        description: 'Cắt tóc kiểu truyền thống, gọn gàng cho nam',
        price: 50000, duration: 30, categoryId: cats['cat-toc-nam'], isActive: true 
      },
      { 
        name: 'Cắt Tóc Nam + Gọi Dầu', 
        description: 'Cắt tóc + gọi dầu đầu premium cao cấp',
        price: 80000, duration: 45, categoryId: cats['cat-toc-nam'], isActive: true 
      },
      { 
        name: 'Cắt Tóc Nam VIP + Gọi + Massage', 
        description: 'Gói dịch vụ hoàn hảo cho nam quý ông',
        price: 120000, duration: 60, categoryId: cats['cat-toc-nam'], isActive: true 
      },
      { 
        name: 'Cắt Tóc Kỹ Thuật Nam', 
        description: 'Cắt tóc kỹ thuật cao cấp với thiết kế',
        price: 100000, duration: 50, categoryId: cats['cat-toc-nam'], isActive: true 
      },
      { 
        name: 'Fade Cut Chuyên Nghiệp', 
        description: 'Fade cut tỉ mỉ, đềm mịn từ trên xuống',
        price: 90000, duration: 45, categoryId: cats['fade-undercut'], isActive: true 
      },
      { 
        name: 'Undercut + Thiết Kế', 
        description: 'Undercut với thiết kế kiểu tóc bồi cao',
        price: 110000, duration: 50, categoryId: cats['fade-undercut'], isActive: true 
      },
      { 
        name: 'Tỉa Râu + Cắt Tóc', 
        description: 'Tỉa râu tỉ mỉ kèm cắt tóc design',
        price: 95000, duration: 45, categoryId: cats['cat-toc-nam'], isActive: true 
      },
      
      // ===== FEMALE HAIRCUTS =====
      { 
        name: 'Cắt Tóc Nữ Cua', 
        description: 'Cắt tóc cua phom chữ A, chữ V hay chữ I',
        price: 80000, duration: 45, categoryId: cats['cat-toc-nu'], isActive: true 
      },
      { 
        name: 'Cắt Tóc Nữ Dài Lỏng',
        description: 'Cắt tóc dài vuốt xoệt, duyên dáng',
        price: 75000, duration: 40, categoryId: cats['cat-toc-nu'], isActive: true 
      },
      { 
        name: 'Cắt Tóc Nữ Sượng Mái',
        description: 'Cắt tóc sượng mái, luộc tóc gọn gàng',
        price: 70000, duration: 35, categoryId: cats['cat-toc-nu'], isActive: true 
      },
      { 
        name: 'Cắt + Uốn Tóc Nữ',
        description: 'Cắt + uốn tóc gợn sóng cao cấp',
        price: 150000, duration: 90, categoryId: cats['uon-toc'], isActive: true 
      },
      { 
        name: 'Cắt + Tạo Kiểu',
        description: 'Cắt tóc + tạo kiểu tóc bồi cao xinh',
        price: 140000, duration: 80, categoryId: cats['cat-toc-nu'], isActive: true 
      },
      { 
        name: 'Cắt + Gọi Dầu + Sáp',
        description: 'Chăm sóc tóc nữ toàn diện',
        price: 120000, duration: 60, categoryId: cats['cat-toc-nu'], isActive: true 
      },
      
      // ===== PERMING =====
      { 
        name: 'Uốn Tóc Thường',
        description: 'Uốn tóc gợn sóng đơn giản',
        price: 120000, duration: 90, categoryId: cats['uon-toc'], isActive: true 
      },
      { 
        name: 'Uốn Tóc Cao Cấp',
        description: 'Uốn tóc cao cấp với liệu pháp cao cấp',
        price: 180000, duration: 120, categoryId: cats['uon-toc'], isActive: true 
      },
      { 
        name: 'Uốn Permanent Kiểu',
        description: 'Uốn permanent với thiết kế kiểu tóc',
        price: 200000, duration: 140, categoryId: cats['uon-toc'], isActive: true 
      },
      { 
        name: 'Uốn Bồi Tóc',
        description: 'Uốn tóc bồi cao để có kiểu tóc bồi đẹp',
        price: 140000, duration: 100, categoryId: cats['uon-toc'], isActive: true 
      },
      
      // ===== HAIR COLORING =====
      { 
        name: 'Nhuộm Tóc Một Màu',
        description: 'Nhuộm tóc một màu đơn giản',
        price: 200000, duration: 90, categoryId: cats['nhuom-toc'], isActive: true 
      },
      { 
        name: 'Nhuộm Tóc Hai Màu',
        description: 'Nhuộm tóc hai màu tạo điểu đó, nổi bật',
        price: 280000, duration: 120, categoryId: cats['nhuom-toc'], isActive: true 
      },
      { 
        name: 'Nhuộm Tóc Ombre',
        description: 'Nhuộm ombré độ chuyển màu tự nhiên',
        price: 300000, duration: 140, categoryId: cats['nhuom-toc'], isActive: true 
      },
      { 
        name: 'Nhuộm Highlights Sang',
        description: 'Nhuộm highlights sáng bóng, nổi bật',
        price: 250000, duration: 120, categoryId: cats['nhuom-highlights'], isActive: true 
      },
      { 
        name: 'Nhuộm Balayage',
        description: 'Nhuộm balayage tự nhiên, độ chuyển mềm',
        price: 320000, duration: 150, categoryId: cats['nhuom-highlights'], isActive: true 
      },
      { 
        name: 'Nhuộm + Phục Hồi',
        description: 'Nhuộm tóc + phục hồi tóc hư tổn',
        price: 350000, duration: 160, categoryId: cats['nhuom-toc'], isActive: true 
      },
      
      // ===== HAIR TREATMENT & CARE =====
      { 
        name: 'Dưỡng Tóc Trẻ Hóa',
        description: 'Dưỡng tóc trẻ hóa với serum cao cấp',
        price: 180000, duration: 60, categoryId: cats['duong-toc'], isActive: true 
      },
      { 
        name: 'Dưỡng Tóc Phục Hồi',
        description: 'Dưỡng tóc phục hồi tóc hư tổn từ hóa chất',
        price: 150000, duration: 50, categoryId: cats['phuc-hoi-toc'], isActive: true 
      },
      { 
        name: 'Spa Tóc Toàn Diện',
        description: 'Spa tóc toàn diện với massage đầu thư giãn',
        price: 220000, duration: 90, categoryId: cats['spa-toc'], isActive: true 
      },
      { 
        name: 'Gọi Dầu Premium',
        description: 'Gọi dầu gội cao cấp từ các liệu pháp tiên tiến',
        price: 100000, duration: 45, categoryId: cats['goi-dau-massage'], isActive: true 
      },
      { 
        name: 'Massage Đầu Thư Giãn',
        description: 'Massage đầu, vai, gáy thư giãn bấm huyệt',
        price: 80000, duration: 40, categoryId: cats['goi-dau-massage'], isActive: true 
      },
      { 
        name: 'Gọi Dầu + Massage',
        description: 'Gọi dầu cao cấp + massage đầu thư giãn',
        price: 140000, duration: 60, categoryId: cats['goi-dau-massage'], isActive: true 
      },
      
      // ===== COMBO PACKAGES =====
      { 
        name: 'Combo Cơ Bản',
        description: 'Cắt + gọi + massage - giá ưu đãi',
        price: 160000, duration: 80, categoryId: cats['combo-dich-vu'], isActive: true 
      },
      { 
        name: 'Combo Tiêu Chuẩn',
        description: 'Cắt + uốn + gọi + dưỡng - gói tiêu chuẩn',
        price: 280000, duration: 120, categoryId: cats['combo-dich-vu'], isActive: true 
      },
      { 
        name: 'Combo Cao Cấp',
        description: 'Cắt + nhuộm + trị + spa - gói cao cấp',
        price: 450000, duration: 180, categoryId: cats['combo-dich-vu'], isActive: true 
      },
      { 
        name: 'Combo Tháng VIP',
        description: '4 lần dịch vụ trong tháng - giá ưu tiên',
        price: 800000, duration: 240, categoryId: cats['combo-dich-vu'], isActive: true 
      },
      
      // ===== BONUS SERVICES =====
      { 
        name: 'Sơn Lông Mày Nối',
        description: 'Sơn lông mày nối hình xăm thẩm mỹ',
        price: 120000, duration: 45, categoryId: cats['dich-vu-bo-sung'], isActive: true 
      },
      { 
        name: 'Tỉa Lông Mày',
        description: 'Tỉa lông mày theo phom khuôn mặt',
        price: 50000, duration: 20, categoryId: cats['dich-vu-bo-sung'], isActive: true 
      },
      { 
        name: 'Tỉa Râu Chuyên Nghiệp',
        description: 'Tỉa râu tỉ mỉ theo thiết kế beard style',
        price: 60000, duration: 30, categoryId: cats['dich-vu-bo-sung'], isActive: true 
      },
      { 
        name: 'Nối Mi Lụa',
        description: 'Nối mi lụa thickness cao tự nhiên',
        price: 200000, duration: 90, categoryId: cats['dich-vu-bo-sung'], isActive: true 
      }
    ];

    await Product.insertMany(products);
    console.log('[SUCCESS] Tạo ' + products.length + ' dịch vụ/sản phẩm');
  } catch (error) {
    console.error('[ERROR] Lỗi seeding sản phẩm:', error.message);
  }
};

const seedReservations = async () => {
  try {
    const existingReservations = await Reservation.countDocuments();
    if (existingReservations > 0) {
      console.log('[SKIP] Đặt lịch hẹn đã tồn tại - bỏ qua');
      return;
    }

    const barbers = await User.find({ role: 'barber' });
    const customers = await User.find({ role: 'customer' });
    const products = await Product.find();

    if (barbers.length === 0 || customers.length === 0 || products.length === 0) {
      console.log('[SKIP] Không đủ thợ cắt/khách hàng/sản phẩm để tạo lịch hẹn');
      return;
    }

    const reservations = [];
    const today = new Date();
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const notes = [
      'Yêu cầu cắt fade',
      'Muốn kiểu tóc hiện đại',
      'Khách quen, lần thứ 20',
      'Nhuộm kèm phục hồi',
      'Uốn và tạo kiểu',
      'Massage đầu kỹ nhất',
      'Cắt sạch profile',
      'Cắt gọn, không dài',
      'Gọi dầu kỹ',
      'Combo VIP full service'
    ];

    // Create 50+ reservations from -40 days to +45 days
    for (let i = -40; i < 45; i++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + i);
      
      // Đặt múc trạng dựa trên ngày
      let status = APPOINTMENT_STATUS.PENDING;
      if (i < -5) status = APPOINTMENT_STATUS.DONE;
      else if (i < -1) status = [APPOINTMENT_STATUS.DONE, APPOINTMENT_STATUS.CANCELLED][Math.random() > 0.8 ? 1 : 0];
      else if (i < 2) status = APPOINTMENT_STATUS.CONFIRMED;

      const reservation = {
        customerId: customers[Math.abs(i) % customers.length]._id,
        barberId: barbers[Math.abs(i) % barbers.length]._id,
        serviceId: products[Math.abs(i) % products.length]._id,
        appointmentDate: appointmentDate,
        appointmentTime: timeSlots[Math.abs(i) % timeSlots.length],
        status: status,
        totalPrice: products[Math.abs(i) % products.length].price,
        notes: notes[Math.abs(i) % notes.length]
      };

      reservations.push(reservation);
    }

    await Reservation.insertMany(reservations);
    console.log('[SUCCESS] Tạo ' + reservations.length + ' đặt lịch hẹn');
  } catch (error) {
    console.error('[ERROR] Lỗi seeding đặt lịch hẹn:', error.message);
  }
};

const seedReviews = async () => {
  try {
    const existingReviews = await Review.countDocuments();
    if (existingReviews > 0) {
      console.log('[SKIP] Đánh giá đã tồn tại - bỏ qua');
      return;
    }

    const completedReservations = await Reservation.find({ status: APPOINTMENT_STATUS.DONE }).limit(25);

    if (completedReservations.length === 0) {
      console.log('[SKIP] Không có lịch hẹn hoàn thành để đánh giá');
      return;
    }

    const reviews = [];
    const comments = [
      'Tao tóc rất đẹp, thợ cắt thanh thạo và chuyên nghiệp, rất hài lòng!',
      'Chất lượng dịch vụ tốt, tiền phòng sạch sẽ, nhân viên vui tính',
      'Giá hợp lý, kết quả rất ưng ý, sẽ quay lại thường xuyên',
      'Không có gì để chê cả, dịch vụ 5 sao, tận tâm và chuyên nghiệp',
      'Nhân viên rất thân thiện, tái tạo tóc như ý muốn, đúng giá trị',
      'Rất tốt, thợ cắt giỏi, gọi dầu kỹ lưỡng, massage tuyệt vời',
      'Lần đầu đến, ấn tượng rất tốt, sẽ giới thiệu bạn bè',
      'Nhuộm tóc đẹp, màu chuẩn đúng mong muốn, chất lượng hàng top',
      'Uốn tóc bền, kiểu đẹp, bảo trì tốt sau khi uốn, tuyệt vời',
      'Phục hồi tóc hiệu quả, tóc mềm mượt sau dịch vụ',
      'Thiết kế kiểu tóc rất hay, phù hợp với khuôn mặt tôi',
      'Combo dịch vụ super, cắt + nhuộm + chăm sóc đẹp lắm',
      'Bạn bè giới thiệu, không hối tiếc, sẽ là thân khách thường',
      'Dịch vụ gọi dầu massage rất tuyệt, thư giãn hoàn toàn',
      'Designer giỏi, lắng nghe yêu cầu khách hàng rất kỹ',
      'Nơi này ăn điểm ở sạch sẽ và thái độ phục vụ',
      'Cắt tóc nam fade rất xuất sắc, mịn và chắc chắn',
      'Styled like a pro, feel like royalty after service',
      'Highly professional team, satisfied with every single detail',
      'Worth every penny spent, quality workmanship guaranteed'
    ];
    
    const ratings = [5, 5, 4.5, 5, 4, 5, 5, 4.5, 5, 4, 5, 4.5, 5, 5, 4];

    for (let i = 0; i < completedReservations.length; i++) {
      const reservation = completedReservations[i];
      reviews.push({
        customerId: reservation.customerId,
        barberId: reservation.barberId,
        productId: reservation.serviceId,
        reservationId: reservation._id,
        rating: ratings[i % ratings.length],
        comment: comments[i % comments.length],
        images: []
      });
    }

    await Review.insertMany(reviews);
    console.log('[SUCCESS] Tạo ' + reviews.length + ' đánh giá');
  } catch (error) {
    console.error('[ERROR] Lỗi seeding đánh giá:', error.message);
  }
};

const seedPayments = async () => {
  try {
    const existingPayments = await Payment.countDocuments();
    if (existingPayments > 0) {
      console.log('[SKIP] Thanh toán đã tồn tại - bỏ qua');
      return;
    }

    const reservations = await Reservation.find().limit(30);

    if (reservations.length === 0) {
      console.log('[SKIP] Không có lịch hẹn để tạo thanh toán');
      return;
    }

    const payments = [];
    const methods = [
      PAYMENT_METHOD.CASH,
      PAYMENT_METHOD.CASH,
      PAYMENT_METHOD.TRANSFER,
      PAYMENT_METHOD.QR,
      PAYMENT_METHOD.EPAY
    ];

    for (let i = 0; i < reservations.length; i++) {
      const reservation = reservations[i];
      const refCode = 'ORD-' + (20240001 + i);
      
      // Hầu hết thanh toán đã paid, một số pending/failed
      let status = PAYMENT_STATUS.PAID;
      if (i % 10 === 7) status = PAYMENT_STATUS.PENDING;
      if (i % 15 === 0) status = PAYMENT_STATUS.FAILED;
      
      const method = methods[i % methods.length];
      const transactionId = (i % 4 === 0 && status === PAYMENT_STATUS.PAID) 
        ? 'SEPAY_' + Math.random().toString(36).substr(2, 12) 
        : undefined;

      payments.push({
        reservationId: reservation._id,
        customerId: reservation.customerId,
        referenceCode: refCode,
        amount: reservation.totalPrice,
        method: method,
        status: status,
        transactionId: transactionId,
        paidAt: status === PAYMENT_STATUS.PAID ? new Date(reservation.appointmentDate) : null,
        failureReason: status === PAYMENT_STATUS.FAILED ? 'Quý khách hủy thanh toán' : null,
        qrCode: (method === PAYMENT_METHOD.QR && status === PAYMENT_STATUS.PAID) 
          ? 'https://via.placeholder.com/200?text=QR+Code' 
          : null
      });
    }

    await Payment.insertMany(payments);
    console.log('[SUCCESS] Tạo ' + payments.length + ' thanh toán');
  } catch (error) {
    console.error('[ERROR] Lỗi seeding thanh toán:', error.message);
  }
};

const seedVouchers = async () => {
  try {
    const existing = await Voucher.countDocuments();
    if (existing > 0) {
      console.log('[SKIP] Mã giảm giá đã tồn tại - bỏ qua');
      return;
    }

    const now = new Date();
    const future30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const future60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const future90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const vouchers = [
      // ===== PERCENTAGE DISCOUNT =====
      {
        code: 'WELCOME10',
        description: 'Giảm 10% cho khách hàng mới',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 50000,
        maxDiscount: 100000,
        startDate: now,
        expiryDate: future90,
        usageLimit: 1000,
        usageCount: 245,
        isActive: true
      },
      {
        code: 'SUMMER20',
        description: 'Mid-summer sale - Giảm 20%',
        discountType: 'percentage',
        discountValue: 20,
        minPurchase: 0,
        maxDiscount: 200000,
        startDate: now,
        expiryDate: future60,
        usageLimit: 500,
        usageCount: 312,
        isActive: true
      },
      {
        code: 'LOYAL5',
        description: '5% cho khách hàng thân thiết',
        discountType: 'percentage',
        discountValue: 5,
        minPurchase: 100000,
        maxDiscount: 50000,
        startDate: now,
        expiryDate: future90,
        usageLimit: 200,
        usageCount: 89,
        isActive: true
      },
      {
        code: 'COMBO25',
        description: 'Giảm 25% cho combo dịch vụ',
        discountType: 'percentage',
        discountValue: 25,
        minPurchase: 250000,
        maxDiscount: 100000,
        startDate: now,
        expiryDate: future30,
        usageLimit: 150,
        usageCount: 67,
        isActive: true
      },
      
      // ===== FIXED AMOUNT DISCOUNT =====
      {
        code: 'SAVE50K',
        description: 'Giảm cố định 50,000đ',
        discountType: 'fixed',
        discountValue: 50000,
        minPurchase: 150000,
        maxDiscount: 50000,
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        expiryDate: future30,
        usageLimit: 300,
        usageCount: 178,
        isActive: true
      },
      {
        code: 'SAVE100K',
        description: 'Giảm cố định 100,000đ',
        discountType: 'fixed',
        discountValue: 100000,
        minPurchase: 300000,
        maxDiscount: 100000,
        startDate: now,
        expiryDate: future60,
        usageLimit: 200,
        usageCount: 45,
        isActive: true
      },
      {
        code: 'BIRTHDAY30',
        description: 'Sinh nhật - Giảm 30,000đ',
        discountType: 'fixed',
        discountValue: 30000,
        minPurchase: 50000,
        maxDiscount: 30000,
        startDate: now,
        expiryDate: future90,
        usageLimit: 1000,
        usageCount: 401,
        isActive: true
      },
      
      // ===== SPECIAL OCCASION =====
      {
        code: 'FLASH50',
        description: 'Flash sale - 50% giảm giá',
        discountType: 'percentage',
        discountValue: 50,
        minPurchase: 100000,
        maxDiscount: 150000,
        startDate: now,
        expiryDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        usageLimit: 100,
        usageCount: 98,
        isActive: true
      },
      {
        code: 'REFER15',
        description: 'Giới thiệu bạn - Giảm 15%',
        discountType: 'percentage',
        discountValue: 15,
        minPurchase: 80000,
        maxDiscount: 120000,
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        expiryDate: future30,
        usageLimit: 500,
        usageCount: 234,
        isActive: true
      },
      {
        code: 'VIPONLY35',
        description: 'Dành cho VIP member - 35%',
        discountType: 'percentage',
        discountValue: 35,
        minPurchase: 200000,
        maxDiscount: 200000,
        startDate: now,
        expiryDate: future60,
        usageLimit: 100,
        usageCount: 32,
        isActive: true
      },
      
      // ===== EXPIRED CODES (for data richness) =====
      {
        code: 'EXPIRED20',
        description: 'Mã hết hạn (tham khảo)',
        discountType: 'percentage',
        discountValue: 20,
        minPurchase: 0,
        maxDiscount: 100000,
        startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        usageLimit: 1000,
        usageCount: 1000,
        isActive: false
      }
    ];

    await Voucher.insertMany(vouchers);
    console.log('[SUCCESS] Tạo ' + vouchers.length + ' mã giảm giá');
  } catch (error) {
    console.error('[ERROR] Lỗi seeding mã giảm giá:', error.message);
  }
};

const seedMessages = async () => {
  try {
    const existing = await Message.countDocuments();
    if (existing > 0) {
      console.log('[SKIP] Tin nhắn đã tồn tại - bỏ qua');
      return;
    }

    // Get admin user for system messages
    const admin = await User.findOne({ email: 'admin@barber.com' });
    const users = await User.find({ isActive: true, role: 'customer' }).limit(10);
    
    if (!admin || users.length < 2) {
      console.log('[SKIP] Không đủ người dùng để tạo tin nhắn');
      return;
    }

    const messages = [];
    const sampleMessages = [
      'Xin chào, lịch hẹn của bạn vào lúc 10:00 sáng mai đã được xác nhận',
      'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!',
      'Mã giảm giá WELCOME10 đang có hiệu lực, hãy sử dụng nó',
      'Bạn có muốn đặt lịch hẹn tiếp theo không?',
      'Phòng chúng tôi mở cửa từ 8h sáng đến 9h tối hàng ngày',
      'Cảm ơn bạn đã để lại đánh giá!',
      'Có thắc mắc gì về dịch vụ của chúng tôi không?',
      'Đặt bàn thành công! Vui lòng đến đúng giờ',
      'Chúng tôi có thêm dịch vụ mới bạn muốn thử không?',
      'Tổng hóa đơn của bạn là 350,000đ. Hãy thanh toán qua các phương thức có sẵn',
      'Vui lòng xác nhận đặt lịch hẹn của bạn',
      'Chương trình khách hàng thân thiết đang chờ bạn!',
      'Danh sách chờ đã hết. Bạn có muốn đặt thời gian khác không?',
      'Lịch hẹn của bạn đã được hủy thành công',
      'Cảm ơn bạn đã chọn chúng tôi để chăm sóc tóc'
    ];

    // Create notification messages from admin/system
    for (let i = 0; i < users.length * 2; i++) {
      messages.push({
        sender: admin._id,
        receiver: users[i % users.length]._id,
        type: MESSAGE_TYPE.NOTIFICATION,
        content: sampleMessages[i % sampleMessages.length],
        isRead: i % 3 !== 0 ? true : false,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }

    // Create chat messages between users
    for (let i = 0; i < Math.min(5, Math.floor(users.length / 2)); i++) {
      const sender = users[i];
      const receiver = users[(i + 1) % users.length];

      messages.push({
        sender: sender._id,
        receiver: receiver._id,
        type: MESSAGE_TYPE.CHAT,
        content: 'Xin chào, cảm ơn bạn đã ghé thăm cửa hàng của chúng tôi!',
        isRead: false,
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      });

      messages.push({
        sender: receiver._id,
        receiver: sender._id,
        type: MESSAGE_TYPE.CHAT,
        content: 'Cảm ơn bạn! Dịch vụ rất tốt, tôi rất hài lòng!',
        isRead: true,
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      });
    }

    await Message.insertMany(messages);
    console.log('[SUCCESS] Tạo ' + messages.length + ' tin nhắn và thông báo');
  } catch (error) {
    console.error('[ERROR] Lỗi seeding tin nhắn:', error.message);
  }
};

const seedInventory = async () => {
  try {
    const existing = await Inventory.countDocuments();
    if (existing > 0) {
      console.log('[SKIP] Kho hàng đã tồn tại - bỏ qua');
      return;
    }

    const items = [
      // ===== HAIR SPRAY & STYLING =====
      { name: 'Gôm Xịt Tóc Silhouette', sku: 'GOM-001', quantity: 45, unit: 'chai', minStock: 10, supplier: 'Schwarzkopf', purchasePrice: 120000 },
      { name: 'Sáp Pomade Reuzel Blue', sku: 'SAP-002', quantity: 28, unit: 'hộp', minStock: 15, supplier: 'Reuzel', purchasePrice: 350000 },
      { name: 'Sáp Suavecito', sku: 'SAP-003', quantity: 32, unit: 'hộp', minStock: 12, supplier: 'Suavecito', purchasePrice: 280000 },
      { name: 'Tinh Dầu Dưỡng Moroccanoil', sku: 'OIL-001', quantity: 4, unit: 'chai', minStock: 10, supplier: 'Moroccanoil', purchasePrice: 850000 },
      { name: 'Bột Tạo Phồng Uppercut', sku: 'BOT-001', quantity: 12, unit: 'lọ', minStock: 5, supplier: 'Uppercut Deluxe', purchasePrice: 280000 },
      { name: 'Mặt Nạ Dầu Argan Luxe', sku: 'MAS-001', quantity: 8, unit: 'hộp', minStock: 8, supplier: 'Argan', purchasePrice: 450000 },
      
      // ===== SHAMPOO & CONDITIONER =====
      { name: 'Dầu Gội Bưởi Vijully', sku: 'SHA-001', quantity: 18, unit: 'chai', minStock: 10, supplier: 'Vijully', purchasePrice: 180000 },
      { name: 'Dầu Gội Thảo Dược Phytology', sku: 'SHA-002', quantity: 22, unit: 'chai', minStock: 12, supplier: 'Phytology', purchasePrice: 250000 },
      { name: 'Dầu Xả Mềm Mượt Dove', sku: 'CON-001', quantity: 15, unit: 'chai', minStock: 10, supplier: 'Dove', purchasePrice: 95000 },
      { name: 'Dầu Gội Suốt Kỳ Aestura', sku: 'SHA-003', quantity: 10, unit: 'chai', minStock: 8, supplier: 'Aestura', purchasePrice: 320000 },
      { name: 'Xà Phòng NAM Charcoal', sku: 'SHA-004', quantity: 25, unit: 'chai', minStock: 10, supplier: 'NAM', purchasePrice: 150000 },
      
      // ===== TOOLS & ACCESSORIES =====
      { name: 'Khăn Mặt Bông Trắng', sku: 'KHA-001', quantity: 120, unit: 'cái', minStock: 30, supplier: 'Việt Mỹ', purchasePrice: 15000 },
      { name: 'Lưỡi Dao Cạo Lam', sku: 'DAO-001', quantity: 8, unit: 'hộp', minStock: 15, supplier: 'Gillette', purchasePrice: 45000 },
      { name: 'Kéo Cắt Tóc Chuyên Dụng', sku: 'KEO-001', quantity: 5, unit: 'cái', minStock: 3, supplier: 'Bergsteiger', purchasePrice: 1200000 },
      { name: 'Lược Chải Tóc', sku: 'LUO-001', quantity: 35, unit: 'cái', minStock: 15, supplier: 'KAI', purchasePrice: 85000 },
      { name: 'Khăn Giấy Khô Premium', sku: 'PAP-001', quantity: 3, unit: 'gói', minStock: 10, supplier: 'Unicharm', purchasePrice: 25000 },
      { name: 'Tạo Kiểu Tóc Hair Dryer', sku: 'DRY-001', quantity: 2, unit: 'cái', minStock: 2, supplier: 'Dyson', purchasePrice: 8000000 },
      { name: 'Ủi Tóc Duỗi', sku: 'FLA-001', quantity: 3, unit: 'cái', minStock: 2, supplier: 'Babyliss', purchasePrice: 3500000 },
      { name: 'Lược Massage Đầu', sku: 'MAS-002', quantity: 18, unit: 'cái', minStock: 8, supplier: 'Việt Nam', purchasePrice: 120000 },
      
      // ===== BEARD CARE =====
      { name: 'Dầu Cạo Râu Premium', sku: 'BEA-001', quantity: 10, unit: 'chai', minStock: 5, supplier: 'Proraso', purchasePrice: 280000 },
      { name: 'Balsam Dưỡng Râu', sku: 'BEA-002', quantity: 9, unit: 'hộp', minStock: 5, supplier: 'Morgan', purchasePrice: 350000 },
      { name: 'Bàn Chải Cạo Râu', sku: 'BEA-003', quantity: 12, unit: 'cái', minStock: 8, supplier: 'Art of Shaving', purchasePrice: 450000 },
      
      // ===== COLORING & TREATMENT =====
      { name: 'Thuốc Nhuộm Tóc Schwarzkopf', sku: 'DYE-001', quantity: 6, unit: 'hộp', minStock: 8, supplier: 'Schwarzkopf', purchasePrice: 620000 },
      { name: 'Thuốc Nhuộm Tóc L\'Oreal', sku: 'DYE-002', quantity: 8, unit: 'hộp', minStock: 10, supplier: 'L\'Oreal', purchasePrice: 580000 },
      { name: 'Phục Hồi Tóc Keratin', sku: 'TRE-001', quantity: 2, unit: 'chai', minStock: 5, supplier: 'Keratin Therapy', purchasePrice: 1200000 },
      { name: 'Botox Tóc Orgânico', sku: 'BOT-002', quantity: 3, unit: 'chai', minStock: 3, supplier: 'Orgânico', purchasePrice: 950000 }
    ];

    await Inventory.insertMany(items);
    console.log('[SUCCESS] Tạo ' + items.length + ' vật tư kho hàng (bao gồm cảnh báo stock thấp)');
  } catch (error) {
    console.error('[ERROR] Lỗi seeding kho hàng:', error.message);
  }
};

const seed = async () => {
  try {
    await connectDB();

    console.log('[INFO] ==========================================');
    console.log('[INFO]   BẮT ĐẦU KHỞI TẠO DỮ LIỆU DATABASE');
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
    await seedVouchers();
    await seedMessages();

    console.log('\n[INFO] ==========================================');
    console.log('[SUCCESS] HOÀN THÀNH KHỞI TẠO DỮ LIỆU!');
    console.log('[INFO] ==========================================\n');
    console.log('[INFO] 📱 Tài khoản đăng nhập test:\n');
    console.log('  👤 Admin:     admin@barber.com / Admin@123456');
    console.log('  💇 Barber:    barber.anh@atelier.com / User@123456');
    console.log('  👨 Customer:  customer.huyhoang@gmail.com / User@123456\n');
    console.log('[INFO] Thông tin thêm:');
    console.log('  - 15+ thợ cắt chuyên nghiệp');
    console.log('  - 30+ khách hàng mẫu');
    console.log('  - 35+ dịch vụ/sản phẩm');
    console.log('  - 50+ đặt lịch hẹn');
    console.log('  - 25+ đánh giá 5 sao');
    console.log('  - 30+ thanh toán (cash/transfer/QR/ePay)');
    console.log('  - 30+ vật tư kho hàng');
    console.log('  - 10+ mã khuyến mãi/voucher\n');

    await mongoose.connection.close();
    console.log('[INFO] ✅ Ngắt kết nối MongoDB\n');
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Khởi tạo dữ liệu thất bại:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
