require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { getCategories } = require('./controllers/productController');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check & Root API Status
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'ApniCart REST API',
    status: 'online',
    version: '1.0.0',
    documentation: {
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
    },
  });
});

// Mount Routes
app.use('/api/products', productRoutes);
app.get('/api/categories', getCategories);
app.use('/api/orders', orderRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server if executed directly
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] ApniCart API server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  });
}

module.exports = app;
