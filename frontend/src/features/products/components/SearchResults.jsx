import React, { useContext, useMemo } from 'react';
import { ShopContext } from '../../../core/context/ShopContext';
import ProductItem from './ProductItem';
import { useLocation } from 'react-router-dom';
import { COLORS, GRADIENTS, SHADOWS } from '../../../core/constants/theme';

const SearchResults = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const location = useLocation();

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return [];
    
    const searchTerm = search.toLowerCase().trim();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm)) ||
      product.category.toLowerCase().includes(searchTerm) ||
      (product.subCategory && product.subCategory.toLowerCase().includes(searchTerm))
    );
  }, [products, search]);

  // Only show if search is active, there's a search term, and we're on homepage
  if (!showSearch || !search.trim() || location.pathname !== '/') return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8" style={{background: COLORS.background}}>
      {/* Search Results Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold mb-2 prata-regular" style={{color: COLORS.textPrimary}}>
          Search Results
        </h3>
        <p className="text-lg" style={{color: COLORS.textSecondary}}>
          {filteredProducts.length > 0 
            ? `Found ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} for "${search}"`
            : `No products found for "${search}"`
          }
        </p>
        <div className="w-16 h-1 mx-auto mt-4" style={{background: GRADIENTS.secondary}}></div>
      </div>

      {/* Search Results Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {filteredProducts.map((product) => (
            <ProductItem 
              key={product._id} 
              id={product._id}
              image={product.image}
              name={product.name}
              price={product.price}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4" style={{color: COLORS.primary}}>🔍</div>
          <p className="text-xl mb-2" style={{color: COLORS.textPrimary}}>No products found</p>
          <p style={{color: COLORS.textSecondary}}>Try searching with different keywords</p>
        </div>
      )}
    </section>
  );
};

export default SearchResults;