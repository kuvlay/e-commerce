import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../../../core/context/ShopContext";
import { useUser } from "../../../core/context/UserContext";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaArrowLeft, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { assets } from "../../../assets/assets";
import { validateEmailRealTime } from "../../../utils/emailValidator";
import userService from "../services/userService";

const StandaloneLogin = () => {
  const { token, setToken } = useContext(ShopContext);
  const navigate = useNavigate();
  const { login, register, loading, loginWithGoogleToken } = useUser();
  const [currentState, setCurrentState] = useState("Login");
  const [showPassword, setShowPassword] = useState(false);
  // Track Google init status for visible diagnostics
  const [googleInitStatus, setGoogleInitStatus] = useState({ ready: false, reason: '' });
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '', showError: false });

  // Animation refs
  const formRef = useRef(null);
  const googleButtonRef = useRef(null);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      let result;
      if (currentState === "Sign Up") {
        result = await register(name, email, password);
      } else {
        result = await login(email, password);
      }

      if (result.success) {
        // For signup, avoid navigating to verify page without token; just show toast
        if (currentState === "Sign Up" || result.requiresVerification) {
          toast.info('Please verify your email. We\'ve sent you a verification link.');
          // Stay on the same page; user will check email. No redirect without token.
          return;
        }
        // For login success, sync token and navigate home
        const token = localStorage.getItem('token');
        if (token) {
          setToken(token);
        }
        navigate('/', { replace: true });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token]);

  useEffect(() => {
    // Robust Google Sign-In init: run on Login state, when script loads, and with a short retry
    const initGoogleSignIn = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (currentState !== 'Login') { setGoogleInitStatus({ ready: false, reason: 'Not in Login view' }); return; }
      if (!googleButtonRef.current) { setGoogleInitStatus({ ready: false, reason: 'Google button container missing' }); return; }
      if (!clientId) { setGoogleInitStatus({ ready: false, reason: 'Missing VITE_GOOGLE_CLIENT_ID' }); return; }
      if (!window.google) { setGoogleInitStatus({ ready: false, reason: 'Google script not loaded' }); return; }
      try {
        console.debug('[Google] initializing with clientId:', clientId);
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const result = await userService.googleLogin(response.credential);
              if (result.success && result.token) {
                await loginWithGoogleToken(result.token);
                setToken(result.token);
                navigate('/', { replace: true });
              } else {
                toast.error(result.message || 'Google login failed');
              }
            } catch (error) {
              console.error('Google login error:', error);
              toast.error('Google login failed. Please try again.');
            }
          },
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
        });
        setGoogleInitStatus({ ready: true, reason: '' });
      } catch (e) {
        console.warn('Google Sign-In init failed:', e);
        setGoogleInitStatus({ ready: false, reason: 'Initialization error' });
      }
    };

    initGoogleSignIn();

    const onGoogleLoaded = () => initGoogleSignIn();
    window.addEventListener('google-loaded', onGoogleLoaded);

    let attempts = 0;
    const interval = setInterval(() => {
      if (window.google) {
        initGoogleSignIn();
        clearInterval(interval);
      } else if (++attempts >= 20) {
        clearInterval(interval);
      }
    }, 250);

    return () => {
      window.removeEventListener('google-loaded', onGoogleLoaded);
      clearInterval(interval);
    };
  }, [currentState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Navigation Options */}
      <div className="absolute top-6 left-6 flex items-center gap-4 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
        >
          <FaArrowLeft />
          <span className="hidden sm:inline">Back</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
        >
          <span className="hidden sm:inline">Home</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
            <img src={assets.logo} alt="Kharido" className="w-12 h-12 object-contain filter brightness-0 invert" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome {currentState === "Login" ? "Back" : "to Kharido"}
          </h1>
          <p className="text-gray-600">
            {currentState === "Login" 
              ? "Sign in to your account to continue shopping" 
              : "Create your account to start shopping"
            }
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form ref={formRef} onSubmit={onSubmitHandler} className="space-y-6">
            
            {/* Name Field (Sign Up only) */}
            {currentState === "Sign Up" && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Only validate for new signups, not existing logins
                  if (currentState === "Sign Up") {
                    const validation = validateEmailRealTime(e.target.value);
                    setEmailValidation(validation);
                  }
                }}
                className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 ${
                  emailValidation.showError && currentState === "Sign Up" ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              
              {/* Email validation feedback for signup only */}
              {currentState === "Sign Up" && emailValidation.message && (
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
                            setEmail(suggestion);
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

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Forgot Password (Login only) */}
            {currentState === "Login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                currentState === "Login" ? "Sign In" : "Create Account"
              )}
            </button>

            {/* Or divider and Google button on Login */}
            {currentState === 'Login' && (
              <div className="mt-6">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-gray-500 text-sm">or</span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>
                <div className="mt-4 flex flex-col items-center justify-center">
                  <div ref={googleButtonRef} />
                  {!googleInitStatus.ready && (
                    <p className="mt-2 text-xs text-gray-500">Google Sign-In not available: {googleInitStatus.reason}</p>
                  )}
                </div>
              </div>
            )}
            {currentState === "Login" && (
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-gray-600">
                  {currentState === "Login" 
                    ? "Don't have an account? " 
                    : "Already have an account? "
                  }
                  <button
                    type="button"
                    onClick={() => setCurrentState(currentState === "Login" ? "Sign Up" : "Login")}
                    className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                  >
                    {currentState === "Login" ? "Sign Up" : "Sign In"}
                  </button>
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>By continuing, you agree to our</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <button className="hover:text-orange-600 transition-colors">Terms of Service</button>
            <span>•</span>
            <button className="hover:text-orange-600 transition-colors">Privacy Policy</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandaloneLogin;