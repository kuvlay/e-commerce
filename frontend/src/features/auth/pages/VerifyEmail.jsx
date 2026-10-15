import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  
  const token = searchParams.get('token');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      // Backend expects token as query parameter: /api/user/verify-email?token=...
      const response = await axios.get(`${backendUrl}/api/user/verify-email`, { params: { token } });
      
      if (response.data.success) {
        setStatus('success');
        setMessage('Email verified successfully! You can now login.');
        toast.success('Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Email verification failed');
        toast.error(response.data.message || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage('Email verification failed. Please try again.');
      toast.error('Email verification failed');
    }
  };

  const resendVerification = async () => {
    // This would require the user's email, which we don't have here
    // In a real app, you might want to redirect to a page where they can enter their email
    toast.info('Please contact support if you need a new verification email');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <FaTimesCircle className="text-4xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-3">
              <Link 
                to="/login"
                className="block w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go to Login
              </Link>
              
              <button
                onClick={resendVerification}
                className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Need Help?
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;