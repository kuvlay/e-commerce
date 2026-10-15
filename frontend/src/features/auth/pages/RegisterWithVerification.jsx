import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { assets } from '../../../assets/assets';
import { validateEmailRealTime } from '../../../utils/emailValidator';
import EmailVerificationManager from '../components/EmailVerificationManager';

const RegisterWithVerification = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // 'register', 'verification'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  // Validation states
  const [emailValidation, setEmailValidation] = useState({ 
    isValid: true, 
    message: '', 
    showError: false,
    suggestions: [],
    type: 'empty'
  });
  
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: true,
    message: '',
    showError: false
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    if (field === 'email') {
      const validation = validateEmailRealTime(value);
      // normalize the shape we use in this component
      setEmailValidation({
        isValid: validation.isValid,
        message: validation.message || '',
        showError: validation.showError || false,
        suggestions: validation.suggestions || [],
        type: validation.type || (validation.isValid ? 'valid' : 'format')
      });
    }
    
    if (field === 'password') {
      validatePassword(value);
    }
  };

  // Password validation
  const validatePassword = (password) => {
    if (password.length === 0) {
      setPasswordValidation({ isValid: true, message: '', showError: false });
      return;
    }
    
    if (password.length < 8) {
      setPasswordValidation({
        isValid: false,
        message: 'Password must be at least 8 characters long',
        showError: true
      });
    } else if (!/(?=.*[a-z])/.test(password)) {
      setPasswordValidation({
        isValid: false,
        message: 'Password must contain at least one lowercase letter',
        showError: true
      });
    } else if (!/(?=.*[A-Z])/.test(password)) {
      setPasswordValidation({
        isValid: false,
        message: 'Password must contain at least one uppercase letter',
        showError: true
      });
    } else if (!/(?=.*\d)/.test(password)) {
      setPasswordValidation({
        isValid: false,
        message: 'Password must contain at least one number',
        showError: true
      });
    } else {
      setPasswordValidation({
        isValid: true,
        message: 'Strong password!',
        showError: false
      });
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    // Basic client-side email format check; backend performs domain/existence/security checks.
    if (!emailValidation.isValid) {
      toast.error(emailValidation.message || 'Please enter a valid email address');
      return;
    }
    
    if (!passwordValidation.isValid) {
      toast.error('Please fix password requirements');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.post(`${backendUrl}/api/user/register`, {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });
      
      const data = response.data;

      // If backend returned detailed emailValidation info, reflect it in UI
      if (data.emailValidation) {
        const ev = data.emailValidation;
        setEmailValidation({
          isValid: !!ev.isValid,
          message: ev.message || '',
          showError: !ev.isValid,
          suggestions: Array.isArray(ev.suggestions) ? ev.suggestions : (ev.suggestion ? [ev.suggestion] : []),
          type: ev.type || (ev.suggestions && ev.suggestions.length > 0 ? 'suggestion' : (ev.isValid ? 'valid' : 'invalid'))
        });
      }

      if (data.success) {
        toast.success(data.message || 'Registration successful');
        
        if (data.requiresVerification) {
          // move to verification step; EmailVerificationManager will use formData.email
          setStep('verification');
        } else {
          // If backend decided verification is not required, navigate to login
          navigate('/login');
        }
      } else {
        // Backend responded with success: false. Show its message and keep displayed email validation info if provided.
        if (data.message) {
          toast.error(data.message);
        } else {
          toast.error('Registration failed. Please check your input.');
        }
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // If backend provided structured response with emailValidation, use it
      const resp = error.response?.data;
      if (resp) {
        if (resp.emailValidation) {
          const ev = resp.emailValidation;
          setEmailValidation({
            isValid: !!ev.isValid,
            message: ev.message || resp.message || 'Email validation failed',
            showError: !ev.isValid,
            suggestions: Array.isArray(ev.suggestions) ? ev.suggestions : (ev.suggestion ? [ev.suggestion] : []),
            type: ev.type || (ev.suggestions && ev.suggestions.length > 0 ? 'suggestion' : (ev.isValid ? 'valid' : 'invalid'))
          });
        }

        // Prefer explicit message from backend
        if (resp.message) {
          toast.error(resp.message);
        } else {
          toast.error('Registration failed. Please try again.');
        }
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification completion
  const handleVerificationComplete = () => {
    toast.success('Email verified successfully! You can now log in.');
    navigate('/login');
  };

  if (step === 'verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
              <img src={assets.logo} alt="Kharido" className="w-12 h-12 object-contain filter brightness-0 invert" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600">
              We've sent a verification email to get you started
            </p>
          </div>

          {/* Email Verification Manager */}
          <EmailVerificationManager 
            email={formData.email}
            onVerificationComplete={handleVerificationComplete}
          />

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link 
              to="/login" 
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Already verified? Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Navigation */}
      <div className="absolute top-6 left-6 z-10">
        <Link 
          to="/login"
          className="text-gray-600 hover:text-orange-600 transition-colors"
        >
          ← Back to Login
        </Link>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
            <img src={assets.logo} alt="Kharido" className="w-12 h-12 object-contain filter brightness-0 invert" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join Kharido and start shopping with verified email security
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 ${
                  emailValidation.showError ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              
              {/* Email validation feedback */}
              {emailValidation.message && (
                <div className={`mt-2 text-sm ${
                  emailValidation.showError ? 'text-red-600' : 
                  (emailValidation.suggestions && emailValidation.suggestions.length > 0) ? 'text-blue-600' : 
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
                          onClick={() => handleInputChange('email', suggestion)}
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
                placeholder="Password (min 8 chars with upper, lower, number)"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full pl-12 pr-12 py-4 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 ${
                  passwordValidation.showError ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              
              {/* Password validation feedback */}
              {passwordValidation.message && (
                <div className={`mt-2 text-sm ${
                  passwordValidation.showError ? 'text-red-600' : 'text-green-600'
                }`}>
                  {passwordValidation.message}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !passwordValidation.isValid}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Create Account
                </>
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-orange-600 hover:text-orange-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-orange-600 hover:text-orange-700">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterWithVerification;