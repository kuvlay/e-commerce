import mongoose from 'mongoose';
import Review from './models/reviewModel.js';
import config from '../../../core/config/index.js';

const sampleReviews = [
  {
    name: "Priya Sharma",
    location: "Delhi",
    rating: 5,
    product: "Premium Bihar Sattu",
    review: "The quality of sattu is exceptional! It tastes exactly like what my grandmother used to make in Bihar. The packaging is also very good and keeps it fresh.",
    avatar: "👩‍🦱",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center"
    ],
    verified: true,
    featured: true,
    status: 'active',
    displayOrder: 1
  },
  {
    name: "Rajesh Kumar",
    location: "Mumbai",
    rating: 5,
    product: "Traditional Ghee",
    review: "Pure and authentic ghee with amazing aroma. You can taste the difference immediately. Fast delivery and excellent packaging. Highly recommended!",
    avatar: "👨‍💼",
    images: [
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&h=200&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1599909533730-f4b6c89bf5b5?w=300&h=200&fit=crop&crop=center"
    ],
    verified: true,
    featured: true,
    status: 'active',
    displayOrder: 2
  },
  {
    name: "Anita Singh",
    location: "Bangalore",
    rating: 4,
    product: "Organic Honey",
    review: "Great quality honey with natural taste. My family loves it. The consistency and color shows it's pure. Will definitely order again.",
    avatar: "👩‍🍳",
    images: [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=200&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300&h=200&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=200&fit=crop&crop=center"
    ],
    verified: true,
    featured: false,
    status: 'active',
    displayOrder: 3
  },
  {
    name: "Vikash Gupta",
    location: "Patna",
    rating: 5,
    product: "Handmade Pickles",
    review: "Tastes just like homemade pickles! The spice level is perfect and the oil quality is excellent. Reminds me of my mother's cooking.",
    avatar: "👨‍🌾",
    images: [
      "https://images.unsplash.com/photo-1599909533730-f4b6c89bf5b5?w=300&h=200&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=200&fit=crop&crop=center"
    ],
    verified: true,
    featured: false,
    status: 'active',
    displayOrder: 4
  },
  {
    name: "Meera Jha",
    location: "Kolkata",
    rating: 5,
    product: "Fresh Flour Mix",
    review: "The flour is very fresh and finely ground. Perfect for making rotis and parathas. The taste is authentic and the quality is consistent.",
    avatar: "👩‍👩‍👧",
    images: [
      "https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop&crop=center"
    ],
    verified: true,
    featured: false,
    status: 'active',
    displayOrder: 5
  },
  {
    name: "Amit Verma",
    location: "Lucknow",
    rating: 4,
    product: "Organic Jaggery",
    review: "Good quality jaggery with natural sweetness. Perfect for making traditional sweets. The texture and taste are authentic.",
    avatar: "👨‍🍳",
    images: [
      "https://images.unsplash.com/photo-1609501676725-7186f734b2e1?w=300&h=200&fit=crop&crop=center"
    ],
    verified: true,
    featured: false,
    status: 'active',
    displayOrder: 6
  },
  {
    name: "Sunita Devi",
    location: "Ranchi",
    rating: 5,
    product: "Mustard Oil",
    review: "Pure mustard oil with strong aroma. Perfect for cooking traditional dishes. The quality is excellent and the price is reasonable.",
    avatar: "👩‍🌾",
    images: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=200&fit=crop&crop=center",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop&crop=center"
    ],
    verified: true,
    featured: false,
    status: 'active',
    displayOrder: 7
  }
];

const seedReviews = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing reviews
    await Review.deleteMany({});
    console.log('Cleared existing reviews');

    // Insert sample reviews
    const insertedReviews = await Review.insertMany(sampleReviews);
    console.log(`Inserted ${insertedReviews.length} sample reviews`);

    console.log('✅ Review seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    process.exit(1);
  }
};

// Run the seed function
seedReviews();