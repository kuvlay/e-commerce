// SEED SCRIPT FOR KHARIDO E-COMMERCE
// Usage: node seed.js (after setting up .env and installing dependencies)
// Make sure MongoDB is running and .env is configured

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import productModel from './models/productModel.js';
import userModel from './models/userModel.js';
import orderModel from './models/orderModel.js';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI + '/ecommerce_kharido';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const users = [
  { name: 'Demo User', email: 'demo@example.com', password: 'password123', cartData: {} },
  { name: 'Test User', email: 'test@example.com', password: 'password123', cartData: {} },
  { name: 'Alice Smith', email: 'alice@example.com', password: 'password123', cartData: {} },
  { name: 'Bob Johnson', email: 'bob@example.com', password: 'password123', cartData: {} },
  { name: 'Charlie Lee', email: 'charlie@example.com', password: 'password123', cartData: {} },
  { name: 'Diana Prince', email: 'diana@example.com', password: 'password123', cartData: {} },
  { name: 'Ethan Hunt', email: 'ethan@example.com', password: 'password123', cartData: {} },
  { name: 'Fiona Glenanne', email: 'fiona@example.com', password: 'password123', cartData: {} },
  { name: 'George Miller', email: 'george@example.com', password: 'password123', cartData: {} },
  { name: 'Hannah Brown', email: 'hannah@example.com', password: 'password123', cartData: {} },
];

const now = () => Date.now();

// Demo image URLs to download and upload to Cloudinary - diverse categories
const demoImageUrls = [
  // Electronics
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80',
  // Food & Beverages
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80',
  // Home & Garden
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80',
  // Books & Stationery
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
  // Clothing
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80',
  // Sports & Fitness
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
  // Beauty & Personal Care
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
  // General products
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'
];

