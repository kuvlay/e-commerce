import React, { useRef, useEffect } from 'react';
import { FaCrown, FaShieldAlt, FaLeaf, FaTruck, FaHeart, FaStar } from 'react-icons/fa';

const WhyChooseUs = () => {
  const sectionRef = useRef(null);

  const features = [
    {
      icon: FaCrown,
      title: "Premium Quality",
      description: "Handpicked products that meet the highest standards of excellence and authenticity."
    },
    {
      icon: FaShieldAlt,
      title: "Trusted Brand",
      description: "Years of excellence in delivering quality products and exceptional customer service."
    },
    {
      icon: FaLeaf,
      title: "100% Natural",
      description: "Pure, organic ingredients sourced directly from trusted suppliers and artisans."
    },
    {
      icon: FaTruck,
      title: "Fast Delivery",
      description: "Quick and secure delivery to your doorstep with premium packaging."
    },
    {
      icon: FaHeart,
      title: "Made with Love",
      description: "Every product is crafted with passion using time-tested methods and modern innovation."
    },
    {
      icon: FaStar,
      title: "Customer Satisfaction",
      description: "Thousands of happy customers who trust us for quality products and excellent service."
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll('.feature-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="py-20 px-6 bg-secondary"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 bg-primary-500">
            <FaCrown className="text-2xl text-white" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
            Why Choose Our Products?
          </h2>
          
          <p className="text-xl text-secondary max-w-3xl mx-auto mb-8 leading-relaxed">
            Experience the finest selection of premium products, crafted with excellence and delivered with care.
          </p>
          
          <div className="w-20 h-1 bg-primary-500 mx-auto rounded-full"></div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card card text-center p-8 group opacity-0"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Icon */}
              <div className="relative mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500 text-white mb-4 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="text-2xl" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-4 text-primary group-hover:text-accent transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-block p-8 rounded-2xl card-premium bg-white shadow-lg">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              Ready to Experience Excellence?
            </h3>
            <p className="text-secondary mb-6 max-w-2xl leading-relaxed">
              Join thousands of satisfied customers who have made us their trusted choice for premium products.
            </p>
            <button className="btn-primary px-8 py-4 hover-lift">
              Explore Our Collection
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;