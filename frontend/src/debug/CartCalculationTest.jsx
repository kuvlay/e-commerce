import { useContext, useState } from 'react';
import { ShopContext } from '../core/context/ShopContext';

const CartCalculationTest = () => {
  const { 
    cartItems, 
    cartAmount, 
    cartCount, 
    products, 
    addToCart,
    currency 
  } = useContext(ShopContext);
  
  const [testResults, setTestResults] = useState([]);

  // Mock product data for testing
  const mockProduct = {
    _id: 'test-product-123',
    name: 'Test Product',
    price: 100,
    measurements: [
      { value: 'S', price: 100 },
      { value: 'M', price: 120 },
      { value: 'L', price: 140 }
    ]
  };

  const runTest = (testName, testFn) => {
    try {
      const result = testFn();
      setTestResults(prev => [...prev, { name: testName, result, success: true }]);
      console.log(`✅ ${testName}:`, result);
    } catch (error) {
      setTestResults(prev => [...prev, { name: testName, result: error.message, success: false }]);
      console.error(`❌ ${testName}:`, error);
    }
  };

  const testCartCalculation = () => {
    runTest('Cart Items Count', () => `${Object.keys(cartItems).length} items in cart`);
    runTest('Cart Total Amount', () => `${currency}${cartAmount}`);
    runTest('Cart Item Count', () => `${cartCount} total items`);
    runTest('Products Loaded', () => `${products.length} products available`);
    
    // Test timing issue
    if (cartCount > 0 && cartAmount === 0) {
      runTest('Timing Issue Detected', () => 'Cart has items but amount is 0 - products may not be loaded');
    } else if (cartCount > 0 && cartAmount > 0) {
      runTest('Cart Calculation Working', () => `${cartCount} items = ${currency}${cartAmount}`);
    } else {
      runTest('Cart State', () => 'Cart is empty');
    }
  };

  const addTestItem = async () => {
    // This won't work without the product existing in the backend
    // but we can test the function call
    try {
      await addToCart('test-product-123', 'M', 1);
      runTest('Add Test Item', () => 'Attempted to add test item');
    } catch (error) {
      runTest('Add Test Item', () => `Failed: ${error.message}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      left: '10px', 
      background: 'white', 
      border: '2px solid #28a745', 
      padding: '15px', 
      borderRadius: '8px',
      maxWidth: '400px',
      fontSize: '12px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>🧪 Cart Calculation Test</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testCartCalculation}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            marginRight: '5px'
          }}
        >
          Run Tests
        </button>
        
        <button 
          onClick={addTestItem}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            marginRight: '5px'
          }}
        >
          Add Test Item
        </button>
        
        <button 
          onClick={clearResults}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Clear
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current State:</strong>
        <div style={{ fontSize: '10px', color: '#666' }}>
          Cart: {cartCount} items, {currency}{cartAmount}<br/>
          Products: {products.length} loaded
        </div>
      </div>
      
      {testResults.length > 0 && (
        <div>
          <strong>Test Results:</strong>
          {testResults.map((test, index) => (
            <div 
              key={index}
              style={{ 
                fontSize: '10px', 
                padding: '2px 5px',
                margin: '2px 0',
                borderRadius: '3px',
                background: test.success ? '#d4edda' : '#f8d7da',
                color: test.success ? '#155724' : '#721c24'
              }}
            >
              <strong>{test.name}:</strong> {test.result}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CartCalculationTest;