import React from 'react';

const ReviewStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Reviews',
      value: stats.totalReviews || 0,
      icon: '📝',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Active Reviews',
      value: stats.activeReviews || 0,
      icon: '✅',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Featured Reviews',
      value: stats.featuredReviews || 0,
      icon: '⭐',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews || 0,
      icon: '⏳',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: 'Average Rating',
      value: stats.avgRating ? `${stats.avgRating}/5` : '0/5',
      icon: '📊',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center text-2xl`}>
              {stat.icon}
            </div>
            <div className={`px-3 py-1 ${stat.bgColor} ${stat.textColor} rounded-full text-xs font-medium`}>
              Live
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.title}</p>
          </div>

          {/* Progress bar for visual appeal */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${stat.color} h-2 rounded-full transition-all duration-1000`}
                style={{ 
                  width: stat.title === 'Average Rating' 
                    ? `${(stats.avgRating || 0) * 20}%` 
                    : `${Math.min((stat.value / Math.max(stats.totalReviews || 1, 1)) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}

      {/* Rating Distribution Chart */}
      {stats.ratingDistribution && stats.ratingDistribution.length > 0 && (
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const ratingData = stats.ratingDistribution.find(r => r._id === rating);
              const count = ratingData ? ratingData.count : 0;
              const percentage = stats.activeReviews > 0 ? (count / stats.activeReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <span className="text-yellow-400">⭐</span>
                  </div>
                  
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center space-x-2 w-20">
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                    <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewStats;