import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  product: {
    type: String,
    required: true,
    trim: true
  },
  review: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: "👤"
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/i.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  }],
  verified: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
reviewSchema.index({ status: 1, featured: -1, displayOrder: 1 });
reviewSchema.index({ rating: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;