import { useContext } from 'react';
import { ShopContext } from '../core/context/ShopContext';

const CartDebug = () => {
  const { 
    cartItems, 
    cartAmount, 
    cartCount, 
    products, 
    currency, 
    delivery_fee 
  } = useContext(ShopContext);

  const debugInfo = {
    cartItems,
    cartAmount,
    cartCount,
    productsCount: products.length,
    currency,
    delivery_fee,
    hasCartItems: Object.keys(cartItems).length > 0,
    hasProducts: products.length > 0
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid #007bff', 
      padding: '15px', 
      borderRadius: '8px',
      maxWidth: '400px',
      fontSize: '12px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>🛒 Cart Debug</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Cart Amount:</strong> {currency}{cartAmount}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Cart Count:</strong> {cartCount}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Products Loaded:</strong> {products.length}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Cart Items:</strong>
        <pre style={{ 
          background: '#f8f9fa', 
          padding: '5px', 
          margin: '5px 0',
          fontSize: '10px',
          maxHeight: '100px',
          overflow: 'auto'
        }}>
          {JSON.stringify(cartItems, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Total with Delivery:</strong> {currency}{cartAmount + delivery_fee}
      </div>
      
      <button 
        onClick={() => console.log('🐛 Cart Debug Info:', debugInfo)}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Log to Console
      </button>
    </div>
  );
};

export default CartDebug;