async function downloadImage(url, path) {
  const response = await axios({ url, responseType: 'stream', method: 'GET' });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(path);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function uploadDemoImagesToCloudinary() {
  const localPaths = [];
  const cloudinaryUrls = [];
  // Download images to temp folder
  if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');
  for (let i = 0; i < demoImageUrls.length; i++) {
    const localPath = `tmp/demo${i}.jpg`;
    await downloadImage(demoImageUrls[i], localPath);
    localPaths.push(localPath);
  }
  // Upload to Cloudinary
  for (let i = 0; i < localPaths.length; i++) {
    try {
      const result = await cloudinary.uploader.upload(localPaths[i], { folder: 'kharido_demo_seed' });
      cloudinaryUrls.push(result.secure_url);
    } catch (e) {
      console.error('Cloudinary upload failed:', e.message);
      cloudinaryUrls.push('https://via.placeholder.com/150?text=Cloudinary+Fail');
    }
  }
  // Clean up local files
  for (const path of localPaths) {
    fs.unlinkSync(path);
  }
  return cloudinaryUrls;
}

const productTemplates = [
  // ELECTRONICS - Weight based
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life.',
    price: 2999,
    category: 'Electronics',
    subCategory: 'Audio',
    measurementType: 'weight',
    measurements: [
      { value: '250g', label: 'Standard (250g)', priceModifier: 0 },
      { value: '180g', label: 'Lightweight (180g)', priceModifier: 500 }
    ],
    bestSeller: true
  },
  {
    name: 'Smartphone Power Bank',
    description: 'Fast-charging portable power bank with LED display.',
    price: 1499,
    category: 'Electronics',
    subCategory: 'Accessories',
    measurementType: 'weight',
    measurements: [
      { value: '10000mAh', label: '10000mAh (300g)', priceModifier: 0 },
      { value: '20000mAh', label: '20000mAh (450g)', priceModifier: 800 },
      { value: '30000mAh', label: '30000mAh (600g)', priceModifier: 1500 }
    ],
    bestSeller: false
  },

  // FOOD & BEVERAGES - Weight/Volume based
  {
    name: 'Premium Coffee Beans',
    description: 'Freshly roasted arabica coffee beans from Colombian highlands.',
    price: 899,
    category: 'Food',
    subCategory: 'Beverages',
    measurementType: 'weight',
    measurements: [
      { value: '250g', label: '250g Pack', priceModifier: 0 },
      { value: '500g', label: '500g Pack', priceModifier: 600 },
      { value: '1kg', label: '1kg Pack', priceModifier: 1000 }
    ],
    bestSeller: true
  },
  {
    name: 'Organic Honey',
    description: 'Pure organic wildflower honey, unprocessed and natural.',
    price: 599,
    category: 'Food',
    subCategory: 'Organic',
    measurementType: 'volume',
    measurements: [
      { value: '250ml', label: '250ml Jar', priceModifier: 0 },
      { value: '500ml', label: '500ml Jar', priceModifier: 400 },
      { value: '1L', label: '1 Liter Jar', priceModifier: 700 }
    ],
    bestSeller: false
  },
  {
    name: 'Artisan Dark Chocolate',
    description: '85% cocoa dark chocolate with sea salt crystals.',
    price: 299,
    category: 'Food',
    subCategory: 'Confectionery',
    measurementType: 'weight',
    measurements: [
      { value: '100g', label: '100g Bar', priceModifier: 0 },
      { value: '200g', label: '200g Bar', priceModifier: 250 }
    ],
    bestSeller: true
  },

  // HOME & GARDEN - Length/Quantity based
  {
    name: 'LED Strip Lights',
    description: 'RGB color-changing LED strips with remote control.',
    price: 1299,
    category: 'Home',
    subCategory: 'Lighting',
    measurementType: 'length',
    measurements: [
      { value: '5m', label: '5 Meter Strip', priceModifier: 0 },
      { value: '10m', label: '10 Meter Strip', priceModifier: 800 },
      { value: '15m', label: '15 Meter Strip', priceModifier: 1500 }
    ],
    bestSeller: false
  },
  {
    name: 'Ceramic Plant Pots',
    description: 'Handcrafted ceramic pots with drainage holes.',
    price: 399,
    category: 'Home',
    subCategory: 'Garden',
    measurementType: 'quantity',
    measurements: [
      { value: '1 piece', label: 'Single Pot', priceModifier: 0 },
      { value: '3 pieces', label: 'Set of 3', priceModifier: 600 },
      { value: '6 pieces', label: 'Set of 6', priceModifier: 1000 }
    ],
    bestSeller: true
  },

  // BOOKS & STATIONERY - Quantity based
  {
    name: 'Premium Notebooks',
    description: 'Leather-bound notebooks with dotted pages.',
    price: 599,
    category: 'Books',
    subCategory: 'Stationery',
    measurementType: 'quantity',
    measurements: [
      { value: '1 piece', label: 'Single Notebook', priceModifier: 0 },
      { value: '3 pieces', label: 'Pack of 3', priceModifier: 800 },
      { value: '5 pieces', label: 'Pack of 5', priceModifier: 1200 }
    ],
    bestSeller: false
  },

  // CLOTHING - Keep some size-based for variety
  {
    name: 'Unisex Cotton T-Shirt',
    description: 'Soft organic cotton t-shirt in minimalist design.',
    price: 799,
    category: 'Clothing',
    subCategory: 'Casual',
    measurementType: 'size',
    measurements: [
      { value: 'S', label: 'Small', priceModifier: 0 },
      { value: 'M', label: 'Medium', priceModifier: 0 },
      { value: 'L', label: 'Large', priceModifier: 0 },
      { value: 'XL', label: 'Extra Large', priceModifier: 100 }
    ],
    bestSeller: true
  },
  {
    name: 'Denim Jeans',
    description: 'Classic straight-fit denim jeans with vintage wash.',
    price: 1999,
    category: 'Clothing',
    subCategory: 'Bottomwear',
    measurementType: 'size',
    measurements: [
      { value: '28', label: 'Waist 28"', priceModifier: 0 },
      { value: '30', label: 'Waist 30"', priceModifier: 0 },
      { value: '32', label: 'Waist 32"', priceModifier: 0 },
      { value: '34', label: 'Waist 34"', priceModifier: 0 },
      { value: '36', label: 'Waist 36"', priceModifier: 100 }
    ],
    bestSeller: false
  },

  // SPORTS & FITNESS - Weight based
  {
    name: 'Adjustable Dumbbells',
    description: 'Space-saving adjustable dumbbells for home workouts.',
    price: 4999,
    category: 'Sports',
    subCategory: 'Fitness',
    measurementType: 'weight',
    measurements: [
      { value: '5kg', label: '5kg Set', priceModifier: 0 },
      { value: '10kg', label: '10kg Set', priceModifier: 2000 },
      { value: '20kg', label: '20kg Set', priceModifier: 4000 }
    ],
    bestSeller: true
  },
  {
    name: 'Yoga Mat',
    description: 'Non-slip eco-friendly yoga mat with carrying strap.',
    price: 1299,
    category: 'Sports',
    subCategory: 'Yoga',
    measurementType: 'size',
    measurements: [
      { value: '4mm', label: '4mm Thickness', priceModifier: 0 },
      { value: '6mm', label: '6mm Thickness', priceModifier: 300 },
      { value: '8mm', label: '8mm Thickness', priceModifier: 600 }
    ],
    bestSeller: false
  },

  // BEAUTY & PERSONAL CARE - Volume based
  {
    name: 'Organic Face Serum',
    description: 'Anti-aging serum with vitamin C and hyaluronic acid.',
    price: 1899,
    category: 'Beauty',
    subCategory: 'Skincare',
    measurementType: 'volume',
    measurements: [
      { value: '30ml', label: '30ml Bottle', priceModifier: 0 },
      { value: '50ml', label: '50ml Bottle', priceModifier: 800 }
    ],
    bestSeller: true
  },
  {
    name: 'Natural Shampoo',
    description: 'Sulfate-free shampoo with argan oil and keratin.',
    price: 899,
    category: 'Beauty',
    subCategory: 'Hair Care',
    measurementType: 'volume',
    measurements: [
      { value: '250ml', label: '250ml Bottle', priceModifier: 0 },
      { value: '500ml', label: '500ml Bottle', priceModifier: 600 },
      { value: '1L', label: '1 Liter Bottle', priceModifier: 1000 }
    ],
    bestSeller: false
  },

  // TOYS & GAMES - Quantity based
  {
    name: 'Building Blocks Set',
    description: 'Educational building blocks for creative play.',
    price: 1599,
    category: 'Toys',
    subCategory: 'Educational',
    measurementType: 'quantity',
    measurements: [
      { value: '100 pieces', label: '100 Piece Set', priceModifier: 0 },
      { value: '200 pieces', label: '200 Piece Set', priceModifier: 800 },
      { value: '500 pieces', label: '500 Piece Set', priceModifier: 2000 }
    ],
    bestSeller: true
  },

  // AUTOMOTIVE - Volume/Weight based
  {
    name: 'Car Engine Oil',
    description: 'Synthetic motor oil for high-performance engines.',
    price: 2499,
    category: 'Automotive',
    subCategory: 'Maintenance',
    measurementType: 'volume',
    measurements: [
      { value: '1L', label: '1 Liter', priceModifier: 0 },
      { value: '4L', label: '4 Liter', priceModifier: 1500 },
      { value: '5L', label: '5 Liter', priceModifier: 2000 }
    ],
    bestSeller: false
  },

  // PET SUPPLIES - Weight based
  {
    name: 'Premium Dog Food',
    description: 'Grain-free dry dog food with real chicken.',
    price: 1299,
    category: 'Pets',
    subCategory: 'Food',
    measurementType: 'weight',
    measurements: [
      { value: '2kg', label: '2kg Bag', priceModifier: 0 },
      { value: '5kg', label: '5kg Bag', priceModifier: 1500 },
      { value: '10kg', label: '10kg Bag', priceModifier: 2500 }
    ],
    bestSeller: true
  },

  // OFFICE SUPPLIES - Quantity based
  {
    name: 'Ballpoint Pens',
    description: 'Smooth-writing ballpoint pens in assorted colors.',
    price: 199,
    category: 'Office',
    subCategory: 'Writing',
    measurementType: 'quantity',
    measurements: [
      { value: '5 pieces', label: 'Pack of 5', priceModifier: 0 },
      { value: '10 pieces', label: 'Pack of 10', priceModifier: 150 },
      { value: '20 pieces', label: 'Pack of 20', priceModifier: 250 }
    ],
    bestSeller: false
  },

  // JEWELRY - Size based
  {
    name: 'Silver Chain Necklace',
    description: 'Sterling silver chain necklace with lobster clasp.',
    price: 2999,
    category: 'Jewelry',
    subCategory: 'Necklaces',
    measurementType: 'length',
    measurements: [
      { value: '16 inch', label: '16 inch', priceModifier: 0 },
      { value: '18 inch', label: '18 inch', priceModifier: 300 },
      { value: '20 inch', label: '20 inch', priceModifier: 500 }
    ],
    bestSeller: true
  },

  // MUSICAL INSTRUMENTS - Size based
  {
    name: 'Acoustic Guitar Strings',
    description: 'Phosphor bronze acoustic guitar strings.',
    price: 599,
    category: 'Music',
    subCategory: 'Accessories',
    measurementType: 'size',
    measurements: [
      { value: 'Light', label: 'Light Gauge', priceModifier: 0 },
      { value: 'Medium', label: 'Medium Gauge', priceModifier: 50 },
      { value: 'Heavy', label: 'Heavy Gauge', priceModifier: 100 }
    ],
    bestSeller: false
  },

  // HEALTH & WELLNESS - Weight/Volume based
  {
    name: 'Protein Powder',
    description: 'Whey protein isolate with vanilla flavor.',
    price: 3499,
    category: 'Health',
    subCategory: 'Supplements',
    measurementType: 'weight',
    measurements: [
      { value: '1kg', label: '1kg Container', priceModifier: 0 },
      { value: '2kg', label: '2kg Container', priceModifier: 2000 },
      { value: '5kg', label: '5kg Container', priceModifier: 4500 }
    ],
    bestSeller: true
  },

  // GARDENING - Quantity/Weight based
  {
    name: 'Vegetable Seeds Mix',
    description: 'Organic heirloom vegetable seeds variety pack.',
    price: 399,
    category: 'Garden',
    subCategory: 'Seeds',
    measurementType: 'quantity',
    measurements: [
      { value: '10 varieties', label: '10 Seed Types', priceModifier: 0 },
      { value: '20 varieties', label: '20 Seed Types', priceModifier: 300 },
      { value: '30 varieties', label: '30 Seed Types', priceModifier: 500 }
    ],
    bestSeller: false
  },

  // CRAFT SUPPLIES - Quantity based
  {
    name: 'Acrylic Paint Set',
    description: 'Professional acrylic paints in vibrant colors.',
    price: 1199,
    category: 'Crafts',
    subCategory: 'Painting',
    measurementType: 'quantity',
    measurements: [
      { value: '12 colors', label: '12 Color Set', priceModifier: 0 },
      { value: '24 colors', label: '24 Color Set', priceModifier: 800 },
      { value: '48 colors', label: '48 Color Set', priceModifier: 1500 }
    ],
    bestSeller: true
  },

  // KITCHEN - Volume/Quantity based
  {
    name: 'Glass Storage Containers',
    description: 'Airtight glass containers with bamboo lids.',
    price: 899,
    category: 'Kitchen',
    subCategory: 'Storage',
    measurementType: 'quantity',
    measurements: [
      { value: '3 pieces', label: 'Set of 3', priceModifier: 0 },
      { value: '6 pieces', label: 'Set of 6', priceModifier: 600 },
      { value: '10 pieces', label: 'Set of 10', priceModifier: 1200 }
    ],
    bestSeller: false
  },

  // Keep 2-3 legacy clothing items for variety
  {
    name: 'Women Floral Dress',
    description: 'Elegant floral print summer dress.',
    price: 1599,
    category: 'Women',
    subCategory: 'Dresses',
    measurementType: 'size',
    measurements: [
      { value: 'S', label: 'Small', priceModifier: 0 },
      { value: 'M', label: 'Medium', priceModifier: 0 },
      { value: 'L', label: 'Large', priceModifier: 0 }
    ],
    bestSeller: true
  },
  {
    name: 'Men Winter Jacket',
    description: 'Waterproof winter jacket with thermal lining.',
    price: 3999,
    category: 'Men',
    subCategory: 'Winterwear',
    measurementType: 'size',
    measurements: [
      { value: 'M', label: 'Medium', priceModifier: 0 },
      { value: 'L', label: 'Large', priceModifier: 0 },
      { value: 'XL', label: 'Extra Large', priceModifier: 200 }
    ],
    bestSeller: false
  }
];

