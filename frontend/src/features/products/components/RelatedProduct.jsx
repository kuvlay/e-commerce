import { useContext, useEffect, useState, useRef } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import Title from "../../../shared/ui/Title";
import ProductItem from "./ProductItem";
import { useFadeInUp, useStaggerAnimation } from "../../../core/hooks/useScrollAnimation.js";

const RelatedProduct = ({ category, subCategory }) => {
  const { products } = useContext(ShopContext);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation hooks
  const titleAnimation = useFadeInUp({
    animationOptions: { duration: 'normal', delay: 0 }
  });

  const gridAnimation = useStaggerAnimation({
    staggerDelay: 0.1,
    animationOptions: { duration: 'normal' }
  });

  useEffect(() => {
    if (products.length > 0) {
      let productCopy = products.slice();

      productCopy = productCopy.filter((item) => category === item.category);
      productCopy = productCopy.filter(
        (item) => subCategory === item.subCategory
      );

      setRelated(productCopy.slice(0, 5));
      
      // Add a small delay to show loading state and smooth transition
      setTimeout(() => {
        setIsLoading(false);
        // Reset animation to trigger stagger effect for new content
        gridAnimation.resetAnimation();
      }, 300);
    }
  }, [products, category, subCategory, gridAnimation]);

  return (
    <div className="my-24">
      <div 
        ref={titleAnimation.ref}
        className="text-center text-3xl py-2 scroll-animate-fade-up"
      >
        <Title text1={"RELATED"} text2={"PRODUCTS"} />
      </div>

      <div 
        ref={gridAnimation.ref}
        className="grid grid-col-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 gap-y-6 scroll-stagger-container"
      >
        {isLoading ? (
          // Show loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          // Show actual products with animations
          related.map((item, i) => (
            <ProductItem
              key={i}
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

export default RelatedProduct;
