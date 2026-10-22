require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Product = require('../models/Product');

const sampleProducts = [
  // --- Electronics ---
  {
    name: 'SoundBeat Wireless ANC Headphones',
    description: 'Active noise cancellation headphones with 40mm deep-bass drivers and 30-hour battery life.',
    price: 299900, // ₹2,999.00
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    stock: 15,
    featured: true,
  },
  {
    name: 'PulseFit Pro Smartwatch',
    description: '1.43-inch AMOLED display, all-day heart rate & SpO2 tracking, 5ATM water resistance with 100+ sports modes.',
    price: 349900, // ₹3,499.00
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    stock: 12,
    featured: true,
  },
  {
    name: 'Ergonomic Wireless Optical Mouse',
    description: 'Dual-mode Bluetooth and 2.4G wireless mouse with silent clicks and contoured thumb rest for all-day productivity.',
    price: 79900, // ₹799.00
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
    stock: 25,
    featured: false,
  },
  {
    name: 'Mechanical RGB Gaming Keyboard',
    description: 'Tenkeyless compact mechanical keyboard with tactile blue switches, per-key RGB backlighting, and braided cable.',
    price: 249900, // ₹2,499.00
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    stock: 8,
    featured: true,
  },
  {
    name: 'Ultra-Compact 10000mAh Power Bank',
    description: '22.5W fast-charging pocket power bank with dual USB-C Power Delivery and digital battery status indicator.',
    price: 119900, // ₹1,199.00
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=600&q=80',
    stock: 20,
    featured: false,
  },

  // --- Fashion ---
  {
    name: 'Classic Indigo Denim Jacket',
    description: 'Timeless regular-fit trucker jacket crafted from 100% durable cotton denim with button flap pockets.',
    price: 219900, // ₹2,199.00
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
    stock: 10,
    featured: true,
  },
  {
    name: 'Organic Cotton Crewneck T-Shirt',
    description: 'Breathable combed cotton everyday essential tee with reinforced stitching and soft pre-shrunk finish.',
    price: 59900, // ₹599.00
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    stock: 35,
    featured: false,
  },
  {
    name: 'AeroStride Lightweight Running Shoes',
    description: 'Cushioned foam midsole running shoes with engineered mesh upper for maximum ventilation and road grip.',
    price: 189900, // ₹1,899.00
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    stock: 14,
    featured: true,
  },
  {
    name: 'Relaxed Fit Stretch Chino Trousers',
    description: 'Versatile smart-casual chinos made with soft cotton-twill blend and slight stretch for active comfort.',
    price: 129900, // ₹1,299.00
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
    stock: 18,
    featured: false,
  },
  {
    name: 'Cozy Knit Ribbed Beanie',
    description: 'Warm ribbed-knit winter hat made with ultra-soft hypoallergenic yarn, tailored for a snug and stylish fit.',
    price: 44900, // ₹449.00
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=600&q=80',
    stock: 22,
    featured: false,
  },

  // --- Accessories ---
  {
    name: 'Handcrafted Vintage Leather Wallet',
    description: 'Slim bifold wallet made from vegetable-tanned genuine leather featuring RFID blocking shield and 8 card slots.',
    price: 89900, // ₹899.00
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
    stock: 20,
    featured: false,
  },
  {
    name: 'Polarized Aviator Sunglasses',
    description: 'High-definition polarized lenses with UV400 protection encased in lightweight corrosion-resistant metal frame.',
    price: 129900, // ₹1,299.00
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
    stock: 15,
    featured: true,
  },
  {
    name: 'Weatherproof Commuter Backpack',
    description: 'Water-resistant 25L city backpack with padded 15.6-inch laptop compartment and anti-theft hidden pocket.',
    price: 179900, // ₹1,799.00
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    stock: 16,
    featured: false,
  },
  {
    name: 'Minimalist Mesh Stainless Watch',
    description: 'Sleek analog wrist watch featuring Japanese quartz movement, scratch-resistant sapphire crystal and quick-release strap.',
    price: 199900, // ₹1,999.00
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
    stock: 9,
    featured: false,
  },
  {
    name: 'Shockproof Neoprene Laptop Sleeve',
    description: 'Protective 14-15 inch padded sleeve case with plush fleece lining and zippered external accessory pouch.',
    price: 69900, // ₹699.00
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    stock: 28,
    featured: false,
  },

  // --- Home Essentials ---
  {
    name: 'Nordic Wooden LED Desk Lamp',
    description: 'Modern solid wood base study lamp with adjustable flexible arm, 3 color temperatures, and touch dimmer.',
    price: 149900, // ₹1,499.00
    category: 'Home Essentials',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    stock: 11,
    featured: false,
  },
  {
    name: 'Insulated Stainless Steel Flask 750ml',
    description: 'Double-walled vacuum insulated flask keeping beverages iced for 24 hours or piping hot for 12 hours.',
    price: 74900, // ₹749.00
    category: 'Home Essentials',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    stock: 30,
    featured: false,
  },
  {
    name: 'Matte Ceramic Coffee Mug (Set of 2)',
    description: 'Handmade 350ml ceramic coffee mugs with comfortable grip handle, microwave and dishwasher safe.',
    price: 49900, // ₹499.00
    category: 'Home Essentials',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    stock: 24,
    featured: false,
  },
  {
    name: 'Ultrasonic Aromatherapy Diffuser',
    description: 'Whisper-quiet 400ml essential oil mist humidifier with 7 soothing ambient LED mood lights and auto-shutoff.',
    price: 159900, // ₹1,599.00
    category: 'Home Essentials',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    stock: 13,
    featured: false,
  },
  {
    name: 'Velvet Soft Cushion Covers (Pack of 2)',
    description: 'Luxurious 16x16 inch plush velvet throw pillow covers with hidden invisible zipper closure.',
    price: 89900, // ₹899.00
    category: 'Home Essentials',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
    stock: 17,
    featured: false,
  },
];

const seedProducts = async () => {
  try {
    const conn = await connectDB();
    if (!conn) {
      console.error('[Seed Error] Could not connect to MongoDB. Ensure MongoDB is running or MONGODB_URI is valid.');
      process.exit(1);
    }

    console.log('[Seed] Clearing existing product catalog...');
    await Product.deleteMany({});

    console.log(`[Seed] Inserting ${sampleProducts.length} realistic sample products...`);
    const inserted = await Product.insertMany(sampleProducts);

    // Seed default demo user for login testing
    const User = require('../models/User');
    const existingDemo = await User.findOne({ email: 'demo@apnicart.com' });
    if (!existingDemo) {
      await User.create({
        name: 'Demo Shopper',
        email: 'demo@apnicart.com',
        password: 'password123',
        role: 'customer',
      });
      console.log('[Seed] Default demo user created: demo@apnicart.com / password123');
    }

    console.log(`[Seed Success] Successfully seeded ${inserted.length} products into ApniCart!`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

// Execute if run directly from CLI
if (require.main === module) {
  seedProducts();
}

module.exports = { sampleProducts, seedProducts };
