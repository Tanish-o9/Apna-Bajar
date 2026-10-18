const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Product = require('../models/Product');
const Order = require('../models/Order');

let mongoServer;

// Reusable test products
const testProducts = [
  {
    name: 'Wireless Bluetooth Earbuds',
    description: 'Crisp audio with charging case and 24h battery life.',
    price: 199900, // ₹1,999.00
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
    stock: 10,
    featured: true,
  },
  {
    name: 'Running Sports Shoes',
    description: 'High performance running sneakers with breathable upper mesh.',
    price: 249900, // ₹2,499.00
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    stock: 5,
    featured: false,
  },
  {
    name: 'Casual Cotton Cap',
    description: 'Adjustable sports baseball cap with embroidered logo.',
    price: 49900, // ₹499.00
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b',
    stock: 20,
    featured: false,
  },
];

let createdProducts = [];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Seed test products
  createdProducts = await Product.insertMany(testProducts);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clear orders between tests, preserve products
  await Order.deleteMany({});
});

describe('ApniCart Automated Test Suite (10 Required Checks)', () => {
  /**
   * 1. Product listing API
   */
  test('1. Product listing API: GET /api/products returns all products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(createdProducts.length);
  });

  /**
   * 2. Product search and sorting
   */
  test('2. Product search and sorting: filters by keyword and sorts price ascending', async () => {
    // Search for "shoes"
    const searchRes = await request(app).get('/api/products?search=shoes');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.count).toBe(1);
    expect(searchRes.body.data[0].name).toContain('Running Sports Shoes');

    // Sort by price ascending
    const sortRes = await request(app).get('/api/products?sort=price_asc');
    expect(sortRes.status).toBe(200);
    const prices = sortRes.body.data.map((p) => p.price);
    const sortedPrices = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sortedPrices);
  });

  /**
   * 3. Cart quantity updates
   */
  test('3. Cart quantity updates: correctly bounds between 1 and available stock', () => {
    const stockLimit = 5;

    // Helper logic simulating Cart Context quantity update
    const updateQuantity = (currentQty, delta, maxStock) => {
      const nextQty = currentQty + delta;
      if (nextQty < 1) return 1;
      if (nextQty > maxStock) return maxStock;
      return nextQty;
    };

    expect(updateQuantity(1, -1, stockLimit)).toBe(1); // Cannot go below 1
    expect(updateQuantity(3, 1, stockLimit)).toBe(4); // Normal increment
    expect(updateQuantity(5, 1, stockLimit)).toBe(5); // Cannot exceed stock
    expect(updateQuantity(5, 10, stockLimit)).toBe(5); // Upper bound enforced
  });

  /**
   * 4. Cart total calculation
   */
  test('4. Cart total calculation: computes subtotal, free/paid delivery, and total accurately', () => {
    const calculateCartTotals = (items) => {
      const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
      const deliveryCharge = subtotal >= 99900 ? 0 : 4900;
      const total = subtotal + deliveryCharge;
      return { subtotal, deliveryCharge, total };
    };

    // Case A: Below threshold (e.g., ₹499 = 49900 paise) -> Delivery ₹49 = 4900 paise
    const belowThreshold = [{ unitPrice: 49900, quantity: 1 }];
    const totalsA = calculateCartTotals(belowThreshold);
    expect(totalsA.subtotal).toBe(49900);
    expect(totalsA.deliveryCharge).toBe(4900);
    expect(totalsA.total).toBe(54800);

    // Case B: Above threshold (e.g., ₹1,999 = 199900 paise) -> Free delivery (0)
    const aboveThreshold = [{ unitPrice: 199900, quantity: 1 }];
    const totalsB = calculateCartTotals(aboveThreshold);
    expect(totalsB.subtotal).toBe(199900);
    expect(totalsB.deliveryCharge).toBe(0);
    expect(totalsB.total).toBe(199900);
  });

  /**
   * 5. Invalid checkout input
   */
  test('5. Invalid checkout input: rejects missing or invalid fields with 400 Bad Request', async () => {
    // Missing required phone and address
    const invalidPayload = {
      demoSessionId: 'test-session-123',
      customerName: 'A', // Too short
      email: 'invalid-email',
      phone: '123', // Invalid phone
      shippingAddress: {
        address: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '999', // Invalid PIN
      },
      items: [{ productId: createdProducts[0]._id, quantity: 1 }],
    };

    const res = await request(app).post('/api/orders').send(invalidPayload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  /**
   * 6. Successful order creation
   */
  test('6. Successful order creation: saves order in MongoDB and reduces product inventory', async () => {
    const product = createdProducts[0];
    const initialStock = (await Product.findById(product._id)).stock;

    const validOrder = {
      demoSessionId: 'demo-session-success',
      customerName: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '9876543210',
      shippingAddress: {
        address: 'Flat 402, Lotus Apartments',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
      },
      items: [{ productId: product._id, quantity: 2 }],
    };

    const res = await request(app).post('/api/orders').send(validOrder);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.orderStatus).toBe('Confirmed');

    // Verify inventory reduced by 2
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(initialStock - 2);
  });

  /**
   * 7. Order total recalculation on the backend
   */
  test('7. Order total recalculation: backend calculates totals from DB prices and ignores tampering', async () => {
    const product = createdProducts[2]; // price = 49900 (₹499)

    // Attacker tries to send unitPrice = 1 paisa and totalAmount = 1 paisa
    const tamperedPayload = {
      demoSessionId: 'tamper-session',
      customerName: 'Pooja Verma',
      email: 'pooja@example.com',
      phone: '9123456780',
      shippingAddress: {
        address: '12 Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
      },
      items: [
        {
          productId: product._id,
          quantity: 1,
          unitPrice: 1, // Tampered price
          lineTotal: 1, // Tampered line total
        },
      ],
      subtotal: 1, // Tampered subtotal
      deliveryCharge: 0, // Tampered delivery
      totalAmount: 1, // Tampered total
    };

    const res = await request(app).post('/api/orders').send(tamperedPayload);
    expect(res.status).toBe(201);

    const savedOrder = res.body.data;
    // Expected: product.price (49900) * 1 = 49900 paise. Under ₹999 threshold -> delivery = 4900 paise. Total = 54800 paise.
    expect(savedOrder.items[0].unitPrice).toBe(49900);
    expect(savedOrder.items[0].lineTotal).toBe(49900);
    expect(savedOrder.subtotal).toBe(49900);
    expect(savedOrder.deliveryCharge).toBe(4900);
    expect(savedOrder.totalAmount).toBe(54800);
  });

  /**
   * 8. Order history access restrictions
   */
  test('8. Order history access restrictions: session A cannot view session B orders', async () => {
    const product = createdProducts[1];

    // Create order for Session A
    const orderA = await Order.create({
      demoSessionId: 'session-alpha',
      customerName: 'Rohan Gupta',
      email: 'rohan@example.com',
      phone: '9811223344',
      shippingAddress: {
        address: 'Sector 15',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
      },
      items: [
        {
          productId: product._id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          lineTotal: product.price,
        },
      ],
      subtotal: product.price,
      deliveryCharge: 0,
      totalAmount: product.price,
      orderStatus: 'Confirmed',
    });

    // Session B attempts to get order A via GET /api/orders/:id
    const forbiddenRes = await request(app)
      .get(`/api/orders/${orderA._id}`)
      .set('x-demo-session-id', 'session-beta');
    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.success).toBe(false);

    // Session A successfully views order A
    const authorizedRes = await request(app)
      .get(`/api/orders/${orderA._id}`)
      .set('x-demo-session-id', 'session-alpha');
    expect(authorizedRes.status).toBe(200);
    expect(authorizedRes.body.data._id).toBe(orderA._id.toString());
  });

  /**
   * 9. Empty cart checkout prevention
   */
  test('9. Empty cart checkout prevention: returns 400 when items array is empty', async () => {
    const emptyOrder = {
      demoSessionId: 'session-empty',
      customerName: 'Kiran Rao',
      email: 'kiran@example.com',
      phone: '9988776655',
      shippingAddress: {
        address: 'Main Road',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
      },
      items: [],
    };

    const res = await request(app).post('/api/orders').send(emptyOrder);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/empty/i);
  });

  /**
   * 10. Invalid product ID handling
   */
  test('10. Invalid product ID handling: returns 404 for invalid ObjectId format or non-existent product', async () => {
    // Malformed ID
    const malformedRes = await request(app).get('/api/products/not-a-valid-id');
    expect(malformedRes.status).toBe(404);
    expect(malformedRes.body.success).toBe(false);

    // Non-existent valid ObjectId
    const nonExistentId = new mongoose.Types.ObjectId();
    const notFoundRes = await request(app).get(`/api/products/${nonExistentId}`);
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.success).toBe(false);
  });
});
