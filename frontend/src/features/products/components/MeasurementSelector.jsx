import React from 'react';
import { getMeasurementTypeInfo } from '../../../core/constants/measurements';

const MeasurementSelector = ({ 
  productData, 
  selectedMeasurement, 
  onMeasurementChange,
  currency = '$'
}) => {
  if (!productData) return null;

  const measurementInfo = getMeasurementTypeInfo(productData.measurementType || 'weight');
  const measurements = productData.measurements && productData.measurements.length > 0 
    ? productData.measurements 
    : productData.sizes?.map(size => ({ value: size, label: size, priceModifier: 0 })) || [];

  if (measurements.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 my-8">
      <div className="flex items-center gap-2">
        <span className="text-lg">{measurementInfo.icon}</span>
        <p className="font-medium">Select {measurementInfo.label}</p>
        <span className="text-sm text-gray-500">({measurementInfo.unit})</span>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {measurements.map((measurement, i) => (
          <button
            className={`border py-3 px-4 bg-gray-100 rounded-lg transition-all duration-200 hover:bg-gray-200 hover:shadow-md ${
              measurement.value === selectedMeasurement 
                ? "border-orange-500 bg-orange-50 shadow-md" 
                : "border-gray-300"
            }`}
            key={i}
            onClick={() => onMeasurementChange(measurement.value)}
          >
            <div className="text-sm font-medium">{measurement.label}</div>
            {measurement.priceModifier !== 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {measurement.priceModifier > 0 ? '+' : ''}{currency}{Math.abs(measurement.priceModifier)}
              </div>
            )}
          </button>
        ))}
      </div>
      
      {selectedMeasurement && (
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <span className="font-medium">Selected:</span> {
            measurements.find(m => m.value === selectedMeasurement)?.label || selectedMeasurement
          }
        </div>
      )}
    </div>
  );
};

export default MeasurementSelector;