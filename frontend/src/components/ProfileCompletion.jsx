import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../core/context/ShopContext';
import { useUser } from '../core/context/UserContext';
import { FaCheckCircle, FaExclamationCircle, FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaVenusMars, FaCog, FaImage, FaMapMarkerAlt } from 'react-icons/fa';

const ProfileCompletion = () => {
  const { user } = useUser();
  const [profileData, setProfileData] = useState(null);

  // Calculate profile completion based on user data
  const calculateProfileCompletion = (userData) => {
    if (!userData) return null;

    const fields = {
      name: !!userData.name,
      email: !!userData.email,
      phone: !!userData.phone,
      dateOfBirth: !!userData.dateOfBirth,
      gender: !!userData.gender,
    };

    const completedFields = Object.values(fields).filter(Boolean).length;
    const totalFields = Object.keys(fields).length;
    const percentage = Math.round((completedFields / totalFields) * 100);

    const missingFields = {};
    Object.keys(fields).forEach(field => {
      missingFields[field] = !fields[field];
    });

    return {
      completedFields,
      totalFields,
      percentage,
      missingFields
    };
  };

  useEffect(() => {
    if (user) {
      const completion = calculateProfileCompletion(user);
      setProfileData(completion);
    }
  }, [user]);

  if (!profileData) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const getFieldIcon = (field) => {
    const icons = {
      name: <FaUser className="text-blue-500" />,
      email: <FaEnvelope className="text-green-500" />,
      phone: <FaPhone className="text-purple-500" />,
      dateOfBirth: <FaBirthdayCake className="text-pink-500" />,
      gender: <FaVenusMars className="text-indigo-500" />
    };
    return icons[field] || <FaExclamationCircle className="text-gray-400" />;
  };

  const getFieldLabel = (field) => {
    const labels = {
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender'
    };
    return labels[field] || field;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (percentage) => {
    if (percentage >= 80) return 'text-green-700';
    if (percentage >= 60) return 'text-yellow-700';
    if (percentage >= 40) return 'text-orange-700';
    return 'text-red-700';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Profile Completion</h3>
        <span className={`text-sm font-medium ${getProgressTextColor(profileData.percentage)}`}>
          {profileData.percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(profileData.percentage)}`}
          style={{ width: `${profileData.percentage}%` }}
        ></div>
      </div>

      {/* Completion Status */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          {profileData.completedFields} of {profileData.totalFields} sections completed
        </p>
        
        {profileData.percentage === 100 ? (
          <div className="flex items-center gap-2 text-green-600">
            <FaCheckCircle />
            <span className="text-sm font-medium">Profile Complete!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-600">
            <FaExclamationCircle />
            <span className="text-sm font-medium">
              {profileData.totalFields - profileData.completedFields} sections remaining
            </span>
          </div>
        )}
      </div>

      {/* Missing Fields */}
      {profileData.percentage < 100 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Complete your profile:</h4>
          <div className="space-y-2">
            {Object.entries(profileData.missingFields)
              .filter(([_, isMissing]) => isMissing)
              .map(([field, _]) => (
                <div key={field} className="flex items-center gap-3 text-sm text-gray-600">
                  {getFieldIcon(field)}
                  <span>Add {getFieldLabel(field)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Completion Benefits */}
      {profileData.percentage < 100 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Complete your profile</strong> to get personalized recommendations and faster checkout!
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletion;