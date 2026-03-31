// ====================================
// Server Entry Point
// ====================================

// Load environment variables FIRST 
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './socket.js';

// Get port from environment
const PORT = process.env.PORT || 5000;

// ====================================
// Start Server
// ====================================
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Create HTTP server and attach Socket.io
    const server = http.createServer(app);
    initSocket(server);
    
    // Start server
    server.listen(PORT, () => {
      console.log('');
      console.log('====================================');
      console.log('    MovieMania Backend Server');
      console.log('====================================');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   URL: http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Socket.io: enabled`);
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
