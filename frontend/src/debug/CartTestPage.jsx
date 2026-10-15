import React, { useContext } from 'react';
import { ShopContext } from '../core/context/ShopContext';
import CartTotal from '../features/cart/components/CartTotal';

const CartTestPage = () => {
  const { 
    cartItems, 
    cartAmount, 
    cartCount, 
    products, 
    currency,
    delivery_fee 
  } = useContext(ShopContext);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Cart Calculation Test Page</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h2>Cart State</h2>
          <p><strong>Cart Items:</strong> {Object.keys(cartItems).length}</p>
          <p><strong>Cart Count:</strong> {cartCount}</p>
          <p><strong>Cart Amount:</strong> {currency}{cartAmount}</p>
          <p><strong>Products Loaded:</strong> {products.length}</p>
          <p><strong>Delivery Fee:</strong> {currency}{delivery_fee}</p>
          
          <h3>Cart Items Detail:</h3>
          <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(cartItems, null, 2)}
          </pre>
        </div>
        
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h2>CartTotal Component</h2>
          <CartTotal />
        </div>
      </div>
      
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>Products Available</h2>
        {products.length === 0 ? (
          <p style={{ color: '#666' }}>No products loaded yet...</p>
        ) : (
          <div>
            <p>{products.length} products available:</p>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {products.slice(0, 5).map(product => (
                <div key={product._id} style={{ 
                  border: '1px solid #eee', 
                  padding: '8px', 
                  margin: '4px 0', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <strong>{product.name}</strong> - {currency}{product.price}
                  <br />
                  ID: {product._id}
                  {product.measurements && (
                    <div>
                      Variants: {product.measurements.map(m => `${m.value}(${currency}${m.price})`).join(', ')}
                    </div>
                  )}
                </div>
              ))}
              {products.length > 5 && <p>... and {products.length - 5} more</p>}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Test Instructions:</h3>
        <ol>
          <li>Check if products are loaded (should be > 0)</li>
          <li>Add items to cart using the main app</li>
          <li>Return to this page to see if CartTotal calculates correctly</li>
          <li>The CartTotal component should show the same amount as the cart state</li>
        </ol>
        
        <h3>Expected Behavior:</h3>
        <ul>
          <li>If cart is empty: Shows "Your cart is empty"</li>
          <li>If cart has items but products not loaded: Shows warning in dev mode</li>
          <li>If cart has items and products loaded: Shows correct total calculation</li>
        </ul>
      </div>
    </div>
  );
};

export default CartTestPage;