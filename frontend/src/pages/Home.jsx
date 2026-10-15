import React, { useContext, memo, Suspense, lazy, useMemo } from "react";
import { ShopContext } from "../core/context/ShopContext";
import { useSmootherLoading } from "../core/hooks/useSmootherLoading";
import HeroBanner from "../shared/business/HeroBanner";
import { 
  HeroBannerSkeleton, 
  ProductGridSkeleton, 
  ScrollImageSkeleton, 
  ReviewsSkeleton 
} from "../shared/ui/SkeletonLoader";

// Lazy load heavy components
const ProductGrid = lazy(() => import("../features/products/components/ProductGrid"));
const ScrollImageSection = lazy(() => import("../shared/media/ScrollImageSection"));
const ProductReviews = lazy(() => import("../features/reviews/components/ProductReviews"));

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

const Home = memo(() => {
  const { loading, isProductsCached, getProductsData, cacheStatus } = useContext(ShopContext);
  
  // Stable sections array to prevent infinite re-renders
  const sections = useMemo(() => ['hero', 'products', 'features', 'reviews'], []);
  
  // Smart loading - instant if cached, smooth if fresh data
  const { sectionsLoaded, showSkeleton } = useSmootherLoading(loading, {
    minLoadingTime: isProductsCached ? 0 : 800, // No delay if cached
    transitionDelay: isProductsCached ? 0 : 200, // No transition delay if cached
    sections,
    isCached: isProductsCached
  });


  return (
    <div className="w-full">
      <style>{fadeInStyles}</style>
      
      
      {/* Hero Banner - Full screen */}
      {showSkeleton || !sectionsLoaded.hero ? (
        <HeroBannerSkeleton />
      ) : (
        <div className="fade-in-content">
          <HeroBanner />
        </div>
      )}
      
      {/* Products Grid */}
      {showSkeleton || !sectionsLoaded.products ? (
        <ProductGridSkeleton count={6} />
      ) : (
        <div className="fade-in-content">
          <Suspense fallback={<ProductGridSkeleton count={6} />}>
            <ProductGrid />
          </Suspense>
        </div>
      )}
      
      {/* Features Section */}
      {showSkeleton || !sectionsLoaded.features ? (
        <ScrollImageSkeleton />
      ) : (
        <div className="fade-in-content">
          <Suspense fallback={<ScrollImageSkeleton />}>
            <ScrollImageSection />
          </Suspense>
        </div>
      )}
      
      {/* Customer Reviews - Force Show for Debug */}
      <div className="fade-in-content">
        <Suspense fallback={<ReviewsSkeleton />}>
          <ProductReviews />
        </Suspense>
      </div>
    </div>
  );
});

Home.displayName = 'Home';

export default Home;
