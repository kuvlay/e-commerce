// Measurement types and their common options
export const MEASUREMENT_TYPES = {
  weight: {
    label: 'Weight',
    unit: 'g/kg',
    icon: '⚖️',
    commonOptions: [
      { value: '100g', label: '100g', price: 0 },
      { value: '250g', label: '250g', price: 0 },
      { value: '500g', label: '500g', price: 0 },
      { value: '1kg', label: '1kg', price: 0 },
      { value: '2kg', label: '2kg', price: 0 },
      { value: '5kg', label: '5kg', price: 0 }
    ]
  },
  size: {
    label: 'Size',
    unit: 'S/M/L',
    icon: '📏',
    commonOptions: [
      { value: 'XS', label: 'Extra Small', price: 0 },
      { value: 'S', label: 'Small', price: 0 },
      { value: 'M', label: 'Medium', price: 0 },
      { value: 'L', label: 'Large', price: 0 },
      { value: 'XL', label: 'Extra Large', price: 0 },
      { value: 'XXL', label: 'Double XL', price: 0 }
    ]
  },
  volume: {
    label: 'Volume',
    unit: 'ml/L',
    icon: '🥤',
    commonOptions: [
      { value: '100ml', label: '100ml', price: 0 },
      { value: '250ml', label: '250ml', price: 0 },
      { value: '500ml', label: '500ml', price: 0 },
      { value: '1L', label: '1 Liter', price: 0 },
      { value: '2L', label: '2 Liters', price: 0 }
    ]
  },
  quantity: {
    label: 'Quantity',
    unit: 'pieces',
    icon: '🔢',
    commonOptions: [
      { value: '1', label: '1 piece', price: 0 },
      { value: '2', label: '2 pieces', price: 0 },
      { value: '5', label: '5 pieces', price: 0 },
      { value: '10', label: '10 pieces', price: 0 },
      { value: '12', label: '1 dozen', price: 0 },
      { value: '24', label: '2 dozen', price: 0 }
    ]
  },
  length: {
    label: 'Length',
    unit: 'cm/m',
    icon: '📐',
    commonOptions: [
      { value: '1m', label: '1 meter', price: 0 },
      { value: '2m', label: '2 meters', price: 0 },
      { value: '5m', label: '5 meters', price: 0 },
      { value: '10m', label: '10 meters', price: 0 }
    ]
  }
};

// Category to measurement type mapping
export const CATEGORY_MEASUREMENTS = {
  'Food': ['weight', 'quantity'],
  'Spices': ['weight'],
  'Snacks': ['weight', 'quantity'],
  'Beverages': ['volume', 'quantity'],
  'Sweets': ['weight', 'quantity'],
  'Clothing': ['size'],
  'Textiles': ['length', 'quantity'],
  'Handicrafts': ['size', 'quantity']
};

// Get appropriate measurement types for a category
export const getMeasurementTypesForCategory = (category) => {
  return CATEGORY_MEASUREMENTS[category] || ['weight'];
};

// Get display info for measurement type
export const getMeasurementTypeInfo = (type) => {
  return MEASUREMENT_TYPES[type] || MEASUREMENT_TYPES.weight;
};