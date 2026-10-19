const mongoose = require('mongoose');
const dns = require('dns');

// Global connection cache across serverless function invocations
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let memoryMongoServer = null;

/**
 * Mask credentials in MongoDB connection string for safe diagnostic logging
 */
const maskUri = (uri) => {
  if (!uri || typeof uri !== 'string') return 'undefined';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
};

/**
 * Helper to attempt mongoose connection with optional DNS fallback
 */
const performConnect = async (uri, options) => {
  try {
    return await mongoose.connect(uri, options);
  } catch (err) {
    // If SRV lookup fails due to local/ISP DNS issues, try setting reliable public DNS and retry once
    if (err.message && (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED'))) {
      try {
        console.warn('[Database] Retrying MongoDB Atlas connection using Google public DNS...');
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        return await mongoose.connect(uri, options);
      } catch (retryErr) {
        throw retryErr;
      }
    }
    throw err;
  }
};

/**
 * Connect to MongoDB instance using Mongoose.
 * Reuses existing connections in serverless environments (e.g. Vercel / AWS Lambda)
 * to prevent connection leaks and buffering timeouts.
 */
const connectDB = async (customUri) => {
  // If already connected, return active connection immediately
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  // If a connection attempt is currently in progress, wait for it
  if (cached.promise && mongoose.connection && mongoose.connection.readyState === 2) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  const targetUri = customUri || process.env.MONGODB_URI;

  // In production / serverless: MONGODB_URI must be provided
  if (!targetUri) {
    if (process.env.NODE_ENV === 'production') {
      const errMessage = 'MONGODB_URI environment variable is not defined in production.';
      console.error(`[Database Error] ${errMessage}`);
      throw new Error(errMessage);
    }
  }

  const finalUri = targetUri || 'mongodb://localhost:27017/apnicart';
  const isAtlas = finalUri.includes('mongodb+srv://') || finalUri.includes('.mongodb.net');

  // Connection options optimized for serverless & production stability
  const options = {
    serverSelectionTimeoutMS: 5000, // Timeout fast after 5s instead of hanging indefinitely
    connectTimeoutMS: 10000,
    maxPoolSize: isAtlas ? 10 : 5, // Suitable pool size for serverless lambdas
  };

  console.log(`[Database] Connecting to MongoDB (${maskUri(finalUri)})...`);

  cached.promise = performConnect(finalUri, options)
    .then((m) => {
      console.log(
        `[Database] MongoDB Connected successfully! Host: ${m.connection.host}, Database: ${m.connection.name}, State: ${m.connection.readyState}`
      );
      cached.conn = m.connection;
      return cached.conn;
    })
    .catch(async (error) => {
      cached.promise = null;
      console.error(`[Database Error] Connection failed: ${error.message}`);

      // In local / development mode only, fallback to in-memory database if external MongoDB is unreachable
      if (process.env.NODE_ENV !== 'production' && !customUri) {
        try {
          console.log('[Database] Starting local in-memory MongoDB fallback for development/testing...');
          const { MongoMemoryServer } = require('mongodb-memory-server');
          if (!memoryMongoServer) {
            memoryMongoServer = await MongoMemoryServer.create();
          }
          const memUri = memoryMongoServer.getUri();

          const memConn = await mongoose.connect(memUri);
          console.log(`[Database] In-memory MongoDB Connected: ${memUri}`);

          // Auto-seed sample products into in-memory instance
          const Product = require('../models/Product');
          const count = await Product.countDocuments();
          if (count === 0) {
            const { sampleProducts } = require('../data/seedProducts');
            await Product.insertMany(sampleProducts);
            console.log(`[Database Auto-Seed] Seeded ${sampleProducts.length} sample products into in-memory database.`);
          }

          cached.conn = memConn.connection;
          return cached.conn;
        } catch (memErr) {
          console.error(`[Database Error] In-memory fallback failed: ${memErr.message}`);
          throw error;
        }
      }

      throw error;
    });

  cached.conn = await cached.promise;
  return cached.conn;
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (memoryMongoServer) {
      await memoryMongoServer.stop();
      memoryMongoServer = null;
    }
    cached.conn = null;
    cached.promise = null;
    console.log('[Database] MongoDB Connection Closed');
  } catch (error) {
    console.error(`[Database Error] Error closing connection: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB, maskUri };
