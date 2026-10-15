import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, GRADIENTS, SHADOWS } from "../../core/constants/theme";
import { ShopContext } from "../../core/context/ShopContext";
import gsap from "gsap";

const HeroBanner = () => {
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  const polygonRef = useRef(null);
  
  const heroImages = [
    {
      src: "/assets/bihar1.jpg",
      title: "Authentic Bihar Flavors",
      slogan: "Taste the tradition, feel the heritage",
      subtitle: "Premium quality products from the heart of Bihar"
    },
    {
      src: "/assets/bihar2.jpg", 
      title: "Pure & Natural",
      slogan: "From our fields to your table",
      subtitle: "Handpicked ingredients, naturally processed"
    },
    {
      src: "/assets/bihar3.jpg",
      title: "Latest Arrivals",
      slogan: "Discover our bestsellers",
      subtitle: "Fresh stock, authentic taste, unbeatable quality"
    },
    {
      src: "/assets/bihar4.jpg",
      title: "Sattu, Maruaa & More",
      slogan: "Traditional nutrition, modern convenience", 
      subtitle: "Premium ghee, fresh flour, and authentic sattu"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Animate content on image change
    const content = contentRef.current;
    if (!content) return;

    const tl = gsap.timeline();
    
    tl.fromTo(content.children, 
      { opacity: 0, y: 50, scale: 0.9 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.8, 
        stagger: 0.15,
        ease: "power3.out" 
      }
    );

    // Animate polygon overlay
    if (polygonRef.current) {
      gsap.fromTo(polygonRef.current,
        { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" },
        { 
          clipPath: "polygon(0% 0%, 70% 0%, 85% 100%, 0% 100%)",
          duration: 1.2,
          ease: "power3.out",
          delay: 0.3
        }
      );
    }

  }, [currentImage]);

  useEffect(() => {
    // Initial load animation
    const hero = heroRef.current;
    if (!hero) return;

    gsap.fromTo(hero,
      { opacity: 0 },
      { opacity: 1, duration: 1, ease: "power2.out" }
    );
  }, []);

  return (
    <section 
      ref={heroRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${COLORS.tertiary} 0%, ${COLORS.quaternary} 100%)` }}
    >
      {/* Background Images */}
      {heroImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentImage ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
          }`}
        >
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${image.src})`,
            }}
          />
        </div>
      ))}

      {/* Animated Polygon Overlay */}
      <div 
        ref={polygonRef}
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, ${COLORS.primary}E6, ${COLORS.secondary}CC, ${COLORS.accent}B3)`,
          clipPath: "polygon(0% 0%, 70% 0%, 85% 100%, 0% 100%)"
        }}
      />

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-32 h-32 border border-white/20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-32 right-32 w-16 h-16 rounded-full animate-float" style={{ backgroundColor: `${COLORS.accent}4D` }}></div>
      <div className="absolute top-1/2 right-10 w-2 h-20 bg-white/30 rounded-full"></div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div ref={contentRef} className="max-w-3xl">
            <div 
              className="inline-block px-4 py-2 backdrop-blur-sm rounded-full text-sm font-semibold mb-6 text-white"
              style={{ 
                backgroundColor: `${COLORS.accent}33`, 
                border: `1px solid ${COLORS.accent}4D`,
                boxShadow: SHADOWS.cardOrange
              }}
            >
              Premium Collection 2024
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6 text-white leading-tight font-prata">
              {heroImages[currentImage].title}
            </h1>
            
            <p className="text-2xl md:text-3xl mb-4 font-medium" style={{ color: COLORS.backgroundAlt }}>
              {heroImages[currentImage].slogan}
            </p>
            
            <p className="text-xl mb-10 leading-relaxed max-w-2xl" style={{ color: COLORS.background }}>
              {heroImages[currentImage].subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={() => navigate('/collection')}
                className="group relative px-10 py-4 bg-white rounded-full font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105"
                style={{ 
                  color: COLORS.primary,
                  boxShadow: SHADOWS.cardOrange
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = SHADOWS.cardOrangeHover;
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = SHADOWS.cardOrange;
                }}
              >
                <span className="relative z-10">Explore Collection</span>
                <div 
                  className="absolute inset-0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                  style={{ background: GRADIENTS.secondary }}
                ></div>
              </button>
              
              <button 
                onClick={() => navigate('/about')}
                className="px-10 py-4 border-2 border-white/30 text-white rounded-full font-semibold text-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:border-white/50"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Indicators */}
      <div className="absolute bottom-8 left-6 flex space-x-3 z-20">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImage(index)}
            className={`relative w-16 h-1 rounded-full transition-all duration-500 overflow-hidden ${
              index === currentImage 
                ? 'bg-white' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
          >
            {index === currentImage && (
              <div 
                className="absolute inset-0 animate-pulse"
                style={{ background: GRADIENTS.secondary }}
              ></div>
            )}
          </button>
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 flex flex-col items-center text-white/70 z-20">
        <span className="text-sm mb-2 rotate-90 origin-center">Scroll</span>
        <div className="w-px h-12 bg-white/30 relative">
          <div className="absolute top-0 w-px h-4 bg-white animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner; 