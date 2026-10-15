import React from 'react';

const ReviewCard = ({ review, onEdit, onDelete, onStatusToggle, onFeaturedToggle }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ⭐
      </span>
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
            {review.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{review.name}</h3>
            <p className="text-gray-600">{review.location}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Featured Badge */}
          {review.featured && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              ⭐ Featured
            </span>
          )}
          
          {/* Status Badge */}
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(review.status)}`}>
            {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
          </span>
          
          {/* Verified Badge */}
          {review.verified && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="flex">
          {renderStars(review.rating)}
        </div>
        <span className="text-sm text-gray-600">
          {review.rating}.0 out of 5
        </span>
      </div>

      {/* Product */}
      <div className="mb-3">
        <span className="text-sm font-medium text-gray-700">Product: </span>
        <span className="text-sm text-blue-600 font-medium">{review.product}</span>
      </div>

      {/* Review Text */}
      <p className="text-gray-800 mb-4 leading-relaxed">
        "{review.review}"
      </p>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {review.images.slice(0, 4).map((image, index) => (
              <div
                key={index}
                className="relative w-20 h-16 rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={image}
                  alt={`Review image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA4MCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkwyNCAzMkwyNCAzMkwyNCAzMiIgc3Ryb2tlPSIjOUI5QjlCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8dGV4dCB4PSI0MCIgeT0iMzgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5QjlCOUIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiI+SW1hZ2UgRXJyb3I8L3RleHQ+Cjwvc3ZnPgo=';
                  }}
                />
              </div>
            ))}
            {review.images.length > 4 && (
              <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-600 border border-gray-200">
                +{review.images.length - 4}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <span>Created: {formatDate(review.createdAt)}</span>
        <span>Display Order: {review.displayOrder}</span>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          {/* Status Toggle */}
          <select
            value={review.status}
            onChange={(e) => onStatusToggle(review._id, e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          {/* Featured Toggle */}
          <button
            onClick={() => onFeaturedToggle(review._id)}
            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-300 ${
              review.featured
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {review.featured ? '⭐ Featured' : '☆ Feature'}
          </button>
        </div>

        <div className="flex space-x-2">
          {/* Edit Button */}
          <button
            onClick={() => onEdit(review)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-300 text-sm font-medium"
          >
            ✏️ Edit
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(review._id)}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300 text-sm font-medium"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;