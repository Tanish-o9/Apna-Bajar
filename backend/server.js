require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { getCategories } = require('./controllers/productController');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Eagerly initiate database connection in background for serverless cold-start
if (process.env.NODE_ENV !== 'test') {
  connectDB().catch((err) => {
    console.warn(`[Database Warning] Cold-start connection initialization deferred: ${err.message}`);
  });
}

// CORS Middleware: Supports credentials without invalid wildcard conflicts in browsers
app.use(
  cors({
    origin: true, // Reflects the request origin dynamically, compliant with credentials: true
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-session-id'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check & Root API Status (Always responsive without DB dependency)
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'ApniCart REST API',
    status: 'online',
    version: '1.0.0',
    documentation: {
      health: '/api/health',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
    },
  });
});

// Normalize URL if a serverless proxy or rewrite passed an internal file path
app.use((req, res, next) => {
  const vercelOriginal =
    req.headers['x-matched-path'] ||
    req.headers['x-forwarded-uri'] ||
    req.headers['x-original-url'] ||
    req.headers['x-invoke-path'];

  if (vercelOriginal && (req.url === '/server.js' || req.url === '/index.js' || req.originalUrl === '/server.js' || req.originalUrl === '/index.js')) {
    req.url = vercelOriginal;
  }
  next();
});

// Health check endpoint reporting database connectivity safely (accessible via /api/health or /health)
const healthHandler = async (req, res) => {
  const readyStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  let isConnected = mongoose.connection && mongoose.connection.readyState === 1;

  // If not currently connected, attempt connection check
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = mongoose.connection.readyState === 1;
    } catch (err) {
      // safe fallback, reported below
    }
  }

  const stateCode = mongoose.connection ? mongoose.connection.readyState : 0;
  const statusString = readyStates[stateCode] || 'unknown';

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'ok' : 'degraded',
    database: {
      status: statusString,
      readyState: stateCode,
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Middleware: Ensure database is connected before handling any data routes
app.use(async (req, res, next) => {
  // Skip DB check for root documentation or health endpoints
  if (req.path === '/' || req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(`[Database Middleware Error] Could not connect to database for ${req.method} ${req.path}: ${error.message}`);
    return res.status(503).json({
      success: false,
      message: 'Database service is currently unavailable. Please verify MongoDB service and network access.',
      error: error.message,
    });
  }
});

// Mount Routes (supporting both /api/* and root /* paths for maximum serverless compatibility)
app.use('/api/products', productRoutes);
app.use('/products', productRoutes);

app.get('/api/categories', getCategories);
app.get('/categories', getCategories);

app.use('/api/orders', orderRoutes);
app.use('/orders', orderRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server if executed directly (e.g. node server.js / npm run dev)
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[Server] ApniCart API server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error(`[Server Error] Startup failed: ${err.message}`);
    });
}

module.exports = app;
module.exports.default = app;

