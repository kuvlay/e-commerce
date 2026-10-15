import express from 'express';
import {
  getAllReviews,
  getActiveReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewStatus,
  toggleFeatured,
  updateDisplayOrder,
  getReviewStats
} from '../controllers/reviewController.js';
import adminAuth from '../../auth/middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveReviews);

// Admin routes (protected)
router.get('/admin', adminAuth, getAllReviews);
router.get('/admin/stats', adminAuth, getReviewStats);
router.post('/admin', adminAuth, createReview);
router.put('/admin/:id', adminAuth, updateReview);
router.delete('/admin/:id', adminAuth, deleteReview);
router.patch('/admin/:id/status', adminAuth, toggleReviewStatus);
router.patch('/admin/:id/featured', adminAuth, toggleFeatured);
router.patch('/admin/display-order', adminAuth, updateDisplayOrder);

export default router;