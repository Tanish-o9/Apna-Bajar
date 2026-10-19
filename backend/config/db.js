const mongoose = require('mongoose');
const dns = require('dns');

// Reliable default Atlas connection string
const DEFAULT_ATLAS_URI =
  'mongodb+srv://devtinder_user:Tanish%403162@cluster0.mdnl833.mongodb.net/apnicart?retryWrites=true&w=majority';

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
 * Sanitize raw connection URI: removes accidental angle brackets, URL-encodes special chars in password
 */
const sanitizeMongoUri = (rawUri) => {
  if (!rawUri || typeof rawUri !== 'string' || rawUri.trim() === '') {
    return DEFAULT_ATLAS_URI;
  }

  let clean = rawUri.trim();

  // If user pasted angle brackets around password e.g. <Tanish@3162>, extract it
  clean = clean.replace(/<([^>]+)>/g, '$1');

  // Fix unescaped @ in password: split auth and host
  const srvPrefix = clean.includes('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
  const withoutPrefix = clean.replace(/^mongodb(\+srv)?:\/\//, '');
  const lastAt = withoutPrefix.lastIndexOf('@');

  if (lastAt !== -1) {
    const authPart = withoutPrefix.substring(0, lastAt);
    const hostAndPath = withoutPrefix.substring(lastAt + 1);

    const firstColon = authPart.indexOf(':');
    if (firstColon !== -1) {
      const user = authPart.substring(0, firstColon);
      let pass = authPart.substring(firstColon + 1);

      // If password has @ and isn't already encoded as %40
      if (pass.includes('@') && !pass.includes('%40')) {
        pass = encodeURIComponent(pass);
      }
      clean = `${srvPrefix}${user}:${pass}@${hostAndPath}`;
    }
  }

  // Ensure target database name is specified
  if (clean.includes('.mongodb.net/') && clean.endsWith('/')) {
    clean = clean + 'apnicart?retryWrites=true&w=majority';
  } else if (clean.includes('.mongodb.net') && !clean.includes('.mongodb.net/')) {
    clean = clean + '/apnicart?retryWrites=true&w=majority';
  }

  return clean;
};

/**
 * Helper to attempt mongoose connection with reliable public DNS
 */
const performConnect = async (uri, options) => {
  if (uri.includes('.mongodb.net')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {
      // safe ignore in environments where setServers is restricted
    }
  }

  try {
    return await mongoose.connect(uri, options);
  } catch (err) {
    // If SRV lookup fails, ensure Google public DNS is active and retry once
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

  const rawUri = customUri || process.env.MONGODB_URI;
  const finalUri = sanitizeMongoUri(rawUri);
  const isAtlas = finalUri.includes('mongodb+srv://') || finalUri.includes('.mongodb.net');

  // Connection options optimized for serverless & production stability
  const options = {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
    maxPoolSize: isAtlas ? 10 : 5,
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

module.exports = { connectDB, disconnectDB, maskUri, sanitizeMongoUri };
