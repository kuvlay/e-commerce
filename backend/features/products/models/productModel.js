import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: Array, required: true },
  category: { type: String, required: true },
  subCategory: { type: String },
  // Simplified measurement system
  selectedTypes: [{
    type: String,
    enum: ['weight', 'size', 'quantity'],
    default: []
  }],
  measurements: [{
    categoryId: { type: String, required: true }, // References selectedTypes
    value: { type: String, required: true }, // e.g., "250g", "M", "500ml", "1 piece"
    label: { type: String, required: true }, // Display label
    price: { type: Number, required: true } // Direct price for this measurement
  }],
  // Legacy support - will be deprecated
  measurementType: { 
    type: String, 
    enum: ['weight', 'size', 'volume', 'quantity', 'length', 'area', 'time', 'power', 'custom'],
    default: 'weight'
  },
  // Featured products system
  featured: { type: Boolean, default: false },
  featuredOrder: { type: Number, default: 0 },
  featuredPriority: { type: Number, default: null },
  totalSales: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  // Legacy support - will be deprecated
  sizes: { type: Array, default: [] },
  bestSeller: { type: Boolean, default: false },
  date: { type: Number, required: true },
});

// Pre-save middleware for measurement validation
productSchema.pre('save', function(next) {
  // Validate that at least one measurement type is selected
  if ((!this.selectedTypes || this.selectedTypes.length === 0) && !this.measurementType) {
    return next(new Error('At least one measurement type must be selected'));
  }

  // Validate measurements reference valid categories
  if (this.measurements && this.measurements.length > 0) {
    const validCategoryIds = new Set(this.selectedTypes || []);
    
    // For backward compatibility, add legacy measurementType if no new fields
    if (validCategoryIds.size === 0 && this.measurementType) {
      validCategoryIds.add(this.measurementType);
    }
    
    for (const measurement of this.measurements) {
      if (!validCategoryIds.has(measurement.categoryId)) {
        return next(new Error(`Invalid measurement categoryId: ${measurement.categoryId}`));
      }
      
      // Validate price is positive
      if (measurement.price <= 0) {
        return next(new Error('Measurement price must be greater than 0'));
      }
    }
  }

  next();
});

// Pre-save middleware to manage featured products priority system
productSchema.pre('save', async function(next) {
  if (this.isModified('featured') && this.featured) {
    // If product is being featured, assign priority
    const featuredCount = await mongoose.model('product').countDocuments({ featured: true, _id: { $ne: this._id } });
    
    if (featuredCount >= 3) {
      // Find and remove the lowest priority (highest number) featured product
      const lowestPriorityProduct = await mongoose.model('product').findOne({ 
        featured: true, 
        _id: { $ne: this._id } 
      }).sort({ featuredPriority: -1 });
      
      if (lowestPriorityProduct) {
        lowestPriorityProduct.featured = false;
        lowestPriorityProduct.featuredPriority = null;
        await lowestPriorityProduct.save();
      }
    }
    
    // Assign new priority (always 1 for newest)
    this.featuredPriority = 1;
    this.featuredOrder = Date.now();
    
    // Shift existing priorities down
    await mongoose.model('product').updateMany(
      { featured: true, _id: { $ne: this._id } },
      { $inc: { featuredPriority: 1 } }
    );
  } else if (this.isModified('featured') && !this.featured) {
    // If product is being unfeatured, clear priority and reorder others
    const oldPriority = this.featuredPriority;
    this.featuredPriority = null;
    
    if (oldPriority) {
      // Shift priorities up for products with higher priority numbers
      await mongoose.model('product').updateMany(
        { featured: true, featuredPriority: { $gt: oldPriority } },
        { $inc: { featuredPriority: -1 } }
      );
    }
  }
  
  next();
});

// Database indexes for performance optimization
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ date: -1 });
productSchema.index({ totalSales: -1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ measurementType: 1 });

// Compound indexes for common queries
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ featured: 1, featuredPriority: 1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ featured: 1, date: -1 });
productSchema.index({ totalSales: -1, averageRating: -1 });

// Text search index for product search
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  category: 'text', 
  subCategory: 'text' 
}, {
  name: 'product_search_index',
  weights: { 
    name: 10, 
    category: 5, 
    subCategory: 3, 
    description: 1 
  }
});

// Sparse indexes for optional fields
productSchema.index({ bestSeller: 1 }, { sparse: true });

export default mongoose.model('product', productSchema);