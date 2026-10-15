import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { COLORS, GRADIENTS, SHADOWS } from "../core/constants/theme";
import { ShopContext } from "../core/context/ShopContext";
import { useUser } from "../core/context/UserContext";
import { validateEmailRealTime } from "../utils/emailValidator";
import axios from "axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  const { backendUrl } = useContext(ShopContext);
  const { user } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Auto-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '', showError: false });
  const canvasRef = useRef(null);

  const contactMethods = [
    {
      icon: "📧",
      title: "Email Us",
      info: "hello@kharido.com",
      description: "Get in touch via email",
      color: "from-blue-400 to-blue-600",
      action: "mailto:hello@kharido.com",
    },
    {
      icon: "📞",
      title: "Call Us",
      info: "+91 98765 43210",
      description: "Speak with our team",
      color: "from-green-400 to-green-600",
      action: "tel:+919876543210",
    },
    {
      icon: "📍",
      title: "Visit Us",
      info: "Business District, India",
      description: "Come see our operations",
      color: "from-purple-400 to-purple-600",
      action: "https://maps.google.com/search/Business+District+India",
    },
    {
      icon: "💬",
      title: "WhatsApp",
      info: "Chat with us",
      description: "Instant support",
      color: "from-pink-400 to-pink-600",
      action: "https://wa.me/919876543210",
    },
  ];

  const faqs = [
    {
      question: "What makes your products special?",
      answer:
        "All our products are carefully curated from trusted suppliers and undergo strict quality checks for excellence.",
    },
    {
      question: "How do you ensure freshness?",
      answer:
        "We use advanced packaging techniques and maintain cold chain logistics to preserve freshness.",
    },
    {
      question: "Do you ship nationwide?",
      answer:
        "Yes, we deliver across India with special packaging to maintain product quality during transit.",
    },
    {
      question: "What's your return policy?",
      answer:
        "We offer a 100% satisfaction guarantee with easy returns within 7 days of delivery.",
    },
  ];

  // Animated background canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${COLORS.primary}${Math.floor(particle.opacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-rotate contact cards
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % contactMethods.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate email in real-time
    if (name === 'email') {
      const validation = validateEmailRealTime(value);
      setEmailValidation(validation);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email before submission
    if (!emailValidation.isValid) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${backendUrl}/api/contact/submit`,
        formData
      );

      if (response.data.success) {
        toast.success(response.data.message);

        setFormData({ name: '', email: '', subject: '', message: '' });
        
        // Show additional success feedback
        setTimeout(() => {
          toast.info('💡 Tip: You can also reach us via WhatsApp for faster response!', {
            autoClose: 5000,
          });
        }, 2000);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {

      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');

    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle hash navigation
  useEffect(() => {
    if (window.location.hash === "#faq-section") {
      setTimeout(() => {
        const faqSection = document.getElementById("faq-section");
        if (faqSection) {
          faqSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  }, []);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.fromTo(
        ".hero-content > *",
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          stagger: 0.3,
          ease: "power3.out",
        }
      );

      // Contact cards animation
      gsap.fromTo(
        ".contact-card",
        { opacity: 0, scale: 0.8, rotateY: 90 },
        {
          opacity: 1,
          scale: 1,
          rotateY: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.7)",
          delay: 0.5,
        }
      );

      // Form animation
      gsap.fromTo(
        ".contact-form",
        { opacity: 0, x: -100 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".contact-form",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // FAQ animation
      gsap.fromTo(
        ".faq-item",
        { opacity: 0, x: 100 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".faq-section",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section with Animated Background */}
      <div
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: GRADIENTS.backgroundGradient }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 opacity-30" />

        <div className="hero-content relative z-10 text-center px-6 max-w-4xl">
          <div
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold mb-6 text-white"
            style={{
              background: GRADIENTS.secondary,
              boxShadow: SHADOWS.cardOrange,
            }}
          >
            Contact Us
          </div>
          <h1
            className="text-6xl md:text-8xl font-bold mb-8 prata-regular"
            style={{ color: COLORS.textPrimary }}
          >
            Get In Touch
          </h1>
          <p
            className="text-xl md:text-2xl mb-12 leading-relaxed"
            style={{ color: COLORS.textSecondary }}
          >
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>
          <div
            className="w-24 h-1 mx-auto mt-8 rounded-full"
            style={{ background: GRADIENTS.secondary }}
          ></div>

          {/* Floating Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.action}
                className={`contact-card block p-6 rounded-2xl bg-white transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  index === activeCard ? "scale-105 shadow-2xl" : ""
                }`}
                style={{
                  border: `2px solid ${COLORS.primary}20`,
                  boxShadow: SHADOWS.cardOrange,
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
                <div className="text-4xl mb-4">{method.icon}</div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: COLORS.textPrimary }}
                >
                  {method.title}
                </h3>
                <p
                  className="text-lg mb-2 break-all"
                  style={{ color: COLORS.primary }}
                >
                  {method.info}
                </p>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {method.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <section
        className="py-20"
        style={{ background: GRADIENTS.backgroundGradient }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div
              className="contact-form p-8 rounded-3xl shadow-xl bg-white hover:shadow-2xl transition-all duration-300"
              style={{
                border: `2px solid ${COLORS.primary}20`,
                boxShadow: SHADOWS.cardOrange,
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
              <div
                className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 text-white"
                style={{
                  background: GRADIENTS.secondary,
                  boxShadow: SHADOWS.cardOrange,
                }}
              >
                Send Message
              </div>
              <h2
                className="text-3xl font-bold mb-8 prata-regular"
                style={{ color: COLORS.textPrimary }}
              >
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 peer"
                      style={{
                        borderColor: COLORS.tertiary,
                        color: COLORS.textPrimary,
                        background: "white",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = COLORS.primary;
                        e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}1A`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = COLORS.tertiary;
                        e.target.style.boxShadow = "none";
                      }}
                      placeholder=" "
                    />
                    <label
                      className="absolute left-4 top-3 transition-all duration-300 peer-focus:-top-2 peer-focus:left-2 peer-focus:text-sm peer-focus:bg-white peer-focus:px-2 peer-valid:-top-2 peer-valid:left-2 peer-valid:text-sm peer-valid:bg-white peer-valid:px-2"
                      style={{ color: COLORS.tertiary }}
                    >
                      Your Name
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 peer ${
                        emailValidation.showError ? 'border-red-500' : ''
                      }`}
                      style={{
                        borderColor: emailValidation.showError ? '#EF4444' : COLORS.tertiary,
                        color: COLORS.textPrimary,
                        background: "white",
                      }}
                      onFocus={(e) => {
                        if (!emailValidation.showError) {
                          e.target.style.borderColor = COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}1A`;
                        }
                      }}
                      onBlur={(e) => {
                        if (!emailValidation.showError) {
                          e.target.style.borderColor = COLORS.tertiary;
                          e.target.style.boxShadow = "none";
                        }
                      }}
                      placeholder=" "
                    />
                    <label
                      className={`absolute left-4 top-3 transition-all duration-300 peer-focus:-top-2 peer-focus:left-2 peer-focus:text-sm peer-focus:bg-white peer-focus:px-2 peer-valid:-top-2 peer-valid:left-2 peer-valid:text-sm peer-valid:bg-white peer-valid:px-2 ${
                        emailValidation.showError ? 'text-red-500' : ''
                      }`}
                      style={{ color: emailValidation.showError ? '#EF4444' : COLORS.tertiary }}
                    >
                      Email Address {user ? '(Auto-filled)' : ''}
                    </label>
                    
                    {/* Email validation feedback */}
                    {emailValidation.message && (
                      <div className={`mt-2 text-sm ${
                        emailValidation.showError ? 'text-red-600' : 
                        emailValidation.type === 'suggestion' ? 'text-blue-600' : 
                        'text-green-600'
                      }`}>
                        {emailValidation.message}
                        
                        {/* Email suggestions */}
                        {emailValidation.suggestions && emailValidation.suggestions.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {emailValidation.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, email: suggestion }));
                                  setEmailValidation({ isValid: true, message: 'Email corrected', showError: false });
                                }}
                                className="block text-blue-600 hover:text-blue-800 underline text-sm"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 peer"
                    style={{
                      borderColor: COLORS.tertiary,
                      color: COLORS.textPrimary,
                      background: "white",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = COLORS.primary;
                      e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}1A`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = COLORS.tertiary;
                      e.target.style.boxShadow = "none";
                    }}
                    placeholder=" "
                  />
                  <label
                    className="absolute left-4 top-3 transition-all duration-300 peer-focus:-top-2 peer-focus:left-2 peer-focus:text-sm peer-focus:bg-white peer-focus:px-2 peer-valid:-top-2 peer-valid:left-2 peer-valid:text-sm peer-valid:bg-white peer-valid:px-2"
                    style={{ color: COLORS.tertiary }}
                  >
                    Subject
                  </label>
                </div>
                <div className="relative">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 peer resize-none"
                    style={{
                      borderColor: COLORS.tertiary,
                      color: COLORS.textPrimary,
                      background: "white",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = COLORS.primary;
                      e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}1A`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = COLORS.tertiary;
                      e.target.style.boxShadow = "none";
                    }}
                    placeholder=" "
                  />
                  <label
                    className="absolute left-4 top-3 transition-all duration-300 peer-focus:-top-2 peer-focus:left-2 peer-focus:text-sm peer-focus:bg-white peer-focus:px-2 peer-valid:-top-2 peer-valid:left-2 peer-valid:text-sm peer-valid:bg-white peer-valid:px-2"
                    style={{ color: COLORS.tertiary }}
                  >
                    Your Message
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 text-white"
                  style={{
                    background: isSubmitting
                      ? COLORS.neutral500
                      : GRADIENTS.primary,
                    boxShadow: isSubmitting ? "none" : SHADOWS.cardOrange,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.target.style.background = GRADIENTS.secondary;
                      e.target.style.boxShadow = SHADOWS.cardOrangeHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.target.style.background = GRADIENTS.primary;
                      e.target.style.boxShadow = SHADOWS.cardOrange;
                    }
                  }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            </div>

            {/* FAQ Section */}
            <div id="faq-section" className="faq-section">
              <div
                className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 text-white"
                style={{
                  background: GRADIENTS.secondary,
                  boxShadow: SHADOWS.cardOrange,
                }}
              >
                FAQ
              </div>
              <h2
                className="text-3xl font-bold mb-8 prata-regular"
                style={{ color: COLORS.textPrimary }}
              >
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="faq-item p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white"
                    style={{
                      border: `2px solid ${COLORS.primary}20`,
                      boxShadow: SHADOWS.cardOrange,
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
                    <h3
                      className="text-lg font-bold mb-3 flex items-center"
                      style={{ color: COLORS.textPrimary }}
                    >
                      <span style={{ color: COLORS.primary }} className="mr-3">
                        Q:
                      </span>
                      {faq.question}
                    </h3>
                    <p
                      className="leading-relaxed"
                      style={{ color: COLORS.textSecondary }}
                    >
                      <span
                        style={{ color: COLORS.secondary }}
                        className="mr-3"
                      >
                        A:
                      </span>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Interactive Map Section */}
      <section
        className="py-20"
        style={{ background: GRADIENTS.backgroundGradient }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold mb-6 text-white"
            style={{
              background: GRADIENTS.secondary,
              boxShadow: SHADOWS.cardOrange,
            }}
          >
            Find Us Here
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold mb-8 prata-regular"
            style={{ color: COLORS.textPrimary }}
          >
            Find Us Here
          </h2>
          <p className="text-xl mb-12" style={{ color: COLORS.textSecondary }}>
            Located in the heart of Bihar, where tradition meets innovation
          </p>
          <div
            className="w-24 h-1 mx-auto mb-12 rounded-full"
            style={{ background: GRADIENTS.secondary }}
          ></div>

          {/* Animated Location Card */}
          <div
            className="relative max-w-2xl mx-auto p-8 rounded-3xl shadow-2xl bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105"
            style={{
              border: `2px solid ${COLORS.primary}20`,
              boxShadow: SHADOWS.cardOrange,
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
            <div className="text-6xl mb-6">🏢</div>
            <h3
              className="text-2xl font-bold mb-4"
              style={{ color: COLORS.textPrimary }}
            >
              Our Headquarters
            </h3>
            <p className="text-lg mb-6" style={{ color: COLORS.textSecondary }}>
              Business District, India
              <br />
              Where innovation meets excellence
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div
                className="p-4 rounded-xl"
                style={{ background: `${COLORS.primary}10` }}
              >
                <div className="text-2xl mb-2">🕒</div>
                <div
                  className="font-semibold"
                  style={{ color: COLORS.primary }}
                >
                  Working Hours
                </div>
                <div
                  className="text-sm"
                  style={{ color: COLORS.textSecondary }}
                >
                  Mon-Sat: 9AM-6PM
                </div>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ background: `${COLORS.primary}10` }}
              >
                <div className="text-2xl mb-2">📧</div>
                <div
                  className="font-semibold"
                  style={{ color: COLORS.primary }}
                >
                  Email
                </div>
                <div
                  className="text-sm"
                  style={{ color: COLORS.textSecondary }}
                >
                  hello@kharido.com
                </div>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ background: `${COLORS.primary}10` }}
              >
                <div className="text-2xl mb-2">📞</div>
                <div
                  className="font-semibold"
                  style={{ color: COLORS.primary }}
                >
                  Phone
                </div>
                <div
                  className="text-sm"
                  style={{ color: COLORS.textSecondary }}
                >
                  +91 98765 43210
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
      </section>

      {/* Thank You CTA Section */}
      <section
        className="py-20"
        style={{ background: GRADIENTS.backgroundGradient }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-6xl mb-6">🙏</div>
          <h2
            className="text-4xl md:text-5xl font-bold mb-6 prata-regular"
            style={{ color: COLORS.textPrimary }}
          >
            Thank You for Reaching Out
          </h2>
          <p
            className="text-xl mb-12 leading-relaxed"
            style={{ color: COLORS.textSecondary }}
          >
            While you're here, explore our authentic Bihar products and discover
            the heritage we're passionate about
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => navigate("/collection")}
              className="px-12 py-4 text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{
                background: GRADIENTS.primary,
                boxShadow: SHADOWS.cardOrange,
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
              Explore Products
            </button>
            <button
              onClick={() => navigate("/about")}
              className="px-12 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: "transparent",
                border: `2px solid ${COLORS.primary}`,
                color: COLORS.primary,
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = COLORS.primary;
                e.target.style.color = COLORS.white;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = COLORS.primary;
              }}
            >
              Our Story
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
