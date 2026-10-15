import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false, // Allow null for system-level logs
    default: null
  },
  type: {
    type: String,
    enum: [
      // User activity types
      'WISHLIST_ADD',
      'WISHLIST_REMOVE', 
      'CART_ADD',
      'CART_REMOVE',
      'ORDER_PLACED',
      'ORDER_DECLINED',
      'ORDER_STATUS_CHANGED',
      
      // Shipping management types
      'SHIPPING_INFO_UPDATED',
      'SHIPPING_AUDIT_ENTRY',
      
      // System monitoring types
      'PERFORMANCE_METRIC',
      'NAME_RESOLUTION_DEBUG',
      
      // Admin activity types
      'ADMIN_ORDER_UPDATE',
      'ADMIN_SHIPPING_CHANGE'
    ],
    required: true
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'order',
    default: null
  },
  meta: {
    type: Object,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

// Index for efficient queries
activityLogSchema.index({ user_id: 1, created_at: -1 });

const activityLogModel = mongoose.models.activity_log || mongoose.model("activity_log", activityLogSchema);
export default activityLogModel;