// Measurement types and their common options
export const MEASUREMENT_TYPES = {
  weight: {
    label: 'Weight',
    unit: 'g/kg',
    icon: '⚖️',
    commonOptions: [
      { value: '100g', label: '100 grams' },
      { value: '250g', label: '250 grams' },
      { value: '500g', label: '500 grams' },
      { value: '1kg', label: '1 kilogram' },
      { value: '2kg', label: '2 kilograms' },
      { value: '5kg', label: '5 kilograms' }
    ]
  },
  size: {
    label: 'Size',
    unit: 'S/M/L',
    icon: '📏',
    commonOptions: [
      { value: 'S', label: 'Small' },
      { value: 'M', label: 'Medium' },
      { value: 'L', label: 'Large' },
      { value: 'XL', label: 'Extra Large' },
      { value: '2XL', label: 'Double XL' }
    ]
  },
  quantity: {
    label: 'Quantity',
    unit: 'pieces',
    icon: '🔢',
    commonOptions: [
      { value: '1', label: '1 piece' },
      { value: '2', label: '2 pieces' },
      { value: '5', label: '5 pieces' },
      { value: '10', label: '10 pieces' },
      { value: '12', label: 'Dozen' },
      { value: '20', label: '20 pieces' }
    ]
  }
};

// Category to measurement type mapping
export const CATEGORY_MEASUREMENTS = {
  'Food': ['weight', 'quantity'],
  'Spices': ['weight'],
  'Snacks': ['weight', 'quantity'],
  'Beverages': ['volume', 'quantity'],
  'Clothing': ['size'],
  'Electronics': ['quantity'],
  'Books': ['quantity'],
  'Other': ['quantity']
};

// Get appropriate measurement types for a category
export const getMeasurementTypesForCategory = (category) => {
  return CATEGORY_MEASUREMENTS[category] || ['quantity'];
};

// Get display info for measurement type
export const getMeasurementTypeInfo = (type) => {
  return MEASUREMENT_TYPES[type] || MEASUREMENT_TYPES.weight;
};