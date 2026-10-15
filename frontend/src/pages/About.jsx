import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, GRADIENTS, SHADOWS } from "../core/constants/theme";
import { ShopContext } from "../core/context/ShopContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const navigate = useNavigate();
  const [currentStory, setCurrentStory] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const heroRef = useRef(null);
  const valuesRef = useRef(null);
  const teamRef = useRef(null);
  const journeyRef = useRef(null);

  const stories = [
    {
      title: "Our Beginning",
      content: "In the heart of Bihar, where tradition meets innovation, our journey began with a simple dream - to bring authentic flavors to every home.",
      icon: "🌱",
      color: "from-green-400 to-blue-500"
    },
    {
      title: "The Mission",
      content: "We believe in preserving the rich culinary heritage of Bihar while making it accessible to the modern world through quality and authenticity.",
      icon: "🎯",
      color: "from-purple-400 to-pink-500"
    },
    {
      title: "Our Promise",
      content: "Every product tells a story of dedication, quality, and the timeless traditions that have been passed down through generations.",
      icon: "🤝",
      color: "from-yellow-400 to-red-500"
    }
  ];

  const team = [
    {
      name: "Rajesh Kumar",
      role: "Founder & CEO",
      image: "👨‍💼",
      description: "Passionate about bringing Bihar's authentic flavors to the world"
    },
    {
      name: "Priya Singh",
      role: "Quality Manager",
      image: "👩‍🔬",
      description: "Ensures every product meets our highest standards"
    },
    {
      name: "Amit Sharma",
      role: "Operations Head",
      image: "👨‍💻",
      description: "Streamlines our processes for better customer experience"
    }
  ];

  const values = [
    { icon: "🌿", title: "Natural", desc: "100% natural ingredients" },
    { icon: "🏆", title: "Quality", desc: "Premium quality assured" },
    { icon: "🚚", title: "Fresh", desc: "Farm to table freshness" },
    { icon: "❤️", title: "Passion", desc: "Made with love and care" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStory((prev) => (prev + 1) % stories.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleIntersection = (entries) => {
    entries.forEach((entry) => {
      setIsVisible(prev => ({
        ...prev,
        [entry.target.id]: entry.isIntersecting
      }));
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1
    });

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.fromTo(heroRef.current?.children, 
        { opacity: 0, y: 100 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1.2, 
          stagger: 0.3,
          ease: "power3.out"
        }
      );

      // Values section animation
      gsap.fromTo(valuesRef.current?.querySelectorAll('.value-card'),
        { opacity: 0, scale: 0.8, y: 50 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: valuesRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Team section animation
      gsap.fromTo(teamRef.current?.querySelectorAll('.team-card'),
        { opacity: 0, x: -100 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          stagger: 0.3,
          ease: "power3.out",
          scrollTrigger: {
            trigger: teamRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Journey timeline animation
      gsap.fromTo(journeyRef.current?.querySelectorAll('.timeline-item'),
        { opacity: 0, x: 100 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: journeyRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section - Clean & Modern */}
      <div 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
        style={{ background: GRADIENTS.backgroundGradient }}
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 2px, transparent 2px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl">
          <div 
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold mb-6 text-white"
            style={{ background: GRADIENTS.secondary, boxShadow: SHADOWS.cardOrange }}
          >
            Our Story
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 prata-regular" style={{ color: COLORS.textPrimary }}>
            Our Heritage
          </h1>
          <p className="text-xl md:text-2xl mb-12 leading-relaxed" style={{ color: COLORS.textSecondary }}>
            Preserving Bihar's rich cultural legacy through authentic products and timeless traditions
          </p>
          <div className="w-24 h-1 mx-auto mt-8 rounded-full" style={{ background: GRADIENTS.secondary }}></div>
          
          {/* Clean Story Cards */}
          <div className="relative h-80 mb-12">
            {stories.map((story, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 transform ${
                  index === currentStory 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95'
                }`}
              >
                <div 
                  className="p-8 rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all duration-300"
                  style={{ 
                    border: `2px solid ${COLORS.primary}20`,
                    boxShadow: SHADOWS.cardOrange
                  }}
                >
                  <div className="text-4xl mb-4">{story.icon}</div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.textPrimary }}>{story.title}</h3>
                  <p className="text-lg leading-relaxed" style={{ color: COLORS.textSecondary }}>{story.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Modern Navigation Indicators */}
          <div className="flex justify-center space-x-2">
            {stories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStory(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentStory ? 'w-8 bg-white' : 'w-4 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <section 
        ref={valuesRef}
        className="py-20"
        style={{ background: COLORS.background }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 prata-regular" style={{ color: COLORS.textPrimary }}>
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="value-card text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-105"
                style={{ 
                  border: `2px solid ${COLORS.primary}30`,
                  boxShadow: SHADOWS.cardOrange
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = SHADOWS.cardOrangeHover;
                  e.currentTarget.style.borderColor = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = SHADOWS.cardOrange;
                  e.currentTarget.style.borderColor = `${COLORS.primary}30`;
                }}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{value.icon}</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.textPrimary }}>{value.title}</h3>
                <p style={{ color: COLORS.textSecondary }}>{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section 
        ref={teamRef}
        className="py-20"
        style={{ background: GRADIENTS.backgroundGradient }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div 
              className="inline-block px-6 py-3 rounded-full text-sm font-semibold mb-6 text-white"
              style={{ background: GRADIENTS.secondary, boxShadow: SHADOWS.cardOrange }}
            >
              Our Team
            </div>
            <h2 className="text-4xl md:text-5xl font-bold prata-regular" style={{ color: COLORS.textPrimary }}>
              Meet Our Team
            </h2>
            <div className="w-24 h-1 mx-auto mt-8 rounded-full" style={{ background: GRADIENTS.secondary }}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {team.map((member, index) => (
              <div
                key={index}
                className="team-card text-center group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
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
                <div className="relative mb-6">
                  <div 
                    className="w-32 h-32 mx-auto rounded-full flex items-center justify-center text-6xl text-white group-hover:scale-110 transition-transform duration-300"
                    style={{ 
                      background: GRADIENTS.secondary,
                      boxShadow: SHADOWS.cardOrange
                    }}
                  >
                    {member.image}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: COLORS.textPrimary }}>{member.name}</h3>
                <p className="mb-4 font-semibold" style={{ color: COLORS.primary }}>{member.role}</p>
                <p style={{ color: COLORS.textSecondary }}>{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Journey Timeline */}
      <section 
        ref={journeyRef}
        className="py-20"
        style={{ background: GRADIENTS.backgroundGradient }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div 
              className="inline-block px-6 py-3 rounded-full text-sm font-semibold mb-6 text-white"
              style={{ background: GRADIENTS.secondary, boxShadow: SHADOWS.cardOrange }}
            >
              Our Journey
            </div>
            <h2 className="text-4xl md:text-5xl font-bold prata-regular" style={{ color: COLORS.textPrimary }}>
              Our Journey
            </h2>
            <div className="w-24 h-1 mx-auto mt-8 rounded-full" style={{ background: GRADIENTS.secondary }}></div>
          </div>
          <div className="space-y-12">
            {[
              { year: "2019", title: "The Beginning", desc: "Started with a passion for preserving Bihar's cultural heritage" },
              { year: "2021", title: "First Milestone", desc: "Reached 100 happy customers and expanded our authentic product line" },
              { year: "2023", title: "Going Digital", desc: "Launched our online platform to serve heritage lovers nationwide" },
              { year: "2024", title: "Cultural Ambassador", desc: "Became Bihar's premier cultural products marketplace with 1000+ satisfied customers" }
            ].map((milestone, index) => (
              <div key={index} className="timeline-item flex items-center space-x-8">
                <div 
                  className="flex-shrink-0 w-20 h-20 text-white rounded-full flex items-center justify-center font-bold text-lg"
                  style={{ 
                    background: GRADIENTS.secondary,
                    boxShadow: SHADOWS.cardOrange
                  }}
                >
                  {milestone.year}
                </div>
                <div className="flex-1 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300" style={{ 
                  border: `2px solid ${COLORS.primary}30`,
                  boxShadow: SHADOWS.cardOrange
                }}>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: COLORS.textPrimary }}>{milestone.title}</h3>
                  <p className="text-lg" style={{ color: COLORS.textSecondary }}>{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20" style={{ background: GRADIENTS.backgroundGradient }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div 
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold mb-6 text-white"
            style={{ background: GRADIENTS.secondary, boxShadow: SHADOWS.cardOrange }}
          >
            Ready to Experience Bihar?
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 prata-regular" style={{ color: COLORS.textPrimary }}>
            Discover Our Products
          </h2>
          <p className="text-xl mb-12 leading-relaxed" style={{ color: COLORS.textSecondary }}>
            Explore our carefully curated collection of authentic Bihar products
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => navigate('/collection')}
              className="px-12 py-4 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{ 
                background: GRADIENTS.primary,
                boxShadow: SHADOWS.cardOrange
              }}
              onMouseEnter={(e) => {
                e.target.style.background = GRADIENTS.secondary;
                e.target.style.boxShadow = SHADOWS.cardOrangeHover;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = GRADIENTS.primary;
                e.target.style.boxShadow = SHADOWS.cardOrange;
              }}
            >
              Shop Now
            </button>
            <button 
              onClick={() => navigate('/contact')}
              className="px-12 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{ 
                backgroundColor: 'transparent',
                border: `2px solid ${COLORS.primary}`,
                color: COLORS.primary
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = COLORS.primary;
                e.target.style.color = COLORS.white;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = COLORS.primary;
              }}
            >
              Get in Touch
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;