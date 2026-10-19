const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * @desc    Fetch all products with optional filters (category, search, featured, sort)
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res, next) => {
  try {
    const { category, search, featured, sort } = req.query;
    const filter = {};

    // Filter by Category
    if (category && category !== 'All') {
      // BUG B1 (Products API): Inverts category filter with $ne, returning all categories EXCEPT the requested one
      filter.category = { $ne: category.trim() };
    }

    // Filter by Search Keyword (in name or description)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    // Filter by Featured flag
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }

    // Build Query
    let query = Product.find(filter);

    // Apply Sorting
    if (sort === 'price_asc' || sort === 'low_to_high') {
      query = query.sort({ price: 1 });
    } else if (sort === 'price_desc' || sort === 'high_to_low') {
      query = query.sort({ price: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const products = await query.exec();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // BUG B3 (Product ID Validation): Omitted mongoose.Types.ObjectId.isValid check; invalid format triggers unhandled CastError returning 500
    // if (!mongoose.Types.ObjectId.isValid(id)) { ... }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch list of distinct categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    // BUG B2 (Categories API): Maps non-distinct categories across all product records, returning duplicate entries
    const products = await Product.find({}, 'category');
    const categories = products.map((p) => p.category);
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
};
