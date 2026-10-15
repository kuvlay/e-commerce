import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { backendUrl } from '../../../App';
import ReviewForm from '../components/ReviewForm';
import ReviewCard from '../components/ReviewCard';
import ReviewStats from '../components/ReviewStats';

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch reviews
  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (filter !== 'all') {
        if (filter === 'featured') {
          params.append('featured', 'true');
        } else {
          params.append('status', filter);
        }
      }

      const response = await fetch(`${backendUrl}/api/reviews/admin?${params}`, {
        headers: {
          'token': token
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/reviews/admin/stats`, {
        headers: {
          'token': token
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage);
    fetchStats();
  }, [filter, currentPage]);

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    try {
      const url = editingReview 
        ? `${backendUrl}/api/reviews/admin/${editingReview._id}`
        : `${backendUrl}/api/reviews/admin`;
      
      const method = editingReview ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setShowForm(false);
        setEditingReview(null);
        fetchReviews(currentPage);
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error('Failed to save review');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/reviews/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'token': token
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Review deleted successfully');
        fetchReviews(currentPage);
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (id, newStatus) => {
    try {
      const response = await fetch(`${backendUrl}/api/reviews/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchReviews(currentPage);
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Handle featured toggle
  const handleFeaturedToggle = async (id) => {
    try {
      const response = await fetch(`${backendUrl}/api/reviews/admin/${id}/featured`, {
        method: 'PATCH',
        headers: {
          'token': token
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchReviews(currentPage);
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
          <p className="text-gray-600 mt-1">Manage customer reviews and testimonials</p>
        </div>
        <button
          onClick={() => {
            setEditingReview(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          ➕ Add New Review
        </button>
      </div>

      {/* Stats */}
      <ReviewStats stats={stats} />

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'all', label: 'All Reviews', icon: '📝' },
            { key: 'active', label: 'Active', icon: '✅' },
            { key: 'inactive', label: 'Inactive', icon: '❌' },
            { key: 'pending', label: 'Pending', icon: '⏳' },
            { key: 'featured', label: 'Featured', icon: '⭐' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => {
                setFilter(filterOption.key);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                filter === filterOption.key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{filterOption.icon}</span>
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Found</h3>
            <p className="text-gray-600 mb-6">Start by adding your first customer review</p>
            <button
              onClick={() => {
                setEditingReview(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            >
              Add First Review
            </button>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onEdit={(review) => {
                setEditingReview(review);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              onStatusToggle={handleStatusToggle}
              onFeaturedToggle={handleFeaturedToggle}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 py-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                currentPage === index + 1
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            Next
          </button>
        </div>
      )}

      {/* Review Form Modal */}
      {showForm && (
        <ReviewForm
          review={editingReview}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingReview(null);
          }}
        />
      )}
    </div>
  );
};

export default Reviews;