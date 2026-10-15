import { Route, Routes } from "react-router-dom";
import Navbar from "./shared/layout/Navbar";
import SideBar from "./shared/layout/SideBar";
import Add from "./features/products/pages/Add";
import List from "./features/products/pages/List";
import Order from "./features/orders/pages/Order";
import Dashboard from "./pages/Dashboard";
import Customers from "./features/customers/pages/Customers";
import CustomerDetails from "./features/customers/pages/CustomerDetails";
import Messages from "./features/messages/pages/Messages";
import Reviews from "./features/reviews/pages/Reviews";
import NotificationSystem from "./shared/ui/NotificationSystem";
import { useEffect, useState } from "react";
import Login from "./shared/auth/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper function to normalize backend URL
const normalizeBackendUrl = (url) => {
  if (!url) return "http://localhost:5000";
  
  // Remove trailing slashes
  let normalized = url.replace(/\/+$/, '');
  
  // Remove /api suffix if present
  if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4);
  }
  
  // Ensure protocol is present
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'http://' + normalized;
  }
  
  return normalized;
};

export const backendUrl = normalizeBackendUrl(import.meta.env.VITE_BACKEND_URL);
export const currency = "Rs";

// Validate and debug backend URL configuration
console.log('🔧 Admin App Configuration:');
console.log('📡 Raw Backend URL:', import.meta.env.VITE_BACKEND_URL);
console.log('📡 Normalized Backend URL:', backendUrl);
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('📋 Environment variables:', {
  VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL
});

// Validate URL format
if (backendUrl) {
  try {
    const url = new URL(backendUrl);
    console.log('✅ Backend URL is valid:', {
      protocol: url.protocol,
      host: url.host,
      pathname: url.pathname
    });
    
    // Show normalization warnings
    const rawUrl = import.meta.env.VITE_BACKEND_URL;
    if (rawUrl && rawUrl !== backendUrl) {
      console.warn('⚠️ Backend URL was normalized:');
      console.warn('  Original:', rawUrl);
      console.warn('  Normalized:', backendUrl);
    }
    
  } catch (error) {
    console.error('❌ Invalid backend URL format:', backendUrl);
    console.error('❌ URL validation error:', error.message);
  }
} else {
  console.error('❌ Backend URL is not configured!');
}

const App = () => {
  const [token, setToken] = useState(
    localStorage.getItem("token") ? localStorage.getItem("token") : ""
  );

  useEffect(() => {
    localStorage.setItem("token", token);
  }, [token]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <NotificationSystem />
      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar setToken={setToken} />
          <div className="flex w-full">
            <SideBar />
            <div className="flex-1 p-8 ml-4">
              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<Dashboard token={token} />} />
                  <Route path="/add" element={<Add token={token} />} />
                  <Route path="/list" element={<List token={token} />} />
                  <Route path="/order" element={<Order token={token} />} />
                  <Route path="/customers" element={<Customers token={token} />} />
                  <Route path="/customers/:customerId" element={<CustomerDetails token={token} />} />
                  <Route path="/messages" element={<Messages token={token} />} />
                  <Route path="/reviews" element={<Reviews token={token} />} />
                </Routes>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
