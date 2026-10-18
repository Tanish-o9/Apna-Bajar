const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getCategories,
} = require('../controllers/productController');

// Route for fetching distinct product categories
router.get('/categories', getCategories);

// Routes for products listing and single product lookup
router.get('/', getProducts);
router.get('/:id', getProductById);

module.exports = router;