// Helper to get a random element from an array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate demo orders
const addresses = [
  { street: '123 Main St', city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
  { street: '456 Oak Ave', city: 'Gotham', state: 'NJ', zip: '07001', country: 'USA' },
  { street: '789 Pine Rd', city: 'Star City', state: 'CA', zip: '90001', country: 'USA' },
  { street: '321 Maple Dr', city: 'Central City', state: 'IL', zip: '60007', country: 'USA' },
  { street: '654 Cedar Ln', city: 'Coast City', state: 'TX', zip: '73301', country: 'USA' },
];
const paymentMethods = ['COD', 'Razorpay'];
const statuses = ['Order Placed', 'Shipped', 'Delivered', 'Cancelled'];

function getRandomItems(productDocs) {
  // Each order has 1-3 items
  const count = Math.floor(Math.random() * 3) + 1;
  const items = [];
  for (let i = 0; i < count; i++) {
    const product = random(productDocs);
    items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: Math.floor(Math.random() * 3) + 1,
    });
  }
  return items;
}

let orders = [];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await userModel.deleteMany({});
    await productModel.deleteMany({});
    await orderModel.deleteMany({});
    
    console.log('⚠️  Note: Please set up your Cloudinary credentials in .env file');
    console.log('⚠️  CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY');
    console.log('⚠️  Visit https://cloudinary.com to create your free account');
    console.log('⚠️  Skipping image upload until credentials are configured...\n');

    // Hash passwords
    for (let user of users) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }

    // Insert users
    const userDocs = await userModel.insertMany(users);
    console.log('Users seeded');

    // Check if Cloudinary is configured
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key';

    let cloudinaryUrls = [];
    
    if (isCloudinaryConfigured) {
      console.log('Uploading demo images to Cloudinary...');
      cloudinaryUrls = await uploadDemoImagesToCloudinary();
      console.log('Cloudinary image URLs:', cloudinaryUrls);
    } else {
      console.log('Using placeholder images (Cloudinary not configured)');
      // Use placeholder images for now
      cloudinaryUrls = Array(15).fill('https://via.placeholder.com/400x400?text=Product+Image');
    }

    // Create sample products with featured status
    const products = productTemplates.map((tpl, i) => ({
      ...tpl,
      image: [cloudinaryUrls[i % cloudinaryUrls.length]],
      date: now(),
      // Set some products as featured for demo
      featured: i < 4, // First 4 products are featured
      totalSales: Math.floor(Math.random() * 100), // Random sales for demo
      averageRating: (Math.random() * 2 + 3).toFixed(1), // Random rating 3-5
      reviewCount: Math.floor(Math.random() * 50), // Random review count
      // Convert priceModifier to actual price for each measurement
      measurements: tpl.measurements.map(m => ({
        value: m.value,
        label: m.label,
        price: tpl.price + m.priceModifier // Convert priceModifier to actual price
      })),
      // Remove legacy sizes field since we're using measurements now
      sizes: undefined
    }));

    // Insert products
    const productDocs = await productModel.insertMany(products);
    console.log('Products seeded');

    // Now that products have _id, generate orders
    orders = Array.from({ length: 20 }).map(() => {
      const user = random(userDocs);
      const items = getRandomItems(productDocs);
      const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return {
        userId: user._id,
        items,
        amount,
        address: random(addresses),
        status: random(statuses),
        paymentMethod: random(paymentMethods),
        payment: Math.random() > 0.3, // 70% paid
        date: Date.now() - Math.floor(Math.random() * 1000000000),
      };
    });

    await orderModel.insertMany(orders);
    console.log('Orders seeded');

    mongoose.connection.close();
    console.log('Seeding complete. Connection closed.');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed(); 