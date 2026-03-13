// ====================================
// MongoDB Connection Configuration
// ====================================
import mongoose from 'mongoose';

const DEFAULT_DB_NAME = process.env.MONGO_DB_NAME || 'moviemania';

const buildMongoUriWithDb = (rawUri, dbName) => {
  if (!rawUri) return rawUri;

  const trimmed = rawUri.trim();
  if (!trimmed) return trimmed;

  const [base, query = ''] = trimmed.split('?');

  // If a DB path already exists, keep it as-is.
  const protocolIndex = base.indexOf('://');
  const pathStart = protocolIndex >= 0 ? base.indexOf('/', protocolIndex + 3) : base.indexOf('/');
  const hasDbPath = pathStart >= 0 && base.slice(pathStart + 1).length > 0;
  if (hasDbPath) return trimmed;

  const uriWithDb = `${base}/${dbName}`;
  return query ? `${uriWithDb}?${query}` : uriWithDb;
};

/**
 * Connect to MongoDB database
 * Reads MONGO_URI from environment variables
 */
const connectDB = async () => {
  try {
    const mongoUri = buildMongoUriWithDb(process.env.MONGO_URI, DEFAULT_DB_NAME);
    const conn = await mongoose.connect(mongoUri, {
      dbName: DEFAULT_DB_NAME,
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of hanging
      connectTimeoutMS: 10000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB error: ${err.message}`);
});

export default connectDB;
