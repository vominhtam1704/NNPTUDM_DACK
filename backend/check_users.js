const mongoose = require('mongoose');
require('dotenv').config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barber_atelier');
    const User = require('./src/models/User');
    const users = await User.find({}, 'name email role');
    console.log('--- USER LIST (JSON) ---');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkUsers();
