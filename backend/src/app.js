// ====================================
// Express App Configuration
// ====================================
import express from 'express';
import cors from 'cors';

// Import routes
import healthRoutes from './routes/health.routes.js';
import movieRoutes from './routes/movie.routes.js';

// Create Express app
const app = express();

// ====================================
// Middleware
// ====================================

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// ====================================
// Routes
// ====================================

// Health check
app.use('/api/health', healthRoutes);

// Movies API
app.use('/api/movies', movieRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MovieMania API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      movies: '/api/movies'
    }
  });
});

// ====================================
// 404 Handler
// ====================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// ====================================
// Error Handler
// ====================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
