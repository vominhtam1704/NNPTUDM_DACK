const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barber_atelier');
    console.log('Connected');
    const users = await User.find({ avatar: { $ne: null } }).sort({ updatedAt: -1 }).limit(10);
    users.forEach(u => console.log('User:', u.name, 'Avatar:', u.avatar));
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
