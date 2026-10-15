import React, { useState, useEffect } from 'react';

const ReviewForm = ({ review, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    rating: 5,
    product: '',
    review: '',
    avatar: '👤',
    images: [],
    verified: true,
    featured: false,
    status: 'active',
    displayOrder: 0
  });

  const [imageInput, setImageInput] = useState('');

  useEffect(() => {
    if (review) {
      setFormData({
        name: review.name || '',
        location: review.location || '',
        rating: review.rating || 5,
        product: review.product || '',
        review: review.review || '',
        avatar: review.avatar || '👤',
        images: review.images || [],
        verified: review.verified !== undefined ? review.verified : true,
        featured: review.featured || false,
        status: review.status || 'active',
        displayOrder: review.displayOrder || 0
      });
    }
  }, [review]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleImageAdd = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageInput.trim()]
      }));
      setImageInput('');
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const avatarOptions = ['👤', '👩‍🦱', '👨‍💼', '👩‍🍳', '👨‍🌾', '👩‍👩‍👧', '👨‍👨‍👦', '👩‍💻', '👨‍🔬', '👩‍🎨'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {review ? 'Edit Review' : 'Add New Review'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-300"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter customer name"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter location"
                required
              />
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rating *
              </label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              >
                {[5, 4, 3, 2, 1].map(rating => (
                  <option key={rating} value={rating}>
                    {rating} Star{rating !== 1 ? 's' : ''} {'⭐'.repeat(rating)}
                  </option>
                ))}
              </select>
            </div>

            {/* Avatar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Avatar
              </label>
              <div className="flex flex-wrap gap-2">
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                    className={`w-12 h-12 text-2xl rounded-xl border-2 transition-all duration-300 ${
                      formData.avatar === avatar
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Review Text *
            </label>
            <textarea
              value={formData.review}
              onChange={(e) => setFormData(prev => ({ ...prev, review: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
              placeholder="Enter the customer's review..."
              required
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Review Images
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter image URL"
                />
                <button
                  type="button"
                  onClick={handleImageAdd}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-300"
                >
                  Add
                </button>
              </div>
              
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDE1MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA1MEw0MCA1MEw0MCA1MEw0MCA1MCIgc3Ryb2tlPSIjOUI5QjlCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8dGV4dCB4PSI3NSIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5QjlCOUIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiI+SW52YWxpZCBVUkw8L3RleHQ+Cjwvc3ZnPgo=';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors duration-300 opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Verified */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Verified Purchase
              </label>
              <div className="flex items-center space-x-4 pt-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="verified"
                    checked={formData.verified === true}
                    onChange={() => setFormData(prev => ({ ...prev, verified: true }))}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="verified"
                    checked={formData.verified === false}
                    onChange={() => setFormData(prev => ({ ...prev, verified: false }))}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            {/* Featured */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Featured Review
              </label>
              <div className="flex items-center space-x-4 pt-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="featured"
                    checked={formData.featured === true}
                    onChange={() => setFormData(prev => ({ ...prev, featured: true }))}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="featured"
                    checked={formData.featured === false}
                    onChange={() => setFormData(prev => ({ ...prev, featured: false }))}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
            >
              {review ? 'Update Review' : 'Create Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;