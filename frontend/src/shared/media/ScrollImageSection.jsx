import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COLORS, GRADIENTS, SHADOWS } from '../../core/constants/theme';

gsap.registerPlugin(ScrollTrigger);

const ScrollImageSection = () => {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const gridRef = useRef(null);

  const features = [
    {
      icon: "🛍️",
      title: "Premium Shopping",
      description: "Curated collection of high-quality products for modern lifestyle",
      gradient: GRADIENTS.primary
    },
    {
      icon: "🎨",
      title: "Handcrafted",
      description: "Artisan-made products with attention to detail and quality",
      gradient: GRADIENTS.secondary
    },
    {
      icon: "✨",
      title: "Premium Quality",
      description: "Carefully selected products that meet the highest standards",
      gradient: GRADIENTS.sunset
    },
    {
      icon: "🚚",
      title: "Fast Delivery",
      description: "Quick and reliable shipping to your doorstep nationwide",
      gradient: GRADIENTS.warm
    }
  ];

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const grid = gridRef.current;

    if (!section || !header || !grid) return;

    // Header animation
    gsap.fromTo(header.children,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: header,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Grid animation
    const gridItems = grid.children;
    gsap.fromTo(gridItems,
      { opacity: 0, y: 60, scale: 0.8 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.15,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: grid,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );

  }, []);

  return (
    <section 
      ref={sectionRef}
      className="w-full py-24 relative overflow-hidden"
      style={{ background: GRADIENTS.backgroundGradient }}
    >
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: COLORS.primaryLight }}></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: COLORS.secondary }}></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-20">
          <div 
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold mb-6 text-white"
            style={{ background: GRADIENTS.secondary, boxShadow: SHADOWS.cardOrange }}
          >
            Why Choose Us
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 font-prata" style={{ color: COLORS.textPrimary }}>
            Shop Smart
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: COLORS.textSecondary }}>
            Discover amazing products curated for your modern lifestyle with unmatched quality and style
          </p>
          <div className="w-24 h-1 mx-auto mt-8 rounded-full" style={{ background: GRADIENTS.secondary }}></div>
        </div>

        {/* Features Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden hover:scale-105"
              style={{ 
                border: `2px solid ${COLORS.primary}20`,
                boxShadow: SHADOWS.cardOrange
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = SHADOWS.cardOrangeHover;
                e.currentTarget.style.borderColor = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = SHADOWS.cardOrange;
                e.currentTarget.style.borderColor = `${COLORS.primary}20`;
              }}
            >
              {/* Background Gradient on Hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: feature.gradient }}
              ></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="text-5xl mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-white transition-colors duration-300" style={{ color: COLORS.textPrimary }}>
                  {feature.title}
                </h3>
                <p className="group-hover:text-white/90 transition-colors duration-300 leading-relaxed" style={{ color: COLORS.textSecondary }}>
                  {feature.description}
                </p>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-30 group-hover:opacity-10 transition-opacity duration-300" style={{ background: COLORS.primaryLight }}></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full opacity-20 group-hover:opacity-5 transition-opacity duration-300" style={{ background: COLORS.secondary }}></div>
            </div>
          ))}
        </div>


      </div>
    </section>
  );
};

export default ScrollImageSection; 