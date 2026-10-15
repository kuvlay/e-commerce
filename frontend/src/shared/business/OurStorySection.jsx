import React from 'react';
import { FaLeaf, FaHeart, FaTruck, FaShieldAlt, FaStar, FaUsers } from 'react-icons/fa';

const OurStorySection = () => {
  const features = [
    {
      icon: FaLeaf,
      title: "100% Natural",
      description: "Pure, organic ingredients sourced from trusted suppliers worldwide",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: FaHeart,
      title: "Made with Love",
      description: "Every product crafted with passion using innovative methods and care",
      color: "from-red-500 to-pink-600"
    },
    {
      icon: FaTruck,
      title: "Fast Delivery",
      description: "Fresh products delivered quickly to your doorstep nationwide",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: FaShieldAlt,
      title: "Quality Assured",
      description: "Rigorous quality checks ensure premium standards in every batch",
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: FaStar,
      title: "Premium Products",
      description: "Handpicked selection of the finest and most sought-after products",
      color: "from-yellow-500 to-orange-600"
    },
    {
      icon: FaUsers,
      title: "1000+ Happy Customers",
      description: "Trusted by families across India for quality and excellence",
      color: "from-teal-500 to-cyan-600"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary-500 via-slate-800 to-primary-500 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, white 2px, transparent 2px), radial-gradient(circle at 80% 20%, white 2px, transparent 2px)',
          backgroundSize: '100px 100px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Our Story
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Born from a passion for quality and innovation, we bring you the finest products 
            from around the world. Every item tells a story of excellence, craftsmanship, and 
            the modern lifestyle you deserve.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {[
            { number: "1000+", label: "Happy Customers" },
            { number: "50+", label: "Premium Products" },
            { number: "5+", label: "Years Experience" },
            { number: "24/7", label: "Customer Support" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent-500 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-300 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              {/* Icon with gradient background */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="text-2xl text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-accent-500 transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              Experience Premium Quality
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl">
              Join thousands of satisfied customers who trust us for premium products. 
              From everyday essentials to luxury items, discover excellence in every purchase.
            </p>
            <button className="btn-accent px-10 py-4 text-lg font-semibold hover-lift">
              Explore Our Products
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurStorySection;