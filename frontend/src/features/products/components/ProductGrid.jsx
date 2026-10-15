import React, { useContext, useEffect, useRef, memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../../../core/context/ShopContext";
import ProductCard from "./ProductCard";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { COLORS, GRADIENTS, SHADOWS } from "../../../core/constants/theme";

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

const ProductGrid = memo(() => {
  const { products, filteredProducts, loading, search } = useContext(ShopContext);
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const gridRef = useRef(null);
  
  // Home page should NEVER show search results - always show regular products
  const displayProducts = useMemo(() => {
    return products; // Always use all products, ignore search on home page
  }, [products]);

  // Memoize products to display (limit to 6 for homepage)
  const productsToShow = useMemo(() => {
    return displayProducts.slice(0, 6); // Always show only 6 products on home page
  }, [displayProducts]);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const grid = gridRef.current;

    if (!section || !header || !grid) return;

    // Header animation
    gsap.fromTo(header.children, 
      { 
        opacity: 0, 
        y: 50 
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: header,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Grid items animation
    const gridItems = grid.children;
    gsap.fromTo(gridItems,
      {
        opacity: 0,
        y: 60,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: grid,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );

  }, [products]);

  return (
    <section 
      ref={sectionRef}
      data-section="products" 
      className="w-full max-w-7xl mx-auto px-6 py-24"
      style={{ background: GRADIENTS.backgroundGradient }}
    >
      <style>{shimmerStyles}</style>
      {/* Section Header */}
      <div ref={headerRef} className="text-center mb-20">
        <div 
          className="inline-block px-6 py-3 rounded-full text-sm font-semibold mb-6 text-white"
          style={{ background: GRADIENTS.secondary, boxShadow: SHADOWS.cardOrange }}
        >
          Premium Collection
        </div>
        <h2 className="text-5xl md:text-6xl font-bold mb-6 font-prata" style={{ color: COLORS.textPrimary }}>
          Curated Excellence
        </h2>
        <p className="text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: COLORS.textSecondary }}>
          Discover authentic products from Bihar, handpicked for quality and tradition
        </p>
        <div className="w-24 h-1 mx-auto mt-8 rounded-full" style={{ background: GRADIENTS.secondary }}></div>
      </div>

      {/* Products Grid - 3 items per row */}
      <div 
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-16"
      >
        {loading ? (
          // Enhanced loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="shimmer h-80 bg-gray-200"></div>
              <div className="p-6">
                <div className="shimmer h-6 bg-gray-200 rounded mb-3"></div>
                <div className="shimmer h-4 bg-gray-200 rounded mb-2"></div>
                <div className="shimmer h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex items-center justify-between">
                  <div className="shimmer h-6 bg-gray-200 rounded w-20"></div>
                  <div className="shimmer h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))
        ) : productsToShow.length > 0 ? (
          productsToShow.map((product, index) => (
            <div key={product._id} className="transform transition-all duration-300">
              <ProductCard product={product} index={index} />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-600">No products found</h3>
            <p className="text-gray-500">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* View All Button - only show when not searching and there are more products */}
      {!loading && !search && products.length > 6 && (
        <div className="text-center">
          <button 
            onClick={() => navigate('/collection')}
            className="group relative px-12 py-4 text-white rounded-full font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105"
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
            <span className="relative z-10">Explore All Products</span>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </div>
          </button>
        </div>
      )}
    </section>
  );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid; 