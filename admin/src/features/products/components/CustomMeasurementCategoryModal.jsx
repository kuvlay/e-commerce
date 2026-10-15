import { useState } from "react";

const CustomMeasurementCategoryModal = ({ isOpen, onClose, onAdd, existingCategories = [] }) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryUnit, setCategoryUnit] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('📦');
  const [commonOptions, setCommonOptions] = useState([]);
  const [newOption, setNewOption] = useState({ value: '', label: '' });
  const [errors, setErrors] = useState({});

  // Predefined icon options - Fixed duplicate keys by ensuring all emoji values are unique
  const iconOptions = [
    '📦', '📏', '⚖️', '🥤', '🔢', '📐', '🏞️', '⏰', '⚡', '🎯',
    '🔧', '🎨', '💎', '🌡️', '📊', '🎪', '🎭', '🛰️', '🎬', '🎵'
  ];

  const validateForm = () => {
    const newErrors = {};

    // Validate category name
    if (!categoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
    } else if (categoryName.trim().length < 2) {
      newErrors.categoryName = 'Category name must be at least 2 characters';
    } else if (categoryName.trim().length > 50) {
      newErrors.categoryName = 'Category name must be less than 50 characters';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(categoryName.trim())) {
      newErrors.categoryName = 'Category name can only contain letters, numbers, spaces, hyphens, and underscores';
    } else if (existingCategories.some(cat => 
      (typeof cat === 'string' ? cat : cat.name).toLowerCase() === categoryName.trim().toLowerCase()
    )) {
      newErrors.categoryName = 'A category with this name already exists';
    }

    // Validate unit
    if (!categoryUnit.trim()) {
      newErrors.categoryUnit = 'Unit is required';
    } else if (categoryUnit.trim().length < 1) {
      newErrors.categoryUnit = 'Unit must be at least 1 character';
    } else if (categoryUnit.trim().length > 20) {
      newErrors.categoryUnit = 'Unit must be less than 20 characters';
    }

    // Validate common options for duplicates
    const optionValues = commonOptions.map(opt => opt.value.toLowerCase());
    const duplicateValues = optionValues.filter((value, index) => optionValues.indexOf(value) !== index);
    if (duplicateValues.length > 0) {
      newErrors.commonOptions = 'Duplicate option values found. Each option must have a unique value.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addCommonOption = () => {
    if (newOption.value.trim() && newOption.label.trim()) {
      // Check for duplicate values
      if (commonOptions.some(opt => opt.value === newOption.value.trim())) {
        setErrors({ ...errors, newOption: 'This value already exists' });
        return;
      }

      setCommonOptions([...commonOptions, {
        value: newOption.value.trim(),
        label: newOption.label.trim()
      }]);
      setNewOption({ value: '', label: '' });
      
      // Clear any previous errors
      const newErrors = { ...errors };
      delete newErrors.newOption;
      setErrors(newErrors);
    }
  };

  const removeCommonOption = (index) => {
    setCommonOptions(commonOptions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const customCategory = {
        id: `custom_${categoryName.toLowerCase().replace(/\s+/g, '_')}`,
        name: categoryName.trim(),
        unit: categoryUnit.trim(),
        icon: categoryIcon,
        commonOptions: commonOptions,
        isCustom: true
      };

      onAdd(customCategory);
      
      // Reset form
      setCategoryName('');
      setCategoryUnit('');
      setCategoryIcon('📦');
      setCommonOptions([]);
      setNewOption({ value: '', label: '' });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setCategoryName('');
    setCategoryUnit('');
    setCategoryIcon('📦');
    setCommonOptions([]);
    setNewOption({ value: '', label: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🏷️</span>
            Create Custom Measurement Category
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Area, Density, Thickness"
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                // Clear error when user starts typing
                if (errors.categoryName) {
                  const newErrors = { ...errors };
                  delete newErrors.categoryName;
                  setErrors(newErrors);
                }
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.categoryName ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              autoFocus
            />
            {errors.categoryName && (
              <p className="text-red-500 text-sm mt-1">{errors.categoryName}</p>
            )}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Unit *
            </label>
            <input
              type="text"
              placeholder="e.g., m², g/cm³, mm"
              value={categoryUnit}
              onChange={(e) => {
                setCategoryUnit(e.target.value);
                // Clear error when user starts typing
                if (errors.categoryUnit) {
                  const newErrors = { ...errors };
                  delete newErrors.categoryUnit;
                  setErrors(newErrors);
                }
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.categoryUnit ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.categoryUnit && (
              <p className="text-red-500 text-sm mt-1">{errors.categoryUnit}</p>
            )}
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-10 gap-2">
              {iconOptions.map((icon, index) => (
                <button
                  key={`${icon}-${index}`} // Fixed duplicate keys by using index as part of the key
                  type="button"
                  onClick={() => setCategoryIcon(icon)}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
                    categoryIcon === icon
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Common Options */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Common Options (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Add frequently used values for quick selection
            </p>
            
            {/* Add new option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="text"
                  placeholder="e.g., 2x2m²"
                  value={newOption.value}
                  onChange={(e) => {
                    setNewOption({ ...newOption, value: e.target.value });
                    // Clear error when user starts typing
                    if (errors.newOption) {
                      const newErrors = { ...errors };
                      delete newErrors.newOption;
                      setErrors(newErrors);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  placeholder="e.g., 2x2 square meters"
                  value={newOption.label}
                  onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            
            {errors.newOption && (
              <p className="text-red-500 text-sm mb-2">{errors.newOption}</p>
            )}
            
            <button
              type="button"
              onClick={addCommonOption}
              disabled={!newOption.value.trim() || !newOption.label.trim()}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Option
            </button>

            {/* Display added options */}
            {commonOptions.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Added Options:</h4>
                {commonOptions.map((option, index) => (
                  <div key={`option-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"> {/* Fixed duplicate keys by using unique key */}
                    <div>
                      <span className="font-medium text-sm">{option.label}</span>
                      <span className="text-gray-500 text-xs ml-2">({option.value})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCommonOption(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {categoryName && categoryUnit && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <span>👀</span>
                Preview:
              </h4>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{categoryIcon}</div>
                  <div>
                    <div className="font-semibold text-gray-800">{categoryName}</div>
                    <div className="text-sm text-gray-600">Unit: {categoryUnit}</div>
                  </div>
                </div>
                {commonOptions.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">Quick options:</div>
                    <div className="flex flex-wrap gap-1">
                      {commonOptions.slice(0, 3).map((option, index) => (
                        <span key={`preview-${index}`} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"> {/* Fixed duplicate keys by using unique key */}
                          {option.label}
                        </span>
                      ))}
                      {commonOptions.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                          +{commonOptions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Existing Categories */}
          {existingCategories && existingCategories.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                Existing Custom Categories:
              </h4>
              <div className="flex flex-wrap gap-2">
                {existingCategories
                  .filter(cat => (typeof cat === 'object' && cat.isCustom))
                  .map((cat, index) => (
                    <span
                      key={`existing-${index}`} // Fixed duplicate keys by using unique key
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      <span className="text-gray-500">({cat.unit})</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!categoryName.trim() || !categoryUnit.trim()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Category
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomMeasurementCategoryModal;