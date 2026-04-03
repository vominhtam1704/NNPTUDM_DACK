// ============================================
// SERVER.JS - BARBER ATELIER ENTRY POINT
// ============================================
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('[INFO] BARBER ATELIER API RUNNING');
  console.log('[INFO] Server: http://localhost:' + PORT);
  console.log('[INFO] Environment: ' + (process.env.NODE_ENV || 'development'));
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[WARN] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[INFO] Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[ERROR] Uncaught Exception:', err);
  process.exit(1);
});
