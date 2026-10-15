import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import Title from "../../../shared/ui/Title";
import ProductItem from "./ProductItem";
import ProductSkeleton from "./ProductSkeleton";
import { useFadeInUp, useStaggerAnimation } from "../../../core/hooks/useScrollAnimation.js";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);

  const [latestProduct, setLatestProduct] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation hooks for scroll-triggered animations
  const titleAnimation = useFadeInUp({
    animationOptions: { duration: 'normal', delay: 0 }
  });

  const gridAnimation = useStaggerAnimation({
    staggerDelay: 0.1,
    animationOptions: { duration: 'normal' }
  });

  useEffect(() => {
    if (products.length > 0) {
      setLatestProduct(products.slice(0, 10));
      // Add a small delay to show loading state and smooth transition
      setTimeout(() => {
        setIsLoading(false);
        // Reset animation to trigger stagger effect for new content
        gridAnimation.resetAnimation();
      }, 300);
    }
  }, [products]);

  return (
    <div className="my-10 ">
      <div 
        ref={titleAnimation.ref}
        className="text-center py-8 text-3xl scroll-animate-fade-up"
      >
        <Title text1={"LATEST"} text2={"COLLECTION"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae ex
          velit, quae quo minima repudiandae
        </p>
      </div>

      {/* RENDERING PRODUCT */}
      <div 
        ref={gridAnimation.ref}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6 scroll-stagger-container"
      >
        {isLoading ? (
          // Show loading skeletons
          Array.from({ length: 10 }).map((_, index) => (
            <ProductSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          // Show actual products with animations
          latestProduct.map((item, index) => (
            <ProductItem
              id={item._id}
              key={item._id}
              image={item.image}
              name={item.name}
              price={item.price}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default LatestCollection;
