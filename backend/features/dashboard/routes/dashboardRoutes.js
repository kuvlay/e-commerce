import express from "express";
import { getDashboardStats, getMonthlyRevenueTrend } from "../controllers/dashboardController.js";
import adminAuth from "../../auth/middleware/adminAuth.js";

const dashboardRouter = express.Router();

// Add comprehensive logging for dashboard routes
dashboardRouter.use((req, res, next) => {
  console.log(`🎯 Dashboard route accessed: ${req.method} ${req.originalUrl}`);
  console.log(`🔑 Token present: ${req.headers.token ? 'Yes' : 'No'}`);
  console.log(`🕰️ Timestamp: ${new Date().toISOString()}`);
  next();
});

// Add ping endpoint for smoke testing
dashboardRouter.get('/ping', (req, res) => {
  console.log('🏓 Dashboard ping endpoint accessed');
  res.json({ 
    ok: true, 
    path: '/api/dashboard/ping',
    timestamp: new Date().toISOString(),
    message: 'Dashboard routes are accessible'
  });
});

// Add test endpoint to verify route registration (no auth required)
dashboardRouter.get('/test', (req, res) => {
  console.log('🧪 Dashboard test endpoint accessed');
  res.json({
    success: true,
    message: 'Dashboard routes are properly registered',
    availableEndpoints: [
      'GET /api/dashboard/ping',
      'GET /api/dashboard/test', 
      'GET /api/dashboard/stats (requires admin auth)',
      'GET /api/dashboard/revenue-trend (requires admin auth)'
    ],
    timestamp: new Date().toISOString()
  });
});

// Get dashboard statistics (admin only)
dashboardRouter.get("/stats", adminAuth, getDashboardStats);

// Get monthly revenue trend (admin only)
dashboardRouter.get("/revenue-trend", adminAuth, getMonthlyRevenueTrend);

export default dashboardRouter;