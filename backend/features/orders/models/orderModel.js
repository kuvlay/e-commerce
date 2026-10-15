import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  items: [{
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    qty: {
      type: Number,
      required: true
    },
    variant: {
      type: String,
      default: null
    },
    imageUrl: {
      type: String,
      default: null
    }
  }],
  address_snapshot: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    line1: {
      type: String,
      required: true
    },
    line2: {
      type: String,
      default: null
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  payment_method: {
    type: String,
    enum: ['ONLINE', 'COD'],
    required: true,
  },
  payment_status: {
    type: String,
    enum: ['Pending', 'PendingVerification', 'Paid', 'Failed', 'Refunded'],
    required: true,
    default: 'Pending'
  },
  order_status: {
    type: String,
    enum: ['Pending', 'Placed', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled'],
    required: true,
    default: 'Pending'
  },
  totals: {
    subtotal: {
      type: Number,
      required: true
    },
    shipping: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    grand_total: {
      type: Number,
      required: true
    }
  },
  notes: {
    type: String,
    default: null
  },
  decline_reason: {
    type: String,
    default: null
  },
  shippingInfo: {
    carrier: {
      type: String,
      default: null
    },
    trackingNumber: {
      type: String, 
      default: null
    },
    shippedAt: {
      type: Date,
      default: null
    }
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  
  // Legacy fields for backward compatibility
  userId: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    default: null
  },
  address: {
    type: Object,
    default: null
  },
  status: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    default: null
  },
  payment: {
    type: Boolean,
    default: null
  },
  date: {
    type: Number,
    default: null
  }
});

// Pre-save hook to update timestamps
orderSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Add comprehensive indexes for better query performance
// Based on DEBUG_LOG.md performance optimization requirements
orderSchema.index({ created_at: -1 }); // Existing - for date-based queries
orderSchema.index({ date: -1 }); // Existing - legacy date field
orderSchema.index({ order_status: 1 }); // Existing - for status filtering
orderSchema.index({ status: 1 }); // Existing - legacy status field
orderSchema.index({ user_id: 1 }); // Existing - for user queries
orderSchema.index({ userId: 1 }); // Existing - legacy user field

// New compound indexes for performance optimization
orderSchema.index({ user_id: 1, created_at: -1 }); // User orders by date
orderSchema.index({ user_id: 1, order_status: 1 }); // User orders by status
orderSchema.index({ order_status: 1, created_at: -1 }); // Status with date sorting
orderSchema.index({ payment_status: 1, order_status: 1 }); // Payment and order status combination
orderSchema.index({ created_at: -1, order_status: 1 }); // Recent orders with status
orderSchema.index({ updated_at: -1 }); // For tracking recent updates

// Indexes for admin queries and analytics
orderSchema.index({ 'totals.grand_total': -1 }); // For revenue analytics
orderSchema.index({ payment_method: 1 }); // For payment method analytics
orderSchema.index({ 'shippingInfo.carrier': 1 }); // For shipping analytics
orderSchema.index({ 'shippingInfo.trackingNumber': 1 }); // For tracking queries

// Sparse indexes for optional fields
orderSchema.index({ 'shippingInfo.shippedAt': -1 }, { sparse: true }); // Only for shipped orders
orderSchema.index({ decline_reason: 1 }, { sparse: true }); // Only for declined orders

// Text index for searching (if needed in future)
// orderSchema.index({ 
//   'items.title': 'text', 
//   'address_snapshot.name': 'text' 
// }, { 
//   name: 'order_search_index',
//   weights: { 'items.title': 10, 'address_snapshot.name': 5 }
// });

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
