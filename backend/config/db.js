const mongoose = require('mongoose');

let memoryMongoServer = null;

/**
 * Connect to MongoDB instance using Mongoose.
 * If local MongoDB is not running, falls back automatically to an in-memory MongoDB instance
 * in development mode so the app runs without external configuration.
 */
const connectDB = async (customUri) => {
  const targetUri = customUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/apnicart';

  try {
    // Attempt connecting to specified URI
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] Notice: Could not connect to MongoDB at "${targetUri}" (${error.message}).`);

    // In dev / local mode, start in-memory MongoDB fallback
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Starting local in-memory MongoDB instance for development...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryMongoServer = await MongoMemoryServer.create();
        const memUri = memoryMongoServer.getUri();

        const conn = await mongoose.connect(memUri);
        console.log(`[Database] In-memory MongoDB Connected successfully: ${memUri}`);

        // Automatically auto-seed sample products into the in-memory database if empty
        const Product = require('../models/Product');
        const count = await Product.countDocuments();
        if (count === 0) {
          const { sampleProducts } = require('../data/seedProducts');
          await Product.insertMany(sampleProducts);
          console.log(`[Database Auto-Seed] Seeded ${sampleProducts.length} sample products into in-memory database.`);
        }

        return conn;
      } catch (memError) {
        console.error(`[Database Error] In-memory MongoDB failed to start: ${memError.message}`);
        return null;
      }
    }

    return null;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryMongoServer) {
      await memoryMongoServer.stop();
      memoryMongoServer = null;
    }
    console.log('[Database] MongoDB Connection Closed');
  } catch (error) {
    console.error(`[Database Error] Error closing connection: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
