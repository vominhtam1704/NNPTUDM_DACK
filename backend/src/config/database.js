// ============================================
// DATABASE.JS - MONGODB CONNECTION
// ============================================
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/barber_atelier';
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('[SUCCESS] MongoDB connected successfully');
    console.log('[INFO] URI: ' + (uri.split('@')[uri.split('@').length - 1] || 'local'));

    return mongoose;
  } catch (error) {
    console.error('[ERROR] MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Disconnect function
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
};
