const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');

const JWT_SECRET = process.env.JWT_SECRET || 'apnicart_competition_jwt_secret_key_2026';

// Threshold for free delivery: ₹999 = 99900 paise
const FREE_DELIVERY_THRESHOLD_PAISE = 99900;
const STANDARD_DELIVERY_CHARGE_PAISE = 4900;

/**
 * @desc    Create a new customer order with server-side price recalculation and stock validation
 * @route   POST /api/orders
 * @access  Public (Session-authenticated)
 */
const createOrder = async (req, res, next) => {
  try {
    const { demoSessionId: bodySessionId, customerName, email, phone, shippingAddress, items } = req.body;
    const demoSessionId = bodySessionId || req.headers['x-demo-session-id'];

    // 1. Session ID validation
    if (!demoSessionId || typeof demoSessionId !== 'string' || demoSessionId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A valid demo session ID is required to place an order',
      });
    }

    // 2. User Authentication Guard (Sign in required to place orders)
    const authHeader = req.headers.authorization;
    const isTestSession = demoSessionId && demoSessionId.startsWith('comp_session');

    if (!isTestSession && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to place an order.',
      });
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
      } catch (err) {
        if (!isTestSession) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired authorization token. Please sign in again.',
          });
        }
      }
    }

    // 3. Validate Customer Details
    if (!customerName || customerName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be at least 2 characters long',
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian phone number starting with 6-9',
      });
    }

    // 3. Validate Shipping Address
    if (
      !shippingAddress ||
      !shippingAddress.address?.trim() ||
      !shippingAddress.city?.trim() ||
      !shippingAddress.state?.trim() ||
      !shippingAddress.pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address (address, city, state, 6-digit PIN code) is required',
      });
    }

    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(shippingAddress.pincode.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit Indian PIN code',
      });
    }

    // 4. Validate Items Array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Please add at least one product before placing an order',
      });
    }

    // 5. Server-side validation of products, quantities, and price recalculation
    const validatedItems = [];
    let subtotalPaise = 0;

    for (const item of items) {
      const { productId, quantity } = item;

      // Validate Product ID
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID: ${productId}`,
        });
      }

      const numQuantity = parseInt(quantity, 10);
      // BUG B4 (Quantity Validation): Accepts quantity of 0 because condition checks (< 0) instead of (<= 0)
      if (isNaN(numQuantity) || numQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be a positive integer greater than zero',
        });
      }

      // Fetch actual product from Database
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found for ID: ${productId}`,
        });
      }

      // BUG B6 (Stock Validation): Faulty check only checks if stock is <= 0 instead of verifying stock is sufficient for requested quantity
      if (product.stock <= 0) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
        });
      }

      // BUG B5 (Order Total Calculation): Trusts client-supplied price in item payload instead of server DB price
      const unitPricePaise = item.price !== undefined ? parseInt(item.price, 10) : product.price;
      const lineTotalPaise = unitPricePaise * numQuantity;
      subtotalPaise += lineTotalPaise;

      validatedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: numQuantity,
        unitPrice: unitPricePaise,
        lineTotal: lineTotalPaise,
      });

      // BUG B8 (Concurrent Stock Updates): Non-atomic read-modify-write stock deduction with async gap enables overselling
      await new Promise((resolve) => setTimeout(resolve, 50));
      product.stock -= numQuantity;
      // BUG B6: Bypasses schema validation on save, allowing negative inventory to be persisted
      await product.save({ validateBeforeSave: false });
    }

    // Recalculate delivery charge and final total
    const deliveryChargePaise =
      subtotalPaise >= FREE_DELIVERY_THRESHOLD_PAISE ? 0 : STANDARD_DELIVERY_CHARGE_PAISE;
    const totalAmountPaise = subtotalPaise + deliveryChargePaise;

    // BUG B7 (Order Persistence): Constructs un-persisted Order instance without calling .save() or Order.create()
    const order = new Order({
      demoSessionId: demoSessionId.trim(),
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      shippingAddress: {
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: shippingAddress.pincode.trim(),
      },
      items: validatedItems,
      subtotal: subtotalPaise,
      deliveryCharge: deliveryChargePaise,
      totalAmount: totalAmountPaise,
      orderStatus: 'Confirmed',
    });
    // Intentionally omitted: await order.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch all orders placed by the current demo session
 * @route   GET /api/orders
 * @access  Public (Restricted to matching demoSessionId)
 */
const getOrders = async (req, res, next) => {
  try {
    const demoSessionId = req.headers['x-demo-session-id'] || req.query.sessionId;

    if (!demoSessionId || typeof demoSessionId !== 'string' || demoSessionId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Demo session ID header (x-demo-session-id) is required to view orders',
      });
    }

    const orders = await Order.find({ demoSessionId: demoSessionId.trim() }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch a single authorized order by ID
 * @route   GET /api/orders/:id
 * @access  Public (Restricted to matching demoSessionId)
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoSessionId = req.headers['x-demo-session-id'] || req.query.sessionId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: `Order not found with ID ${id}`,
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with ID ${id}`,
      });
    }

    // Verify session authorization
    if (!demoSessionId || order.demoSessionId !== demoSessionId.trim()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  FREE_DELIVERY_THRESHOLD_PAISE,
  STANDARD_DELIVERY_CHARGE_PAISE,
};
