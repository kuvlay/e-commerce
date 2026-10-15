import express from "express";
import { getUserActivities } from "../utils/activityLogger.js";
import authUser from "../../auth/middleware/auth.js";
import { v4 as uuidv4 } from "uuid";

const activityRouter = express.Router();

// GET USER ACTIVITIES
activityRouter.get("/me", authUser, async (req, res) => {
  const requestId = uuidv4();
  
  try {
    const userId = req.userId;
    const { limit = 10, cursor } = req.query;
    
    // Enhanced logging
    console.log(`📊 Activity request [${requestId}]:`, {
      requestId,
      userId,
      limit: parseInt(limit),
      cursor,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin
    });

    const result = await getUserActivities(userId, parseInt(limit), cursor);
    
    // Set response headers
    res.set('Cache-Control', 'no-store');
    res.type('application/json');
    
    if (result.success) {
      console.log(`✅ Activity request success [${requestId}]:`, {
        requestId,
        userId,
        activitiesCount: result.activities?.length || 0,
        hasMore: result.hasMore
      });
      
      res.json({
        success: true,
        requestId,
        activities: result.activities,
        hasMore: result.hasMore
      });
    } else {
      console.error(`❌ Activity request failed [${requestId}]:`, {
        requestId,
        userId,
        error: result.error
      });
      
      res.json({
        success: false,
        requestId,
        message: "Failed to fetch activities - database error",
        error: result.error
      });
    }
  } catch (error) {
    console.error(`💥 Activity request exception [${requestId}]:`, {
      requestId,
      userId: req.userId,
      error: error.message,
      stack: error.stack
    });
    
    // Set response headers even on error
    res.set('Cache-Control', 'no-store');
    res.type('application/json');
    
    res.json({
      success: false,
      requestId,
      message: "Failed to fetch activities - server error",
      error: error.message
    });
  }
});

export default activityRouter;