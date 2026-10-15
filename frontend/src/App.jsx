import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthSync } from "./features/auth/hooks/useAuthSync";
import Home from "./pages/Home";
import Collection from "./features/products/pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./features/products/pages/Product";

import Login from "./features/auth/pages/Login";
import VerifyEmail from "./features/auth/pages/VerifyEmail";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import ReviewProduct from "./features/reviews/pages/ReviewProduct";
import FinalCheckout from "./features/cart/pages/FinalCheckout";
import Orders from "./features/orders/pages/TrackOrders";
import Profile from "./features/auth/pages/Profile";

import Navbar from "./shared/layout/Navbar";
import Footer from "./shared/layout/Footer";
import Verify from "./features/orders/pages/Verify";
import CacheStatus from "./shared/ui/CacheStatus";
import NetworkStatusIndicator from "./core/components/NetworkStatusIndicator";
// Debug imports removed after cart calculation fix

const App = () => {
  const location = useLocation();
  
  // Sync authentication state between contexts
  useAuthSync();
  
  // Force light theme on app initialization
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }, []);

  // Scroll to top on route change - FIX FOR NAVIGATION ISSUE
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  // Pages where navbar and footer should be hidden (standalone pages)
  const standalonePages = ['/login', '/verify-email', '/forgot-password', '/reset-password'];
  const isStandalonePage = standalonePages.includes(location.pathname);
  
  // Pages where footer should be hidden
  const hideFooterPages = ['/about', '/contact', '/review-product', '/final-checkout', '/profile', '/orders'];
  const hideFooterOnProductPage = location.pathname.startsWith('/product/');
  const shouldHideFooter = hideFooterPages.includes(location.pathname) || hideFooterOnProductPage || isStandalonePage;

  return (
    <div className="min-h-screen bg-white">
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
        toastClassName="!bg-white !text-primary-500 !shadow-xl !border !border-neutral-200"
      />
      
      {/* Navbar - Hidden on standalone pages */}
      {!isStandalonePage && <Navbar />}
      
      {/* Main Content */}
      <main className="relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/product/:productId" element={<Product />} />

          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/review-product" element={<ReviewProduct />} />
          <Route path="/final-checkout" element={<FinalCheckout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Debug route removed after cart calculation fix */}

          <Route path="/verify" element={<Verify />} />
        </Routes>
      </main>

      {/* Footer - Conditionally rendered */}
      {!shouldHideFooter && <Footer />}
      
      {/* Cache Status - Development only */}
      <CacheStatus />
      
      {/* Debug components removed after cart calculation fix */}
      
      {/* Network Status Indicator - Shows when offline or backend unavailable */}
      <NetworkStatusIndicator position="bottom-right" />
    </div>
  );
};

export default App;
