import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaQuoteLeft, FaShoppingBag } from 'react-icons/fa';
import { COLORS } from '../../../core/constants/theme';
import apiClient, { TIMEOUTS } from '../../../core/utils/apiClient';

const ProductReviews = () => {
  const navigate = useNavigate();
  const [currentReview, setCurrentReview] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch reviews from API
  const fetchReviews = async () => {
    try {
      console.log('🔄 ProductReviews: Fetching reviews from API...');
      // const apiUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/reviews/active`;
      // console.log('🌐 API URL:', apiUrl);
      
      // Add timeout protection to prevent hanging
      // const controller = new AbortController();
      // const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      // const response = await fetch(apiUrl, {
      //   signal: controller.signal,
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // });
      
      // clearTimeout(timeoutId);
      
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      
      // const data = await response.json();

      const { data } = await apiClient.get('/api/reviews/active', {
        timeout: TIMEOUTS.fast,
      });
      
      console.log('📊 API Response:', data);
      
      if (data.success && data.reviews && data.reviews.length > 0) {
        console.log(`✅ Found ${data.reviews.length} reviews from API`);
        // Transform API data to match component expectations
        const transformedReviews = data.reviews
          .map(review => ({
            id: review._id,
            name: review.name,
            location: review.location,
            rating: review.rating,
            product: review.product,
            review: review.review,
            date: new Date(review.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }),
            verified: review.verified,
            avatar: review.avatar || "👤",
            images: review.images || [],
            featured: review.featured,
            displayOrder: review.displayOrder || 0
          }))
          // Sort by featured first, then by display order, then by creation date
          .sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
            return new Date(b.date) - new Date(a.date);
          });
        
        console.log('🎯 Sorted reviews:', transformedReviews.map(r => `${r.name} (Featured: ${r.featured}, Order: ${r.displayOrder})`));
        setReviews(transformedReviews);
      } else {
        console.log('⚠️ No reviews from API, using sample data');
        // Fallback to sample data if no reviews found
        setReviews(sampleReviews);
      }
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      
      // Handle different types of errors
      if (error.name === 'AbortError') {
        console.log('⚠️ API request timeout - backend may be sleeping on Render');
      } else if ((error.message || '').toLowerCase().includes('network')) {
        console.log('⚠️ Network error - backend server may be down');
      } else {
        console.log('⚠️ Unknown API error:', error.message);
      }
      
      console.log('⚠️ Using sample data as fallback');
      // For now, use sample data on error, but log the issue
      setReviews(sampleReviews);
    } finally {
      setLoading(false);
      console.log('✅ ProductReviews: Loading complete');
    }
  };

  // Sample review data as fallback
  const sampleReviews = [
    {
      id: 1,
      name: "Priya Sharma",
      location: "Delhi",
      rating: 5,
      product: "Premium Bihar Sattu",
      review: "The quality of sattu is exceptional! It tastes exactly like what my grandmother used to make in Bihar. The packaging is also very good and keeps it fresh.",
      date: "2 weeks ago",
      verified: true,
      avatar: "👩‍🦱",
      images: [
        "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center"
      ]
    },
    {
      id: 2,
      name: "Rajesh Kumar",
      location: "Mumbai",
      rating: 5,
      product: "Traditional Ghee",
      review: "Pure and authentic ghee with amazing aroma. You can taste the difference immediately. Fast delivery and excellent packaging. Highly recommended!",
      date: "1 month ago",
      verified: true,
      avatar: "👨‍💼",
      images: [
        "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&h=200&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1599909533730-f4b6c89bf5b5?w=300&h=200&fit=crop&crop=center"
      ]
    },
    {
      id: 3,
      name: "Anita Singh",
      location: "Bangalore",
      rating: 4,
      product: "Organic Honey",
      review: "Great quality honey with natural taste. My family loves it. The consistency and color shows it's pure. Will definitely order again.",
      date: "3 weeks ago",
      verified: true,
      avatar: "👩‍🍳",
      images: [
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=200&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=300&h=200&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=200&fit=crop&crop=center"
      ]
    },
    {
      id: 4,
      name: "Vikash Gupta",
      location: "Patna",
      rating: 5,
      product: "Handmade Pickles",
      review: "Tastes just like homemade pickles! The spice level is perfect and the oil quality is excellent. Reminds me of my mother's cooking.",
      date: "1 week ago",
      verified: true,
      avatar: "👨‍🌾",
      images: [
        "https://images.unsplash.com/photo-1599909533730-f4b6c89bf5b5?w=300&h=200&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=200&fit=crop&crop=center"
      ]
    },
    {
      id: 5,
      name: "Meera Jha",
      location: "Kolkata",
      rating: 5,
      product: "Fresh Flour Mix",
      review: "The flour is very fresh and finely ground. Perfect for making rotis and parathas. The taste is authentic and the quality is consistent.",
      date: "2 months ago",
      verified: true,
      avatar: "👩‍👩‍👧",
      images: [
        "https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&crop=center",
        "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop&crop=center"
      ]
    }
  ];

  // Fetch reviews on component mount
  useEffect(() => {
    fetchReviews();
  }, []);

  // Auto-rotate reviews
  useEffect(() => {
    if (reviews.length > 0) {
      console.log('🔄 Setting up review rotation for', reviews.length, 'reviews');
      const interval = setInterval(() => {
        setCurrentReview((prev) => {
          const next = (prev + 1) % reviews.length;
          console.log('🔄 Rotating from review', prev, 'to', next);
          return next;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [reviews.length]);

  // Intersection Observer for animations
  useEffect(() => {
    // Set visible immediately for debugging
    setIsVisible(true);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('reviews-section');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  // Show loading state
  if (loading) {
    return (
      <section className="py-20 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.background} 0%, #f8f9fa 100%)` }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </section>
    );
  }

  // Debug logging
  console.log('🎨 ProductReviews render:', { loading, reviewsCount: reviews.length });

  // Don't render if no reviews
  if (reviews.length === 0) {
    console.log('❌ ProductReviews: No reviews to display, returning null');
    return null;
  }

  console.log('✅ ProductReviews: Rendering with', reviews.length, 'reviews');
  console.log('🎨 isVisible state:', isVisible);
  console.log('🎨 currentReview:', currentReview);
  console.log('🎨 First review:', reviews[0]?.name);

  return (
    <section 
      id="reviews-section"
      className="py-20 relative overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${COLORS.background} 0%, #f8f9fa 100%)`,
        minHeight: '600px' // Ensure section has height
      }}
    >
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: COLORS.primary }}></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ backgroundColor: COLORS.secondary }}></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Debug Info - Development Only */}
        {import.meta.env.DEV && (
          <div className="text-center mb-4 p-4 bg-blue-100 rounded">
            <p className="text-sm text-blue-800">
              🔍 Debug: {reviews.length} reviews loaded, isVisible: {isVisible.toString()}, currentReview: {currentReview}
            </p>
          </div>
        )}

        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-prata" style={{ color: COLORS.textPrimary }}>
            What Our Customers Say
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: COLORS.textSecondary }}>
            Don't just take our word for it. Here's what our valued customers have to say about our authentic Bihar products.
          </p>
          {/* Admin Connection Status - Development Only */}
          {import.meta.env.DEV && (
            <div className="mt-4 text-sm" style={{ color: COLORS.textSecondary }}>
              {reviews.length > 0 && reviews[0].id && reviews[0].id.length > 10 ? (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  ✅ Connected to Admin Panel ({reviews.length} reviews)
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                  ⚠️ Using Sample Data (Admin Panel Disconnected)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Featured Review - Large Card */}
          <div className={`lg:col-span-2 transition-all duration-1000 delay-200 opacity-100 translate-y-0`}>
            <div 
              className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 relative"
              style={{ borderLeftColor: COLORS.primary }}
            >
              <FaQuoteLeft className="text-4xl mb-6 opacity-20" style={{ color: COLORS.primary }} />
              
              <div className="flex items-center mb-6">
                <div className="flex mr-4">
                  {renderStars(reviews[currentReview].rating)}
                </div>
                <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
                  {reviews[currentReview].rating}.0 out of 5
                </span>
              </div>

              <p className="text-lg leading-relaxed mb-6" style={{ color: COLORS.textPrimary }}>
                "{reviews[currentReview].review}"
              </p>

              {/* Review Images */}
              {reviews[currentReview].images && reviews[currentReview].images.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-3">
                    {reviews[currentReview].images.map((image, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer overflow-hidden rounded-xl"
                        style={{ width: '120px', height: '80px' }}
                        onClick={() => {
                          setSelectedImage(image);
                          setShowImageModal(true);
                        }}
                      >
                        <img
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                    {reviews[currentReview].images.length > 3 && (
                      <div 
                        className="flex items-center justify-center rounded-xl border-2 border-dashed text-sm font-medium"
                        style={{ 
                          width: '120px', 
                          height: '80px',
                          borderColor: COLORS.textSecondary + '40',
                          color: COLORS.textSecondary
                        }}
                      >
                        +{reviews[currentReview].images.length - 3} more
                      </div>
                    )}
                  </div>
                  <p className="text-xs mt-2" style={{ color: COLORS.textSecondary }}>
                    📸 Customer photos of {reviews[currentReview].product}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mr-4"
                    style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` }}
                  >
                    {reviews[currentReview].avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg" style={{ color: COLORS.textPrimary }}>
                      {reviews[currentReview].name}
                    </h4>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                      {reviews[currentReview].location} • {reviews[currentReview].date}
                    </p>
                  </div>
                </div>
                
                {reviews[currentReview].verified && (
                  <div className="flex items-center text-sm font-medium" style={{ color: COLORS.primary }}>
                    <FaShoppingBag className="mr-2" />
                    Verified Purchase
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
                  Product: <span style={{ color: COLORS.primary }}>{reviews[currentReview].product}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Review Stats */}
          <div className={`space-y-6 transition-all duration-1000 delay-400 opacity-100 translate-y-0`}>
            {/* Overall Rating */}
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: COLORS.primary }}>4.8</div>
              <div className="flex justify-center mb-2">
                {renderStars(5)}
              </div>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>Based on 1,247+ reviews</p>
            </div>

            {/* Rating Breakdown */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h4 className="font-semibold mb-4" style={{ color: COLORS.textPrimary }}>Rating Breakdown</h4>
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center mb-2">
                  <span className="text-sm w-8" style={{ color: COLORS.textSecondary }}>{stars}★</span>
                  <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        backgroundColor: COLORS.primary,
                        width: stars === 5 ? '78%' : stars === 4 ? '18%' : stars === 3 ? '3%' : stars === 2 ? '1%' : '0%'
                      }}
                    ></div>
                  </div>
                  <span className="text-sm w-8 text-right" style={{ color: COLORS.textSecondary }}>
                    {stars === 5 ? '78%' : stars === 4 ? '18%' : stars === 3 ? '3%' : stars === 2 ? '1%' : '0%'}
                  </span>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h4 className="font-semibold mb-4" style={{ color: COLORS.textPrimary }}>Why Customers Trust Us</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: COLORS.primary }}></div>
                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>100% Authentic Products</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: COLORS.primary }}></div>
                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>Fast & Secure Delivery</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: COLORS.primary }}></div>
                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>7-Day Return Policy</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: COLORS.primary }}></div>
                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>24/7 Customer Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Review Navigation Dots */}
        <div className="flex justify-center space-x-3">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentReview(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentReview 
                  ? 'scale-125' 
                  : 'hover:scale-110'
              }`}
              style={{ 
                backgroundColor: index === currentReview ? COLORS.primary : COLORS.textSecondary + '40'
              }}
            />
          ))}
        </div>

        {/* Call to Action */}
        <div className={`text-center mt-12 transition-all duration-1000 delay-600 opacity-100 translate-y-0`}>
          <p className="text-lg mb-6" style={{ color: COLORS.textSecondary }}>
            Join thousands of satisfied customers who trust Bihar Products
          </p>
          
          <button 
            className="px-8 py-4 rounded-full font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` }}
            onClick={() => {
              navigate('/collection');
              // Smooth scroll to top after navigation
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }}
            onMouseEnter={(e) => {
              e.target.style.background = `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`;
            }}
          >
            Shop Now & Experience Quality
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Review image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductReviews;