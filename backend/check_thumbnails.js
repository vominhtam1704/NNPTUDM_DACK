const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barber_atelier');
    console.log('Connected');
    const products = await Product.find({ thumbnail: { $ne: null } }).limit(5);
    products.forEach(p => console.log('Thumbnail:', p.thumbnail));
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
