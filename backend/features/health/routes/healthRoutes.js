/**
 * Health Check Routes
 * Provides comprehensive system health monitoring endpoints
 * Based on DEBUG_LOG.md requirements for API health checking
 */

import express from 'express';
import { getSystemHealth, getDatabaseHealth, getDetailedHealthCheck } from '../controllers/healthController.js';

const router = express.Router();

// Basic health check endpoint
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'API is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// System health overview
router.get('/health', getSystemHealth);

// Database-specific health check
router.get('/health/database', getDatabaseHealth);

// Detailed health check with all components
router.get('/health/detailed', getDetailedHealthCheck);

export default router;