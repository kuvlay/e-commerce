import Review from '../models/reviewModel.js';
import { v2 as cloudinary } from 'cloudinary';

// Get all reviews for admin
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, featured } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (featured !== undefined) filter.featured = featured === 'true';

    const reviews = await Review.find(filter)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
};

// Get active reviews for frontend
const getActiveReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'active' })
      .sort({ featured: -1, displayOrder: 1, createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching active reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
};

// Create new review
const createReview = async (req, res) => {
  try {
    const {
      name,
      location,
      rating,
      product,
      review,
      avatar,
      images,
      verified,
      featured,
      status,
      displayOrder
    } = req.body;

    const newReview = new Review({
      name,
      location,
      rating,
      product,
      review,
      avatar: avatar || "👤",
      images: images || [],
      verified: verified !== undefined ? verified : true,
      featured: featured || false,
      status: status || 'active',
      displayOrder: displayOrder || 0
    });

    await newReview.save();

    res.json({
      success: true,
      message: 'Review created successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review'
    });
  }
};

// Toggle review status
const toggleReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: `Review ${status} successfully`,
      review
    });
  } catch (error) {
    console.error('Error toggling review status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review status'
    });
  }
};

// Toggle featured status
const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.featured = !review.featured;
    await review.save();

    res.json({
      success: true,
      message: `Review ${review.featured ? 'featured' : 'unfeatured'} successfully`,
      review
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating featured status'
    });
  }
};

// Update display order
const updateDisplayOrder = async (req, res) => {
  try {
    const { reviews } = req.body; // Array of { id, displayOrder }

    const updatePromises = reviews.map(({ id, displayOrder }) =>
      Review.findByIdAndUpdate(id, { displayOrder })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Display order updated successfully'
    });
  } catch (error) {
    console.error('Error updating display order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating display order'
    });
  }
};

// Get review statistics
const getReviewStats = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    const activeReviews = await Review.countDocuments({ status: 'active' });
    const featuredReviews = await Review.countDocuments({ featured: true });
    const pendingReviews = await Review.countDocuments({ status: 'pending' });

    // Rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Average rating
    const avgRatingResult = await Review.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;

    res.json({
      success: true,
      stats: {
        totalReviews,
        activeReviews,
        featuredReviews,
        pendingReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        ratingDistribution: ratingStats
      }
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics'
    });
  }
};

export {
  getAllReviews,
  getActiveReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewStatus,
  toggleFeatured,
  updateDisplayOrder,
  getReviewStats
};