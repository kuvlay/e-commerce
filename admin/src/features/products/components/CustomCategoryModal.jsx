import { useState } from "react";

const CustomCategoryModal = ({ isOpen, onClose, onAdd, type, existingItems }) => {
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');

  const handleSubmit = () => {
    if (itemName.trim()) {
      onAdd({
        name: itemName.trim(),
        description: itemDescription.trim()
      });
      setItemName('');
      setItemDescription('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Add Custom {type === 'category' ? 'Category' : 'Subcategory'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {type === 'category' ? 'Category' : 'Subcategory'} Name *
            </label>
            <input
              type="text"
              placeholder={`Enter ${type === 'category' ? 'category' : 'subcategory'} name`}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              placeholder={`Brief description of this ${type === 'category' ? 'category' : 'subcategory'}`}
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
          </div>

          {/* Preview */}
          {itemName && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Preview:</h4>
              <div className="text-blue-700">
                <div className="font-medium">{itemName}</div>
                {itemDescription && (
                  <div className="text-sm text-blue-600 mt-1">{itemDescription}</div>
                )}
              </div>
            </div>
          )}

          {/* Existing Items */}
          {existingItems && existingItems.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                Existing {type === 'category' ? 'Categories' : 'Subcategories'}:
              </h4>
              <div className="flex flex-wrap gap-2">
                {existingItems.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {typeof item === 'string' ? item : item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!itemName.trim()}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add {type === 'category' ? 'Category' : 'Subcategory'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomCategoryModal;