const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Reservation = require('./src/models/Reservation');
const User = require('./src/models/User');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barber_atelier');
    console.log('Connected');
    console.log('Products:', await Product.countDocuments());
    console.log('Categories:', await Category.countDocuments());
    console.log('Reservations:', await Reservation.countDocuments());
    console.log('Users:', await User.countDocuments());
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
