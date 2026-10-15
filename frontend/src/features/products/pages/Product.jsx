import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShopContext } from "../../../core/context/ShopContext";
import { useWishlist } from "../../../core/context/WishlistContext";
import { useUser } from "../../../core/context/UserContext";
import { assets } from "../../../assets/assets";
import { toast } from "react-toastify";

import PageWrapper from "../../../shared/layout/PageWrapper";
import { useCartAnimations } from "../../cart/hooks/useCartAnimations.js";
import { COLORS, GRADIENTS, SHADOWS } from "../../../core/constants/theme";
import { getMeasurementTypeInfo } from "../../../core/constants/measurements";
import { 
  FaHeart, 
  FaRegHeart, 
  FaShare, 
  FaShoppingCart, 
  FaBolt, 
  FaStar, 
  FaRegStar, 
  FaStarHalfAlt,
  FaShieldAlt,
  FaTruck,
  FaUndo,
  FaPhone,
  FaExpand,
  FaChevronLeft,
  FaChevronRight,
  FaMinus,
  FaPlus,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Product = () => {
  const { productId } = useParams();
  const { products, currency, cartItems, addToCart } = useContext(ShopContext);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [selectedMeasurement, setSelectedMeasurement] = useState("");
  const [buyingNow, setBuyingNow] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviews] = useState([
    { id: 1, name: "Priya Sharma", rating: 5, comment: "Excellent quality! Authentic taste of Bihar.", date: "2024-01-15", verified: true },
    { id: 2, name: "Rajesh Kumar", rating: 4, comment: "Good product, fast delivery. Will order again.", date: "2024-01-10", verified: true },
    { id: 3, name: "Anita Singh", rating: 5, comment: "Best quality I've found online. Highly recommended!", date: "2024-01-08", verified: false }
  ]);
  const { animateItemAdded } = useCartAnimations();
  
  // Refs for animations
  const addToCartButtonRef = useRef(null);
  const heroRef = useRef(null);
  const imageGalleryRef = useRef(null);
  const productInfoRef = useRef(null);
  const tabsRef = useRef(null);

  const fetchProductData = async () => {
    const product = products.find((item) => item._id === productId);
    
    if (product) {
      setProductData(product);
      setImage(product.image && product.image.length > 0 ? product.image[0] : '/placeholder-image.jpg');
      // Set default measurement if available
      if (product.measurements && product.measurements.length > 0) {
        setSelectedMeasurement(product.measurements[0].value);
      } else if (product.sizes && product.sizes.length > 0) {
        setSelectedMeasurement(product.sizes[0]);
      }
    }
  };

  const handleBuyNow = async () => {
    if (!selectedMeasurement) {
      toast.error("Please select a measurement option");
      return;
    }

    setBuyingNow(true);
    
    // Small delay for better UX
    setTimeout(() => {
      setBuyingNow(false);
      // Navigate to review product page with product details
      navigate('/review-product', {
        state: {
          productId: productData._id,
          selectedMeasurement,
          quantity
        }
      });
    }, 800);
  };

  // Get current price from selected measurement
  const getCurrentPrice = () => {
    if (!productData || !selectedMeasurement) return productData?.price || 0;
    
    const measurement = productData.measurements?.find(m => m.value === selectedMeasurement);
    return measurement?.price || productData.price;
  };

  // Get measurement type info for display
  const measurementInfo = productData ? getMeasurementTypeInfo(productData.measurementType || 'weight') : null;

  // Animation effects
  useEffect(() => {
    if (productData) {
      const ctx = gsap.context(() => {
        // Hero section animation
        gsap.fromTo(heroRef.current?.children || [], 
          { opacity: 0, y: 50 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.8, 
            stagger: 0.2,
            ease: "power3.out"
          }
        );

        // Image gallery animation
        gsap.fromTo(imageGalleryRef.current?.children || [],
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.7)",
            delay: 0.3
          }
        );

        // Product info animation
        gsap.fromTo(productInfoRef.current?.children || [],
          { opacity: 0, x: 50 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out",
            delay: 0.5
          }
        );

        // Tabs animation
        gsap.fromTo(tabsRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            delay: 0.8
          }
        );
      });

      return () => ctx.revert();
    }
  }, [productData]);

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }
    
    const success = await toggleWishlist(productData._id);
    if (success) {
      // Add wishlist animation
      gsap.to(event.target, { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1 });
    }
  };

  // Handle image modal
  const openImageModal = (index) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  // Handle quantity change
  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  // Enhanced add to cart with quantity
  const handleAddToCart = async () => {
    await addToCart(productData._id, selectedMeasurement, quantity);
    setAddedToCart(true);
    if (addToCartButtonRef.current) {
      animateItemAdded(addToCartButtonRef.current);
    }
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Share functionality
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: productData.name,
        text: productData.description,
        url: window.location.href,
      });
    } else {
      setShowShareModal(true);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Show success feedback
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-gray-300" />);
    }
    
    return stars;
  };

  // Calculate average rating
  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  if (!productData) {
    return (
      <PageWrapper>
        <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product...</p>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <button onClick={() => navigate('/')} className="hover:text-orange-600 transition-colors">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/collection')} className="hover:text-orange-600 transition-colors">Products</button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{productData.name}</span>
        </nav>

        {/* PRODUCT DATA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* PRODUCT IMAGES */}
          <div ref={imageGalleryRef} className="space-y-4">
            {/* Main Image */}
            <div className="relative group">
              <div className="aspect-square overflow-hidden rounded-2xl bg-gray-50">
                <img 
                  src={image} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  alt={productData.name}
                />
                <button
                  onClick={() => openImageModal(productData.image.indexOf(image))}
                  className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white"
                >
                  <FaExpand className="text-gray-700" />
                </button>
              </div>
            </div>

            {/* Thumbnail Images */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {productData.image.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setImage(item)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    image === item ? 'border-orange-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={item}
                    className="w-full h-full object-cover"
                    alt={`${productData.name} view ${i + 1}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div ref={productInfoRef} className="space-y-6">
            {/* Product Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    {productData.name}
                  </h1>
                  <p className="text-lg text-gray-600 mt-2">{productData.category}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={handleWishlistToggle}
                    className="p-3 rounded-full border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-300"
                  >
                    {isInWishlist(productData._id) ? (
                      <FaHeart className="text-red-500 text-lg" />
                    ) : (
                      <FaRegHeart className="text-gray-400 text-lg hover:text-red-500" />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                  >
                    <FaShare className="text-gray-400 text-lg hover:text-blue-500" />
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {renderStars(averageRating)}
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-gray-500">
                  ({reviews.length} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-2xl border border-orange-100">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  {currency}{getCurrentPrice()}
                </span>
              </div>
              {selectedMeasurement && (
                <p className="text-blue-600 font-medium mt-1">
                  Price for {productData.measurements?.find(m => m.value === selectedMeasurement)?.label || selectedMeasurement}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed">
                {productData.description}
              </p>
            </div>
            {/* Size/Measurement Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{measurementInfo?.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  Select {measurementInfo?.label}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {productData.measurements && productData.measurements.length > 0 ? (
                  productData.measurements.map((measurement, i) => (
                    <button
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                        measurement.value === selectedMeasurement 
                          ? "border-orange-500 bg-orange-50 shadow-lg" 
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      key={i}
                      onClick={() => setSelectedMeasurement(measurement.value)}
                    >
                      {measurement.value === selectedMeasurement && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <FaCheck className="text-white text-xs" />
                        </div>
                      )}
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{measurement.label}</div>
                        <div className="text-sm mt-1 text-blue-600 font-medium">
                          {currency}{measurement.price}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  productData.sizes?.map((item, i) => (
                    <button
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                        item === selectedMeasurement 
                          ? "border-orange-500 bg-orange-50 shadow-lg" 
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      key={i}
                      onClick={() => setSelectedMeasurement(item)}
                    >
                      {item === selectedMeasurement && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <FaCheck className="text-white text-xs" />
                        </div>
                      )}
                      <div className="font-semibold text-gray-900 text-center">{item}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-3 hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <FaMinus className="text-gray-600" />
                  </button>
                  <span className="px-6 py-3 font-semibold text-lg min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-3 hover:bg-gray-50 transition-colors"
                  >
                    <FaPlus className="text-gray-600" />
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Total: <span className="font-semibold text-gray-900">
                    {currency}{(getCurrentPrice() * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  ref={addToCartButtonRef}
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className="flex-1 relative overflow-hidden py-4 px-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-3">
                    {addedToCart ? (
                      <>
                        <FaCheck className="text-lg" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <FaShoppingCart className="text-lg" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </div>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={buyingNow}
                  className="flex-1 relative overflow-hidden py-4 px-8 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-3">
                    {buyingNow ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FaBolt className="text-lg" />
                        <span>Buy Now</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <FaShieldAlt className="text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">100% Authentic</div>
                  <div className="text-xs text-gray-600">Original products</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <FaTruck className="text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">Free Delivery</div>
                  <div className="text-xs text-gray-600">On orders above ₹500</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <FaUndo className="text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">Easy Returns</div>
                  <div className="text-xs text-gray-600">7-day return policy</div>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-xl">
              <FaPhone className="text-blue-600" />
              <span className="text-sm text-gray-700">
                Need help? Call us at 
                <a href="tel:+919876543210" className="font-semibold text-blue-600 ml-1 hover:underline">
                  +91-9876543210
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* PRODUCT DETAILS SECTION - Amazon Style */}
        <div className="space-y-12">
          
          {/* Product Details */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
            </div>
            <div className="p-6">
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed text-base">
                  {productData.description}
                </p>
                
                {/* Additional product info if needed */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center gap-2">
                        <FaCheck className="text-green-500 text-sm flex-shrink-0" />
                        100% Authentic & Original
                      </li>
                      <li className="flex items-center gap-2">
                        <FaCheck className="text-green-500 text-sm flex-shrink-0" />
                        Premium Quality
                      </li>
                      <li className="flex items-center gap-2">
                        <FaCheck className="text-green-500 text-sm flex-shrink-0" />
                        Carefully Sourced
                      </li>
                      <li className="flex items-center gap-2">
                        <FaCheck className="text-green-500 text-sm flex-shrink-0" />
                        Hygienically Packed
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Product Information</h4>
                    <div className="space-y-2 text-gray-700">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="font-medium">{productData.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sub Category:</span>
                        <span className="font-medium">{productData.subCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Brand:</span>
                        <span className="font-medium">Bihar Products</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Origin:</span>
                        <span className="font-medium">Bihar, India</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium">
                  Write a Review
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Rating Summary */}
              <div className="flex items-center gap-8 mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {renderStars(averageRating)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{reviews.length} reviews</div>
                </div>
                <div className="flex-1 max-w-md">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviews.filter(r => r.rating === rating).length;
                    const percentage = (count / reviews.length) * 100;
                    return (
                      <div key={rating} className="flex items-center gap-3 mb-2">
                        <span className="text-sm w-8">{rating}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-6">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-orange-600">
                          {review.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{review.name}</h4>
                          {review.verified && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {reviews.length > 3 && (
                  <div className="text-center pt-4">
                    <button className="text-orange-600 hover:text-orange-700 font-medium">
                      See all {reviews.length} reviews
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>



        {/* Continue Shopping CTA */}
        <div className="mt-20 py-16 text-center bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl">
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-4xl mb-4">🛍️</div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
              Continue Shopping
            </h3>
            <p className="text-lg mb-8 text-gray-600">
              Discover more authentic Bihar products in our collection
            </p>
            <button 
              onClick={() => navigate('/collection')}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:scale-105 shadow-lg"
            >
              View All Products
            </button>
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
              
              <div className="relative">
                <img
                  src={productData.image[selectedImageIndex]}
                  alt={`${productData.name} view ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                
                {productData.image.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex(
                        selectedImageIndex > 0 ? selectedImageIndex - 1 : productData.image.length - 1
                      )}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all"
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex(
                        selectedImageIndex < productData.image.length - 1 ? selectedImageIndex + 1 : 0
                      )}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all"
                    >
                      <FaChevronRight />
                    </button>
                  </>
                )}
              </div>
              
              <div className="flex justify-center mt-4 gap-2">
                {productData.image.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Share Product</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-blue-100 rounded-full">
                    <FaShare className="text-blue-600" />
                  </div>
                  <span className="text-gray-700">Copy Link</span>
                </button>
                
                <a
                  href={`https://wa.me/?text=Check out this amazing product: ${productData.name} - ${window.location.href}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-full">
                    <span className="text-green-600 font-bold">W</span>
                  </div>
                  <span className="text-gray-700">Share on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Product;
