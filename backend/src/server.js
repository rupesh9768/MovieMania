// ====================================
// Server Entry Point
// ====================================

// Load environment variables FIRST 
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';

// Get port from environment
const PORT = process.env.PORT || 5000;

// ====================================
// Start Server
// ====================================
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('====================================');
      console.log('    MovieMania Backend Server');
      console.log('====================================');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   URL: http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log('====================================');
      console.log('');
    });
  } catch (error) {
    console.error(' Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(' Unhandled Rejection:', err.message);
  process.exit(1);
});

// Start the server
startServer();
