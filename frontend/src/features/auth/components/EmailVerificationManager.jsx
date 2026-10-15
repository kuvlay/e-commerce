import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaEnvelope, FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const EmailVerificationManager = ({ email, onVerificationComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Check verification status
  const checkVerificationStatus = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${backendUrl}/api/user/check-verification-status`, {
        email
      });
      
      if (response.data.success) {
        setVerificationStatus({
          isVerified: response.data.isEmailVerified,
          accountStatus: response.data.accountStatus
        });
        
        if (response.data.isEmailVerified && onVerificationComplete) {
          onVerificationComplete();
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      toast.error('Failed to check verification status');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${backendUrl}/api/user/resend-verification`, {
        email
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast.error('Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate email existence
  const validateEmailExistence = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${backendUrl}/api/user/validate-email`, {
        email
      });
      
      if (response.data.success) {
        const validation = response.data.validation;
        
        if (validation.isValid) {
          toast.success(`Email validation: ${validation.reason}`);
        } else {
          toast.error(`Email validation failed: ${validation.reason}`);
        }
      }
    } catch (error) {
      console.error('Error validating email:', error);
      toast.error('Failed to validate email');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (email) {
      checkVerificationStatus();
    }
  }, [email]);

  if (!email) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <FaEnvelope className="text-2xl text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Email Verification
        </h3>
        <p className="text-gray-600 text-sm">
          {email}
        </p>
      </div>

      {/* Verification Status */}
      {verificationStatus && (
        <div className={`mb-4 p-3 rounded-lg ${
          verificationStatus.isVerified 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            {verificationStatus.isVerified ? (
              <>
                <FaCheckCircle className="text-green-600" />
                <span className="text-green-800 font-medium">Email Verified</span>
              </>
            ) : (
              <>
                <FaExclamationTriangle className="text-yellow-600" />
                <span className="text-yellow-800 font-medium">Email Not Verified</span>
              </>
            )}
          </div>
          <p className="text-sm mt-1 text-gray-600">
            Account Status: {verificationStatus.accountStatus}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={checkVerificationStatus}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {isLoading ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaCheckCircle />
          )}
          Check Status
        </button>

        {verificationStatus && !verificationStatus.isVerified && (
          <button
            onClick={resendVerificationEmail}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:bg-orange-300 transition-colors"
          >
            {isLoading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaEnvelope />
            )}
            Resend Verification Email
          </button>
        )}

        <button
          onClick={validateEmailExistence}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
        >
          {isLoading ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaEnvelope />
          )}
          Validate Email Existence
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">How to verify your email:</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Check your email inbox</li>
          <li>2. Look for an email from Kharido E-commerce</li>
          <li>3. Click the verification link in the email</li>
          <li>4. You'll be redirected back to our site</li>
        </ol>
        
        <div className="mt-3 text-xs text-gray-500">
          <p>📧 Check your spam folder if you don't see the email</p>
          <p>⏰ Verification links expire in 24 hours</p>
          <p>🔒 Only Gmail and Outlook emails are supported</p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationManager;