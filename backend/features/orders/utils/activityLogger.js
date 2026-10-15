import activityLogModel from "../models/activityLogModel.js";

/**
 * Log user activity
 * @param {string} userId - User ID
 * @param {string} type - Activity type
 * @param {Object} meta - Additional metadata
 * @param {string} orderId - Order ID (optional)
 */
export const logActivity = async (userId, type, meta = {}, orderId = null) => {
  try {
    // Handle system logs and invalid user IDs
    let processedUserId = null;
    if (userId && userId !== 'system' && typeof userId === 'string' && userId.length === 24) {
      // Valid ObjectId string
      processedUserId = userId;
    } else if (userId && typeof userId === 'object' && userId._id) {
      // User object with _id
      processedUserId = userId._id;
    }
    // For 'system' or invalid IDs, leave as null
    
    const activityData = {
      user_id: processedUserId,
      type,
      meta,
      order_id: orderId
    };

    const activity = new activityLogModel(activityData);
    await activity.save();
    
    console.log(`✅ Activity logged: ${type} for user ${processedUserId || 'system'}`);
    return activity;
  } catch (error) {
    console.error(`❌ Failed to log activity ${type} for user ${userId}:`, error);
    // Don't throw error to avoid breaking main flow
    return null;
  }
};

/**
 * Get user activities with pagination
 * @param {string} userId - User ID
 * @param {number} limit - Number of activities to return (default: 10)
 * @param {string} cursor - Cursor for pagination (optional)
 */
export const getUserActivities = async (userId, limit = 10, cursor = null) => {
  try {
    let query = { user_id: userId };
    
    if (cursor) {
      query.created_at = { $lt: new Date(cursor) };
    }

    const activities = await activityLogModel
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('order_id', 'order_status payment_status totals.grand_total')
      .lean();

    return {
      success: true,
      activities,
      hasMore: activities.length === limit
    };
  } catch (error) {
    console.error(`❌ Failed to get activities for user ${userId}:`, error);
    return {
      success: false,
      activities: [],
      hasMore: false,
      error: error.message
    };
  }
};