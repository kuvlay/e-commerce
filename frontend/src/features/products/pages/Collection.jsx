import React, { useContext, useEffect, useState, useRef } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import ProductCard from "../components/ProductCard";
import { COLORS, GRADIENTS, SHADOWS } from "../../../core/constants/theme";
import { ProductCardSkeleton } from "../../../shared/ui/SkeletonLoader";
import { useSkeletonTransition } from "../../../core/hooks/useSmootherLoading";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import apiClient, { TIMEOUTS } from '../../../core/utils/apiClient';

// Smooth fade-in animation styles
const fadeInStyles = `
  .fade-in-content {
    animation: fadeInSmooth 0.8s ease-out forwards;
    opacity: 0;
  }
  
  @keyframes fadeInSmooth {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

gsap.registerPlugin(ScrollTrigger);

// YouTube-style shimmer animation styles
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -468px 0;
    }
    100% {
      background-position: 468px 0;
    }
  }
  
  .shimmer {
    background: linear-gradient(90deg, #f0f0f0 0%, #e8e8e8 20%, #f0f0f0 40%, #f0f0f0 100%);
    background-size: 800px 104px;
    animation: shimmer 2.2s infinite ease-out;
    position: relative;
    overflow: hidden;
  }
  
  .shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
    animation: shimmer-overlay 2.2s infinite ease-out;
  }
  
  @keyframes shimmer-overlay {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const Collection = () => {
  const { products, search, filteredProducts, loading, isProductsCached } = useContext(ShopContext);
  const navigate = useNavigate();
  const [sortType, setSortType] = useState("featured");
  const [displayProducts, setDisplayProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Smart skeleton loading - instant if cached
  const showSkeleton = useSkeletonTransition(loading, isProductsCached ? 0 : 800, isProductsCached);
  
  const heroRef = useRef(null);
  const gridRef = useRef(null);
  const featuredRef = useRef(null);

  // Use filtered products when searching, all products when not searching
  const baseProducts = search && search.trim() !== '' ? filteredProducts : products;
  
  // Set searching state when search is active
  useEffect(() => {
    setIsSearching(Boolean(search && search.trim().length > 0));
  }, [search]);

  // Get featured products from backend API
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await apiClient.get('/api/product/featured', { params: { type: 'manual', limit: 3 }, timeout: TIMEOUTS.fast });
        const data = response.data;
        
        if (data.success && data.products.length > 0) {
          setFeaturedProducts(data.products);
        } else {
          // Fallback to bestsellers if no featured products found
          const bestsellers = products.filter(p => p.bestseller);
          const regularProducts = products.filter(p => !p.bestseller);
          const fallback = [...bestsellers, ...regularProducts].slice(0, 3);
          setFeaturedProducts(fallback);
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
        // Fallback to bestsellers on error
        if (products.length > 0) {
          const bestsellers = products.filter(p => p.bestseller);
          const regularProducts = products.filter(p => !p.bestseller);
          const fallback = [...bestsellers, ...regularProducts].slice(0, 3);
          setFeaturedProducts(fallback);
        }
      }
    };

    if (products.length > 0 && featuredProducts.length === 0) {
      fetchFeaturedProducts();
    }
  }, [products, featuredProducts.length]);

  // Handle sorting and display products (separate from featured products)
  useEffect(() => {
    let productsCopy = [...baseProducts];
    
    // Sort products
    switch (sortType) {
      case "low-high":
        productsCopy.sort((a, b) => {
          const aPrice = a.measurements && a.measurements.length > 0 ? a.measurements[0].price : a.price;
          const bPrice = b.measurements && b.measurements.length > 0 ? b.measurements[0].price : b.price;
          return aPrice - bPrice;
        });
        break;
      case "high-low":
        productsCopy.sort((a, b) => {
          const aPrice = a.measurements && a.measurements.length > 0 ? a.measurements[0].price : a.price;
          const bPrice = b.measurements && b.measurements.length > 0 ? b.measurements[0].price : b.price;
          return bPrice - aPrice;
        });
        break;
      case "newest":
        // Assuming newer products have higher IDs or you can add a createdAt field
        productsCopy.reverse();
        break;
      default: // featured
        // Move bestsellers to front
        productsCopy.sort((a, b) => {
          if (a.bestseller && !b.bestseller) return -1;
          if (!a.bestseller && b.bestseller) return 1;
          return 0;
        });
        break;
    }

    setDisplayProducts(productsCopy);
  }, [baseProducts, sortType]);

  // Optimized GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Only animate on initial load, not on every search
      if (!search) {
        // Hero animation
        if (heroRef.current) {
          gsap.fromTo(heroRef.current.children, 
            { opacity: 0, y: 30 },
            { 
              opacity: 1, 
              y: 0, 
              duration: 0.6, 
              stagger: 0.1,
              ease: "power2.out"
            }
          );
        }

        // Featured product animation
        if (featuredRef.current) {
          gsap.fromTo(featuredRef.current,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              delay: 0.2
            }
          );
        }
      }

      // Grid animation - lighter for search results
      if (gridRef.current) {
        const animationDuration = search ? 0.3 : 0.5;
        const animationDelay = search ? 0 : 0.3;
        
        gsap.fromTo(gridRef.current.children,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: animationDuration,
            stagger: search ? 0.05 : 0.08,
            ease: "power2.out",
            delay: animationDelay
          }
        );
      }
    });

    return () => ctx.revert();
  }, [displayProducts.length, search]); // Only re-animate when product count changes or search state changes

  return (
    <div className="min-h-screen pt-20" style={{ background: GRADIENTS.backgroundGradient }}>
      <style>{shimmerStyles}</style>
      <style>{fadeInStyles}</style>


      <div className="max-w-7xl mx-auto px-6 pb-20 pt-8">

        {/* Featured Products Spotlight - Always show, even during search */}
        {showSkeleton ? (
          <div className="mb-12">
            <div className="text-center mb-12">
              <div className="shimmer h-8 bg-gray-200 rounded-full mx-auto max-w-xs mb-4"></div>
              <div className="shimmer h-10 bg-gray-200 rounded mx-auto max-w-md mb-4"></div>
              <div className="shimmer h-6 bg-gray-200 rounded mx-auto max-w-lg"></div>
            </div>
            
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto lg:h-[600px]">
                <div className="lg:col-span-2 lg:row-span-2">
                  <div className="shimmer bg-gray-200 rounded-3xl h-full"></div>
                </div>
                <div className="lg:col-span-2">
                  <div className="shimmer bg-gray-200 rounded-3xl h-full"></div>
                </div>
                <div className="lg:col-span-2">
                  <div className="shimmer bg-gray-200 rounded-3xl h-full"></div>
                </div>
              </div>
            </div>
          </div>
        ) : featuredProducts.length > 0 && (
          <div ref={featuredRef} className="mb-12 fade-in-content">
            <div className="text-center mb-12">
              <div 
                className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 text-white"
                style={{ background: GRADIENTS.accent, boxShadow: SHADOWS.cardOrange }}
              >
                ⭐ Featured Collection
              </div>
              <h2 className="text-3xl font-bold font-prata" style={{ color: COLORS.textPrimary }}>
                Customer Favorites
              </h2>
              <p className="text-lg mt-4" style={{ color: COLORS.textSecondary }}>
                Our most loved products, handpicked for you
              </p>
            </div>
            
            <div className="max-w-6xl mx-auto">
              {/* Creative Grid Layout with Position-Based Visual Effects */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto lg:h-[600px]">
                {/* Position 1: Main Featured Product - Large with Golden Glow */}
                {featuredProducts[0] && (
                  <div key={`featured-0-${featuredProducts[0]._id}`} className="lg:col-span-2 lg:row-span-2">
                    <div 
                      className="bg-white rounded-3xl p-6 shadow-2xl border-2 hover:shadow-2xl transition-all duration-500 h-full group cursor-pointer animate-pulse"
                      style={{ 
                        borderColor: '#fbbf24',
                        boxShadow: '0 0 30px rgba(251, 191, 36, 0.4), 0 8px 32px rgba(0, 0, 0, 0.12)',
                        transform: 'scale(1.02)'
                      }}
                      onClick={() => navigate(`/product/${featuredProducts[0]._id}`)}
                    >
                      <div className="relative h-2/3 mb-4">
                        <div 
                          className="absolute -top-2 -left-2 w-full h-full rounded-2xl opacity-20"
                          style={{ background: GRADIENTS.primary }}
                        ></div>
                        <img
                          src={featuredProducts[0].image[0]}
                          alt={featuredProducts[0].name}
                          className="relative z-10 w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                        />
                        {featuredProducts[0].bestseller && (
                          <div 
                            className="absolute top-4 right-4 z-20 text-white px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: GRADIENTS.secondary }}
                          >
                            🏆 Bestseller
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.secondary }}>
                          {featuredProducts[0].category}
                        </p>
                        <h3 className="text-xl font-bold font-prata" style={{ color: COLORS.textPrimary }}>
                          {featuredProducts[0].name}
                        </h3>
                        <div className="flex items-center space-x-3 mb-4">
                          <span className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                            ₹{featuredProducts[0].price}
                          </span>
                          {featuredProducts[0].originalPrice && (
                            <span className="text-sm line-through" style={{ color: COLORS.neutral400 }}>
                              ₹{featuredProducts[0].originalPrice}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${featuredProducts[0]._id}`);
                          }}
                          className="w-full text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105"
                          style={{ 
                            background: GRADIENTS.primary,
                            boxShadow: SHADOWS.cardOrange
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = GRADIENTS.secondary;
                            e.target.style.boxShadow = SHADOWS.cardOrangeHover;
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = GRADIENTS.primary;
                            e.target.style.boxShadow = SHADOWS.cardOrange;
                          }}
                        >
                          View Product
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Position 2: Second Featured Product - Medium with Purple Glow */}
                {featuredProducts[1] && (
                  <div key={`featured-1-${featuredProducts[1]._id}`} className="lg:col-span-2">
                    <div 
                      className="bg-white rounded-3xl p-4 shadow-xl border-2 hover:shadow-2xl transition-all duration-500 h-full group cursor-pointer"
                      style={{ 
                        borderColor: '#8b5cf6',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3), 0 4px 20px rgba(0, 0, 0, 0.1)'
                      }}
                      onClick={() => navigate(`/product/${featuredProducts[1]._id}`)}
                    >
                      <div className="flex h-full">
                        <div className="w-1/2 relative">
                          <img
                            src={featuredProducts[1].image[0]}
                            alt={featuredProducts[1].name}
                            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                          />
                          {featuredProducts[1].bestseller && (
                            <div 
                              className="absolute top-2 right-2 text-white px-2 py-1 rounded-full text-xs font-bold"
                              style={{ background: GRADIENTS.secondary }}
                            >
                              🏆
                            </div>
                          )}
                        </div>
                        <div className="w-1/2 pl-4 flex flex-col justify-center space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.secondary }}>
                            {featuredProducts[1].category}
                          </p>
                          <h3 className="text-lg font-bold font-prata" style={{ color: COLORS.textPrimary }}>
                            {featuredProducts[1].name}
                          </h3>
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-xl font-bold" style={{ color: COLORS.primary }}>
                              ₹{featuredProducts[1].price}
                            </span>
                            {featuredProducts[1].originalPrice && (
                              <span className="text-sm line-through" style={{ color: COLORS.neutral400 }}>
                                ₹{featuredProducts[1].originalPrice}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${featuredProducts[1]._id}`);
                            }}
                            className="text-white py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-300 hover:scale-105"
                            style={{ 
                              background: GRADIENTS.primary,
                              boxShadow: SHADOWS.cardOrange
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = GRADIENTS.secondary;
                              e.target.style.boxShadow = SHADOWS.cardOrangeHover;
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = GRADIENTS.primary;
                              e.target.style.boxShadow = SHADOWS.cardOrange;
                            }}
                          >
                            View Product
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Position 3: Third Featured Product - Medium with Cyan Glow */}
                {featuredProducts[2] && (
                  <div key={`featured-2-${featuredProducts[2]._id}`} className="lg:col-span-2">
                    <div 
                      className="bg-white rounded-3xl p-4 shadow-xl border-2 hover:shadow-2xl transition-all duration-500 h-full group cursor-pointer"
                      style={{ 
                        borderColor: '#06b6d4',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.3), 0 4px 20px rgba(0, 0, 0, 0.1)'
                      }}
                      onClick={() => navigate(`/product/${featuredProducts[2]._id}`)}
                    >
                      <div className="flex h-full">
                        <div className="w-1/2 pr-4 flex flex-col justify-center space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.secondary }}>
                            {featuredProducts[2].category}
                          </p>
                          <h3 className="text-lg font-bold font-prata" style={{ color: COLORS.textPrimary }}>
                            {featuredProducts[2].name}
                          </h3>
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-xl font-bold" style={{ color: COLORS.primary }}>
                              ₹{featuredProducts[2].price}
                            </span>
                            {featuredProducts[2].originalPrice && (
                              <span className="text-sm line-through" style={{ color: COLORS.neutral400 }}>
                                ₹{featuredProducts[2].originalPrice}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${featuredProducts[2]._id}`);
                            }}
                            className="text-white py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-300 hover:scale-105"
                            style={{ 
                              background: GRADIENTS.primary,
                              boxShadow: SHADOWS.cardOrange
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = GRADIENTS.secondary;
                              e.target.style.boxShadow = SHADOWS.cardOrangeHover;
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = GRADIENTS.primary;
                              e.target.style.boxShadow = SHADOWS.cardOrange;
                            }}
                          >
                            View Product
                          </button>
                        </div>
                        <div className="w-1/2 relative">
                          <img
                            src={featuredProducts[2].image[0]}
                            alt={featuredProducts[2].name}
                            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                          />
                          {featuredProducts[2].bestseller && (
                            <div 
                              className="absolute top-2 right-2 text-white px-2 py-1 rounded-full text-xs font-bold"
                              style={{ background: GRADIENTS.secondary }}
                            >
                              🏆
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Sort Controls - Moved below featured products */}
        <div className="flex justify-between items-center pt-24">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
              {displayProducts.length} Product{displayProducts.length !== 1 ? 's' : ''}
            </span>
            {search && (
              <span className="text-sm px-3 py-1 rounded-full" style={{ 
                backgroundColor: `${COLORS.primary}15`, 
                color: COLORS.primary 
              }}>
                showing "{search}"
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Sort by:</span>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300"
              style={{
                borderColor: COLORS.primary,
                color: COLORS.textPrimary,
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}1A`;
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest First</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {showSkeleton ? (
          <div>
            <div className="text-center mb-12" data-section="all-products">
              <h2 className="text-3xl font-bold font-prata mb-4" style={{ color: COLORS.textPrimary }}>
                Loading Products...
              </h2>
              <div className="w-16 h-1 mx-auto rounded-full" style={{ background: GRADIENTS.secondary }}></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 9 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="fade-in-content">
            <div id="all-products" className="text-center mb-12" data-section="all-products">
              <h2 className="text-3xl font-bold font-prata mb-4" style={{ color: COLORS.textPrimary }}>
                {search && search.trim() ? `Search Results for "${search}" (${displayProducts.length} found)` : 'All Products'}
              </h2>
              <div className="w-16 h-1 mx-auto rounded-full" style={{ background: GRADIENTS.secondary }}></div>
            </div>
            
            <div 
              ref={gridRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {displayProducts.map((product, index) => (
                <div key={product._id} className="transform transition-all duration-300">
                  <ProductCard product={product} index={index} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-3xl font-bold mb-4" style={{ color: COLORS.textPrimary }}>
              No products found
            </h3>
            <p className="text-xl mb-8" style={{ color: COLORS.textSecondary }}>
              Try adjusting your search terms or browse our featured products
            </p>
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-4 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{ 
                background: GRADIENTS.primary,
                boxShadow: SHADOWS.cardOrange
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Call to Action */}
        {!search && displayProducts.length > 0 && (
          <div className="text-center mt-20 py-16 px-8 rounded-3xl" style={{ background: 'rgba(255, 107, 53, 0.05)' }}>
            <h3 className="text-3xl font-bold mb-4 font-prata" style={{ color: COLORS.textPrimary }}>
              Can't Find What You're Looking For?
            </h3>
            <p className="text-xl mb-8" style={{ color: COLORS.textSecondary }}>
              We're constantly adding new authentic Bihar products to our collection
            </p>
            <button 
              onClick={() => navigate('/contact#faq-section')}
              className="px-8 py-4 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{ 
                background: GRADIENTS.secondary,
                boxShadow: SHADOWS.cardOrange
              }}
            >
              Request a Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
