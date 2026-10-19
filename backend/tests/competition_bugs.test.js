const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Product = require('../models/Product');
const Order = require('../models/Order');

let mongoServer;
let seedProducts = [];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Seed sample products for bug testing
  seedProducts = await Product.insertMany([
    {
      name: 'Wireless Bluetooth Earbuds',
      description: 'Crisp audio with charging case and 24h battery life.',
      price: 199900, // ₹1,999
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
      stock: 5,
      featured: true,
    },
    {
      name: 'Classic Oxford Shirt',
      description: 'Tailored cotton shirt for casual and formal occasions.',
      price: 149900, // ₹1,499
      category: 'Fashion',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      stock: 15,
      featured: false,
    },
    {
      name: 'Slim Leather Wallet',
      description: 'Bifold genuine leather wallet with RFID blocking.',
      price: 79900, // ₹799
      category: 'Accessories',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b',
      stock: 20,
      featured: false,
    },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Order.deleteMany({});
  // Reset product stocks
  await Product.updateOne({ _id: seedProducts[0]._id }, { stock: 5 });
  await Product.updateOne({ _id: seedProducts[1]._id }, { stock: 15 });
  await Product.updateOne({ _id: seedProducts[2]._id }, { stock: 20 });
});

describe('Competition Injected Bug Manifest Verification (B1 – B8)', () => {
  // Operational Baseline: Health check remains functional
  test('Sanity Check: API health check remains fully operational', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  // Bug B1 Verification
  test('B1 Verification: Category filter inverts and excludes requested category', async () => {
    const res = await request(app).get('/api/products?category=Electronics');
    expect(res.status).toBe(200);
    // Inverted bug: All returned products are NOT Electronics
    expect(res.body.data.every((p) => p.category !== 'Electronics')).toBe(true);
  });

  // Bug B2 Verification
  test('B2 Verification: Categories API returns non-distinct categories with duplicates', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    // Injected bug maps all products, returning count equal to total products count
    expect(res.body.data.length).toBe(seedProducts.length);
  });

  // Bug B3 Verification
  test('B3 Verification: Invalid ObjectId triggers HTTP 500 error instead of 404', async () => {
    const res = await request(app).get('/api/products/not-a-valid-object-id');
    // Injected bug causes CastError to return 500
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  // Bug B4 Verification
  test('B4 Verification: Order creation accepts quantity 0', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        demoSessionId: 'comp_session_b4',
        customerName: 'Competition Tester',
        email: 'tester@competition.com',
        phone: '9876543210',
        shippingAddress: {
          address: '404 Bug Hunt Way',
          city: 'Tech City',
          state: 'Karnataka',
          pincode: '560001',
        },
        items: [{ productId: seedProducts[0]._id.toString(), quantity: 0 }],
      });
    // Injected bug allows quantity 0 to succeed
    expect(res.status).toBe(201);
    expect(res.body.data.items[0].quantity).toBe(0);
  });

  // Bug B5 Verification
  test('B5 Verification: Order creation trusts client-provided item price', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        demoSessionId: 'comp_session_b5',
        customerName: 'Tamper Tester',
        email: 'tamper@competition.com',
        phone: '9876543210',
        shippingAddress: {
          address: '404 Exploit Ave',
          city: 'Tech City',
          state: 'Delhi',
          pincode: '110001',
        },
        items: [{ productId: seedProducts[0]._id.toString(), quantity: 1, price: 100 }], // ₹1 instead of ₹1,999
      });
    // Injected bug trusts price: 100 paise
    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(100);
  });

  // Bug B6 Verification
  test('B6 Verification: Order creation allows quantities exceeding available stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        demoSessionId: 'comp_session_b6',
        customerName: 'Stock Overseller',
        email: 'oversell@competition.com',
        phone: '9876543210',
        shippingAddress: {
          address: '100 Overflow Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
        items: [{ productId: seedProducts[0]._id.toString(), quantity: 50 }], // Stock is only 5
      });
    // Injected bug passes stock check (since 5 > 0)
    expect(res.status).toBe(201);
    const updatedProd = await Product.findById(seedProducts[0]._id);
    expect(updatedProd.stock).toBeLessThan(0); // 5 - 50 = -45
  });

  // Bug B7 Verification
  test('B7 Verification: Order reports 201 Created but fails to persist in database', async () => {
    const sessionId = 'comp_session_b7';
    const postRes = await request(app)
      .post('/api/orders')
      .send({
        demoSessionId: sessionId,
        customerName: 'Ghost Orderer',
        email: 'ghost@competition.com',
        phone: '9876543210',
        shippingAddress: {
          address: '777 Phantom St',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
        },
        items: [{ productId: seedProducts[1]._id.toString(), quantity: 1 }],
      });
    expect(postRes.status).toBe(201);

    // Verify order was NOT persisted
    const getRes = await request(app).get('/api/orders').set('x-demo-session-id', sessionId);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBe(0); // Order does not exist in DB
  });

  // Bug B8 Verification
  test('B8 Verification: Concurrent orders allow inventory overselling', async () => {
    // Product has stock = 5. Fire two concurrent orders for 4 units each (total 8 units)
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/orders')
        .send({
          demoSessionId: 'sess_race_1',
          customerName: 'Buyer 1',
          email: 'b1@race.com',
          phone: '9876543210',
          shippingAddress: { address: 'A', city: 'B', state: 'C', pincode: '110001' },
          items: [{ productId: seedProducts[0]._id.toString(), quantity: 4 }],
        }),
      request(app)
        .post('/api/orders')
        .send({
          demoSessionId: 'sess_race_2',
          customerName: 'Buyer 2',
          email: 'b2@race.com',
          phone: '9876543210',
          shippingAddress: { address: 'A', city: 'B', state: 'C', pincode: '110001' },
          items: [{ productId: seedProducts[0]._id.toString(), quantity: 4 }],
        }),
    ]);

    // Injected bug allows both concurrent orders to pass
    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);
  });
});
