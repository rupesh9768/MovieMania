// ====================================
// Express App Configuration
// ====================================
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import healthRoutes from './routes/health.routes.js';
import movieRoutes from './routes/movie.routes.js';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import discussionRoutes from './routes/discussion.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import theaterRoutes from './routes/theater.routes.js';
import cityRoutes from './routes/city.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import chatRoutes from './routes/chat.routes.js';

// Create Express app
const app = express();

// ====================================
// Middleware
// ====================================

// Enable CORS (allow multiple localhost ports during development)
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    // Allow any localhost port during development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    // Allow configured client URL
    if (origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ====================================
// Routes
// ====================================

// Health check
app.use('/api/health', healthRoutes);

// Auth API
app.use('/api/auth', authRoutes);

// Movies API
app.use('/api/movies', movieRoutes);

// Users API (watchlist & favorites)
app.use('/api/users', userRoutes);

// Discussion API (threaded comments)
app.use('/api/discussion', discussionRoutes);

// Bookings API
app.use('/api/bookings', bookingRoutes);

// Payments API (Khalti)
app.use('/api/payments', paymentRoutes);

// Theaters API
app.use('/api/theaters', theaterRoutes);

// Cities API
app.use('/api/cities', cityRoutes);

// Admin analytics API
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Ratings API
app.use('/api/ratings', ratingRoutes);

// Chat API
app.use('/api/chat', chatRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MovieMania API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      movies: '/api/movies',
      users: '/api/users',
      admin: '/api/admin'
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
  console.error(' Error:', err.message);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
