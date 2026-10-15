import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../../../core/context/ShopContext';
import { useUser } from '../../../core/context/UserContext';
import { FaPlus, FaEdit, FaTrash, FaHome, FaBriefcase, FaMapMarkerAlt, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../../../shared/styles/optional-fields.css';

const AddressManager = ({ onAddressSelect, showSelectButton = false }) => {
  const { backendUrl } = useContext(ShopContext);
  const { user } = useUser();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    type: 'home',
    name: '',
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  const [errors, setErrors] = useState({});
  const [defaultLoading, setDefaultLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Validation functions
  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
    return phoneRegex.test(phone);
  };

  const validatePincode = (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/; // Indian pincode format
    return pincodeRegex.test(pincode);
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/; // Only letters and spaces, 2-50 characters
    return nameRegex.test(name.trim());
  };

  const validateCity = (city) => {
    const cityRegex = /^[a-zA-Z\s]{2,50}$/; // Only letters and spaces
    return cityRegex.test(city.trim());
  };

  const validateState = (state) => {
    const stateRegex = /^[a-zA-Z\s]{2,50}$/; // Only letters and spaces
    return stateRegex.test(state.trim());
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Address name is required';
    }

    if (!validateName(formData.fullName)) {
      newErrors.fullName = 'Full name should contain only letters and be 2-50 characters long';
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Phone number must be a valid 10-digit Indian mobile number';
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
    }

    if (!validateCity(formData.city)) {
      newErrors.city = 'City should contain only letters and be 2-50 characters long';
    }

    if (!validateState(formData.state)) {
      newErrors.state = 'State should contain only letters and be 2-50 characters long';
    }

    if (!validatePincode(formData.pincode)) {
      newErrors.pincode = 'Pincode must be a valid 6-digit Indian pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load addresses
  const loadAddresses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${backendUrl}/api/address/list`, {
        headers: { token }
      });

      if (response.data.success) {
        setAddresses(response.data.addresses);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
      toast.error('Failed to load addresses. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = editingAddress ? '/api/address/update' : '/api/address/add';
      const payload = editingAddress 
        ? { ...formData, addressId: editingAddress._id }
        : formData;

      const response = await axios.post(`${backendUrl}${endpoint}`, payload, {
        headers: { token }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowForm(false);
        setEditingAddress(null);
        resetForm();
        loadAddresses();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Save address error:', error);
      toast.error('Failed to save address. Please check your connection and try again.');
    }
  };

  // Handle delete
  const handleDelete = async (addressId) => {
    const address = addresses.find(addr => addr._id === addressId);
    const isOnlyAddress = addresses.length === 1;
    const isDefaultAddress = address?.isDefault;
    
    let confirmMessage = 'Are you sure you want to delete this address?';
    if (isDefaultAddress && !isOnlyAddress) {
      confirmMessage = 'This is your default address. If you delete it, another address will automatically become your default. Are you sure you want to continue?';
    } else if (isOnlyAddress) {
      confirmMessage = 'This is your only address. Deleting it means you won\'t be able to place orders until you add a new address. Are you sure you want to continue?';
    }
    
    if (!window.confirm(confirmMessage)) return;

    try {
      setDeleteLoading(addressId);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${backendUrl}/api/address/delete`, 
        { addressId },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        if (isDefaultAddress && addresses.length > 1) {
          toast.info('Another address has been automatically set as default.');
        }
        loadAddresses();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Delete address error:', error);
      toast.error('Failed to delete address. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle set default
  const handleSetDefault = async (addressId) => {
    try {
      setDefaultLoading(addressId);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${backendUrl}/api/address/set-default`, 
        { addressId },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        loadAddresses();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Set default address error:', error);
      toast.error('Failed to set default address. Please try again.');
    } finally {
      setDefaultLoading(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'home',
      name: '',
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false
    });
    setErrors({});
  };

  // Handle edit
  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      type: address.type,
      name: address.name,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault
    });
    setShowForm(true);
  };

  // Get address type icon
  const getAddressIcon = (type) => {
    switch (type) {
      case 'home': return <FaHome className="text-blue-500" />;
      case 'work': return <FaBriefcase className="text-green-500" />;
      default: return <FaMapMarkerAlt className="text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading addresses...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
        <button
          onClick={() => {
            resetForm();
            setEditingAddress(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <FaPlus size={14} />
          Add Address
        </button>
      </div>

      {/* Address List */}
      <div className="space-y-3">
        {addresses.map((address) => (
          <div
            key={address._id}
            className={`p-4 border rounded-lg ${address.isDefault ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getAddressIcon(address.type)}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{address.name}</h4>
                    {address.isDefault && (
                      <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 font-medium">{address.fullName}</p>
                  <p className="text-gray-600">{address.phone}</p>
                  {/* Optimized address display with conditional rendering and dynamic spacing */}
                  <div className="address-display optional-field-container compact">
                    <span className="address-line text-gray-600">{address.addressLine1}</span>
                    {address.addressLine2 && address.addressLine2.trim() && (
                      <span className="address-line text-gray-600">{address.addressLine2}</span>
                    )}
                    <span className="address-line text-gray-600">
                      {address.city}, {address.state} - {address.pincode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {showSelectButton && (
                  <button
                    onClick={() => onAddressSelect(address)}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                  >
                    Select
                  </button>
                )}
                
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id)}
                    disabled={defaultLoading === address._id}
                    className={`p-2 transition-colors ${
                      defaultLoading === address._id 
                        ? 'text-orange-500 cursor-not-allowed' 
                        : 'text-gray-500 hover:text-orange-500'
                    }`}
                    title={defaultLoading === address._id ? 'Setting as default...' : 'Set as default'}
                  >
                    {defaultLoading === address._id ? (
                      <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaCheck size={14} />
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => handleEdit(address)}
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  title="Edit address"
                >
                  <FaEdit size={14} />
                </button>
                
                <button
                  onClick={() => handleDelete(address._id)}
                  disabled={deleteLoading === address._id}
                  className={`p-2 transition-colors ${
                    deleteLoading === address._id 
                      ? 'text-red-500 cursor-not-allowed' 
                      : 'text-gray-500 hover:text-red-500'
                  }`}
                  title={deleteLoading === address._id ? 'Deleting...' : 'Delete address'}
                >
                  {deleteLoading === address._id ? (
                    <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaTrash size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FaMapMarkerAlt className="mx-auto text-4xl mb-4 text-gray-300" />
            <p>No addresses saved yet</p>
            <p className="text-sm">Add your first address to get started</p>
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Address Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Address Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) {
                        setErrors({ ...errors, name: '' });
                      }
                    }}
                    placeholder="e.g., Home, Office, Mom's House"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Only letters and spaces
                      setFormData({ ...formData, fullName: value });
                      if (errors.fullName) {
                        setErrors({ ...errors, fullName: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                    required
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10); // Only digits, max 10
                      setFormData({ ...formData, phone: value });
                      if (errors.phone) {
                        setErrors({ ...errors, phone: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 10-digit mobile number"
                    maxLength="10"
                    required
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => {
                      setFormData({ ...formData, addressLine1: e.target.value });
                      if (errors.addressLine1) {
                        setErrors({ ...errors, addressLine1: '' });
                      }
                    }}
                    placeholder="House/Flat/Office No, Building Name"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.addressLine1 && (
                    <p className="text-red-500 text-sm mt-1">{errors.addressLine1}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    placeholder="Street, Locality, Landmark (Optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Only letters and spaces
                        setFormData({ ...formData, city: value });
                        if (errors.city) {
                          setErrors({ ...errors, city: '' });
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter city name"
                      required
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Only letters and spaces
                        setFormData({ ...formData, state: value });
                        if (errors.state) {
                          setErrors({ ...errors, state: '' });
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter state name"
                      required
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
                      setFormData({ ...formData, pincode: value });
                      if (errors.pincode) {
                        setErrors({ ...errors, pincode: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.pincode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 6-digit pincode"
                    maxLength="6"
                    required
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>
                  )}
                </div>

                {/* Set as Default */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="mr-2"
                    disabled={addresses.length === 0 && !editingAddress} // First address is automatically default
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Set as default address
                    {addresses.length === 0 && !editingAddress && (
                      <span className="text-xs text-gray-500 block">First address will be set as default automatically</span>
                    )}
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAddress(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressManager;