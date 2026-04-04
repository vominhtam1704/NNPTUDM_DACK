// ============================================
// DATABASE.JS - MONGODB CONNECTION
// ============================================
const mongoose = require('mongoose');

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
