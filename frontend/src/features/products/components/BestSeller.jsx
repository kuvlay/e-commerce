import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import Title from "../../../shared/ui/Title";
import ProductItem from "./ProductItem";
import ProductSkeleton from "./ProductSkeleton";
import { useFadeInUp, useStaggerAnimation } from "../../../core/hooks/useScrollAnimation.js";

const BestSeller = () => {
  const { products } = useContext(ShopContext);
  const [bestSeller, setBestSeller] = useState([]);
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
      const bestProducts = products.filter((item) => item.bestSeller);
      setBestSeller(bestProducts.slice(0, 5));
      // Add a small delay to show loading state and smooth transition
      setTimeout(() => {
        setIsLoading(false);
        // Reset animation to trigger stagger effect for new content
        gridAnimation.resetAnimation();
      }, 300);
    }
  }, [products]);

  return (
    <div className="my-10">
      <div 
        ref={titleAnimation.ref}
        className="text-center text-3xl py-8 scroll-animate-fade-up"
      >
        <Title text1={"BEST"} text2={"SELLERS"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati
          officiis eaque sint, fugit quo laborum.
        </p>
      </div>

      <div 
        ref={gridAnimation.ref}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6 scroll-stagger-container"
      >
        {isLoading ? (
          // Show loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <ProductSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          // Show actual products with animations
          bestSeller.map((item, i) => (
            <ProductItem
              key={item._id}
              id={item._id}
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

export default BestSeller;
