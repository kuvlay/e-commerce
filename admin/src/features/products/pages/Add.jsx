import { useState, useEffect, useRef, useCallback } from "react";
import { assets } from "../../../assets/assets";
import axios from "axios";
import { backendUrl } from "../../../App";
import { toast } from "react-toastify";
import { MEASUREMENT_TYPES, getMeasurementTypesForCategory } from "../../../constants/measurements";
import CustomCategoryModal from "../components/CustomCategoryModal";
import ConfirmationDialog from "../components/ConfirmationDialog";
import "../styles/measurement-animations.css";

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [subCategory, setSubCategory] = useState("None");
  const [sizes, setSizes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Simplified measurement system states
  const [measurementType, setMeasurementType] = useState("weight");
  const [selectedMeasurementTypes, setSelectedMeasurementTypes] = useState(new Set(["weight"]));
  const [measurements, setMeasurements] = useState([]);
  const [customMeasurement, setCustomMeasurement] = useState({ value: "", label: "", price: 0 });
  
  // Validation and error handling states
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  
  // Custom category states
  const [showCustomCategoryModal, setShowCustomCategoryModal] = useState(false);
  const [showCustomSubcategoryModal, setShowCustomSubcategoryModal] = useState(false);
  const [customCategories, setCustomCategories] = useState(() => {
    // Load custom categories from session storage on component mount
    try {
      const saved = sessionStorage.getItem('customCategories');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load custom categories from session storage:', error);
      return [];
    }
  });
  const [customSubcategories, setCustomSubcategories] = useState(() => {
    // Load custom subcategories from session storage on component mount
    try {
      const saved = sessionStorage.getItem('customSubcategories');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load custom subcategories from session storage:', error);
      return [];
    }
  });

  // Confirmation dialog states
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  // Accessibility and keyboard navigation states
  const [focusedMeasurementType, setFocusedMeasurementType] = useState(null);
  const [announceMessage, setAnnounceMessage] = useState('');
  const measurementTypeRefs = useRef({});
  const quickAddButtonRefs = useRef({});
  const measurementListRef = useRef(null);

  // Persist custom categories to session storage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem('customCategories', JSON.stringify(customCategories));
    } catch (error) {
      console.warn('Failed to save custom categories to session storage:', error);
    }
  }, [customCategories]);

  // Persist custom subcategories to session storage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem('customSubcategories', JSON.stringify(customSubcategories));
    } catch (error) {
      console.warn('Failed to save custom subcategories to session storage:', error);
    }
  }, [customSubcategories]);

  // Handle category change and update measurement type
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    
    // Check if it's a custom category
    const defaultCategories = ["Food", "Spices", "Snacks", "Beverages", "Electronics", "Books", "Other"];
    const isCustomCat = !defaultCategories.includes(newCategory);
    
    if (!isCustomCat) {
      // For predefined categories, initialize with appropriate measurement types
      const availableTypes = getMeasurementTypesForCategory(newCategory);
      setSelectedMeasurementTypes(new Set(availableTypes));
      setMeasurementType(availableTypes[0]);
    } else {
      // For custom categories, use quantity as default
      setSelectedMeasurementTypes(new Set(["quantity"]));
      setMeasurementType("quantity");
    }
    
    setMeasurements([]);
  };

  // Toggle measurement type selection with accessibility announcements
  const toggleMeasurementType = (type) => {
    const newSelectedTypes = new Set(selectedMeasurementTypes);
    const typeInfo = MEASUREMENT_TYPES[type];
    let announcement = '';
    
    if (newSelectedTypes.has(type)) {
      // Don't allow deselecting all types - keep at least one
      if (newSelectedTypes.size <= 1) {
        setAnnounceMessage("At least one measurement type must be selected");
        return;
      }
      
      newSelectedTypes.delete(type);
      announcement = `${typeInfo.label} measurement type deselected`;
      // If we're deselecting the current measurement type, switch to another selected type
      if (measurementType === type) {
        const remainingTypes = Array.from(newSelectedTypes);
        setMeasurementType(remainingTypes[0]);
      }
    } else {
      newSelectedTypes.add(type);
      announcement = `${typeInfo.label} measurement type selected`;
      // If no measurement type is currently selected, set this as the active one
      if (!measurementType) {
        setMeasurementType(type);
        announcement += ` and set as active`;
      }
    }
    
    setSelectedMeasurementTypes(newSelectedTypes);
    setAnnounceMessage(announcement);
    
    // Clear validation errors related to measurement types when user makes changes
    if (validationErrors.measurementTypes) {
      const newErrors = { ...validationErrors };
      delete newErrors.measurementTypes;
      setValidationErrors(newErrors);
    }
    
    // Clear measurements when changing selection to avoid confusion
    setMeasurements([]);
  };

  // Get measurement type info
  const getMeasurementTypeInfo = (typeId) => {
    return MEASUREMENT_TYPES[typeId] || MEASUREMENT_TYPES.weight;
  };

  // Add measurement from common options
  const addCommonMeasurement = (measurement) => {
    if (!measurements.find(m => m.value === measurement.value)) {
      const measurementWithCategory = {
        ...measurement,
        categoryId: measurementType, // Add categoryId to track which measurement type this belongs to
        categoryInfo: getMeasurementTypeInfo(measurementType) // Store category info for display
      };
      setMeasurements([...measurements, measurementWithCategory]);
    }
  };

  // Keyboard navigation for measurement types
  const handleMeasurementTypeKeyDown = useCallback((e, type) => {
    const allTypes = Array.from(selectedMeasurementTypes);
    if (!allTypes.length) return;
    
    const currentIndex = allTypes.indexOf(type);
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleMeasurementType(type);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % allTypes.length;
        const nextType = allTypes[nextIndex];
        setFocusedMeasurementType(nextType);
        measurementTypeRefs.current[nextType]?.focus();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? allTypes.length - 1 : currentIndex - 1;
        const prevType = allTypes[prevIndex];
        setFocusedMeasurementType(prevType);
        measurementTypeRefs.current[prevType]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        const firstType = allTypes[0];
        setFocusedMeasurementType(firstType);
        measurementTypeRefs.current[firstType]?.focus();
        break;
      case 'End':
        e.preventDefault();
        const lastType = allTypes[allTypes.length - 1];
        setFocusedMeasurementType(lastType);
        measurementTypeRefs.current[lastType]?.focus();
        break;
    }
  }, [selectedMeasurementTypes, toggleMeasurementType]);

  // Keyboard navigation for quick add buttons
  const handleQuickAddKeyDown = useCallback((e, measurement) => {
    const typeInfo = getMeasurementTypeInfo(measurementType);
    const commonOptions = typeInfo?.commonOptions || [];
    const currentIndex = commonOptions.findIndex(m => m.value === measurement.value);
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        addCommonMeasurement({ ...measurement, price: 0 });
        setCustomMeasurement({ value: "", label: "", price: 0 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % commonOptions.length;
        const nextMeasurement = commonOptions[nextIndex];
        quickAddButtonRefs.current[nextMeasurement.value]?.focus();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? commonOptions.length - 1 : currentIndex - 1;
        const prevMeasurement = commonOptions[prevIndex];
        quickAddButtonRefs.current[prevMeasurement.value]?.focus();
        break;
    }
  }, [measurementType, addCommonMeasurement, setCustomMeasurement]);

  // Remove measurement with confirmation
  const removeMeasurement = (index) => {
    const measurement = measurements[index];
    setConfirmationDialog({
      isOpen: true,
      title: 'Remove Measurement',
      message: `Are you sure you want to remove "${measurement.label}" (${measurement.value})?`,
      onConfirm: () => {
        setMeasurements(measurements.filter((_, i) => i !== index));
        setConfirmationDialog({ ...confirmationDialog, isOpen: false });
        toast.success('Measurement removed successfully');
      },
      type: 'danger'
    });
  };

  // Close confirmation dialog
  const closeConfirmationDialog = () => {
    setConfirmationDialog({ ...confirmationDialog, isOpen: false });
  };

  // Get tooltip content for measurement types
  const getMeasurementTypeTooltip = (type) => {
    const tooltips = {
      weight: 'Perfect for products sold by weight like grains, spices, or bulk items.',
      size: 'Ideal for clothing, accessories, or items with standard sizing.',
      quantity: 'Best for items sold by count or pieces. Perfect for products like books, electronics.'
    };
    return tooltips[type] || 'Measurement type for product variants.';
  };

  // Validation functions
  const validateMeasurementTypeSelection = () => {
    const errors = {};
    
    // Ensure at least one measurement type is selected
    if (selectedMeasurementTypes.size === 0) {
      errors.measurementTypes = "Please select at least one measurement type for your product";
    }
    
    // Ensure we have measurements
    if (measurements.length === 0) {
      errors.measurements = "Please add at least one measurement option for your product";
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const validationErrors = validateMeasurementTypeSelection();
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors(validationErrors);
      setShowValidationSummary(true);
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await axios.post(`${backendUrl}/api/products`, {
        name,
        description,
        category,
        subCategory,
        sizes,
        measurements,
        images: [image1, image2, image3, image4].filter(Boolean)
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Product added successfully');
      console.log(response.data);
    } catch (error) {
      toast.error('Failed to add product');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const validateCustomMeasurementCategory = (categoryData) => {
    const errors = {};
    
    // Validate category name
    if (!categoryData.name || categoryData.name.trim().length < 2) {
      errors.categoryName = "Category name must be at least 2 characters long";
    }
    
    // Check for duplicate names
    const existingNames = customMeasurementCategories.map(cat => cat.name.toLowerCase());
    if (existingNames.includes(categoryData.name.toLowerCase())) {
      errors.categoryName = "A custom measurement category with this name already exists";
    }
    
    // Validate unit
    if (!categoryData.unit || categoryData.unit.trim().length < 1) {
      errors.categoryUnit = "Unit is required and must be at least 1 character";
    }
    
    return errors;
  };

  const validateMeasurementValue = (measurementValue, categoryId = null) => {
    const errors = {};
    
    // Check for duplicate measurement values
    const existingValues = measurements.map(m => m.value.toLowerCase());
    if (existingValues.includes(measurementValue.toLowerCase())) {
      errors.duplicateValue = `A measurement with value "${measurementValue}" already exists`;
    }
    
    // Validate measurement value format based on category
    if (categoryId) {
      const categoryInfo = getMeasurementTypeInfo(categoryId);
      
      // Basic validation for different measurement types
      if (categoryId === 'weight' && measurementValue) {
        const weightPattern = /^\d+(\.\d+)?\s*(g|kg|gm|gram|grams|kilogram|kilograms)$/i;
        if (!weightPattern.test(measurementValue.trim())) {
          errors.formatError = "Weight measurements should include units (e.g., '500g', '1kg')";
        }
      } else if (categoryId === 'volume' && measurementValue) {
        const volumePattern = /^\d+(\.\d+)?\s*(ml|l|liter|liters|milliliter|milliliters)$/i;
        if (!volumePattern.test(measurementValue.trim())) {
          errors.formatError = "Volume measurements should include units (e.g., '500ml', '1l')";
        }
      }
    }
    
    return errors;
  };

  const validateFormBeforeSubmission = () => {
    const errors = {};
    
    // Basic required fields
    if (!name || name.trim().length < 2) {
      errors.name = "Product name is required and must be at least 2 characters";
    }
    
    if (!description || description.trim().length < 10) {
      errors.description = "Product description is required and must be at least 10 characters";
    }
    
    if (!category) {
      errors.category = "Please select a product category";
    }
    
    // Image validation
    if (!image1) {
      errors.image = "At least one product image is required";
    }
    
    // Measurement validation - updated to properly handle custom measurements
    const measurementTypeErrors = validateMeasurementTypeSelection();
    Object.assign(errors, measurementTypeErrors);
    
    if (measurements.length === 0) {
      errors.measurements = "Please add at least one measurement option for your product";
    }
    
    // Validate each measurement has a valid price
    const invalidPriceMeasurements = measurements.filter(m => !m.price || m.price <= 0);
    if (invalidPriceMeasurements.length > 0) {
      errors.measurementPrices = `${invalidPriceMeasurements.length} measurement(s) have invalid prices. All measurements must have a price greater than 0`;
    }
    
    // Validate custom measurement categories if any exist
    customMeasurementCategories.forEach((category, index) => {
      const categoryErrors = validateCustomMeasurementCategory(category);
      if (Object.keys(categoryErrors).length > 0) {
        errors[`customCategory_${index}`] = `Custom category "${category.name}" has validation errors`;
      }
    });
    
    return errors;
  };

  // Enhanced add custom measurement with validation
  const addCustomMeasurement = () => {
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate input
    if (!customMeasurement.value || !customMeasurement.value.trim()) {
      setValidationErrors({ customMeasurement: "Measurement value is required" });
      toast.error("Please enter a measurement value");
      return;
    }
    
    if (!customMeasurement.price || customMeasurement.price <= 0) {
      setValidationErrors({ customMeasurement: "Price must be greater than 0" });
      toast.error("Please set a price greater than 0");
      return;
    }
    
    // Validate for duplicates and format
    const valueErrors = validateMeasurementValue(customMeasurement.value, measurementType);
    if (Object.keys(valueErrors).length > 0) {
      setValidationErrors({ customMeasurement: Object.values(valueErrors)[0] });
      toast.error(Object.values(valueErrors)[0]);
      return;
    }
    
    // If validation passes, add the measurement
    const measurementToAdd = {
      value: customMeasurement.value.trim(),
      label: customMeasurement.label?.trim() || customMeasurement.value.trim(),
      price: Number(customMeasurement.price),
      categoryId: measurementType || 'custom',
      categoryInfo: measurementType ? getMeasurementTypeInfo(measurementType) : { label: 'Custom', icon: '🏷️', unit: '', isCustom: true }
    };
    
    setMeasurements([...measurements, measurementToAdd]);
    setCustomMeasurement({ value: "", label: "", price: 0 });
    setValidationErrors({});
    toast.success(`Added measurement: ${measurementToAdd.label}`);
  };

  // Update measurement price
  const updateMeasurementPrice = (index, price) => {
    const updated = [...measurements];
    updated[index].price = Number(price);
    setMeasurements(updated);
  };

  // Add custom category
  const addCustomCategory = (categoryData) => {
    setCustomCategories(prev => [...prev, categoryData.name]);
  };

  // Add custom subcategory
  const addCustomSubcategory = (subcategoryData) => {
    setCustomSubcategories(prev => [...prev, subcategoryData.name]);
  };

  // Add custom measurement category
  const addCustomMeasurementCategory = (categoryData) => {
    setCustomMeasurementCategories(prev => [...prev, categoryData]);
    // If no measurement types are currently selected, activate this custom category
    if (selectedMeasurementTypes.size === 0) {
      setSelectedMeasurementTypes(new Set([categoryData.id]));
      setMeasurementType(categoryData.id);
    }
  };

  // Remove custom measurement category with confirmation
  const removeCustomMeasurementCategory = (categoryId) => {
    const categoryToRemove = customMeasurementCategories.find(cat => cat.id === categoryId);
    if (!categoryToRemove) return;

    // Check if there are measurements using this category
    const measurementsUsingCategory = measurements.filter(m => m.categoryId === categoryId);
    
    let confirmMessage = `Are you sure you want to delete the custom measurement category "${categoryToRemove.name}"?`;
    if (measurementsUsingCategory.length > 0) {
      confirmMessage += `\n\nThis will also remove ${measurementsUsingCategory.length} measurement${measurementsUsingCategory.length > 1 ? 's' : ''} that use this category.`;
    }

    setConfirmationDialog({
      isOpen: true,
      title: 'Delete Custom Category',
      message: confirmMessage,
      onConfirm: () => {
        // Remove the custom category
        setCustomMeasurementCategories(prev => prev.filter(cat => cat.id !== categoryId));
        
        // Remove from selected measurement types
        const newSelectedTypes = new Set(selectedMeasurementTypes);
        newSelectedTypes.delete(categoryId);
        setSelectedMeasurementTypes(newSelectedTypes);
        
        // If this was the active measurement type, switch to another or clear
        if (measurementType === categoryId) {
          const remainingTypes = Array.from(newSelectedTypes);
          setMeasurementType(remainingTypes.length > 0 ? remainingTypes[0] : null);
        }
        
        // Remove all measurements that use this category
        setMeasurements(prev => prev.filter(m => m.categoryId !== categoryId));
        
        setConfirmationDialog({ ...confirmationDialog, isOpen: false });
        toast.success(`Custom measurement category "${categoryToRemove.name}" has been deleted.`);
      },
      type: 'danger'
    });
  };

  // Get all available categories
  const getAllCategories = () => {
    const defaultCategories = ["Food", "Spices", "Snacks", "Beverages", "Sweets", "Clothing", "Textiles", "Handicrafts"];
    return [...defaultCategories, ...customCategories];
  };





  // Check if current category is a custom category
  const isCustomCategory = () => {
    const defaultCategories = ["Food", "Spices", "Snacks", "Beverages", "Sweets", "Clothing", "Textiles", "Handicrafts"];
    return !defaultCategories.includes(category);
  };

  // Helper functions to determine which UI sections to show/hide
  const shouldShowMeasurementTypeSelection = () => {
    return !isCustomCategory();
  };

  const shouldShowQuickAddMeasurements = () => {
    // Hide Quick Add Measurements section when no measurement types are selected
    if (isCustomCategory()) return false;
    if (selectedMeasurementTypes.size === 0) return false;
    if (!measurementType || !selectedMeasurementTypes.has(measurementType)) return false;
    return true;
  };

  const shouldShowStandardQuickAddButtons = () => {
    // Hide standard quick-add buttons when only custom categories are used
    if (isCustomCategory()) return false;
    if (selectedMeasurementTypes.size === 0) return false;
    if (!measurementType || !selectedMeasurementTypes.has(measurementType)) return false;
    
    const typeInfo = getMeasurementTypeInfo(measurementType);
    return typeInfo?.commonOptions?.length > 0;
  };

  const shouldShowDivider = () => {
    // Only show divider when both quick-add and custom sections are visible
    return shouldShowStandardQuickAddButtons() && !isCustomCategory();
  };

  const shouldShowCustomMeasurementSection = () => {
    // Always show custom measurement section, but content varies based on state
    return true;
  };

  const getCustomMeasurementSectionContent = () => {
    if (isCustomCategory()) {
      return {
        title: "Add Product Measurements",
        description: "Define how customers can purchase this product (e.g., by weight, size, quantity, etc.)"
      };
    } else if (selectedMeasurementTypes.size === 0) {
      return {
        title: "No Measurement Types Selected",
        description: "Please select at least one measurement type above to add measurements, or add custom measurements here."
      };
    } else if (!measurementType || !selectedMeasurementTypes.has(measurementType)) {
      return {
        title: "Custom Measurement",
        description: "Select an active measurement type above to use quick-add, or add custom measurements here."
      };
    } else {
      return {
        title: "Custom Measurement",
        description: "Add a specific measurement not in the quick-add list."
      };
    }
  };

  const shouldShowMeasurementsList = () => {
    // Always show measurements list for feedback
    return true;
  };

  const shouldShowMeasurementPanel = () => {
    // Show measurement panel when there are selected types or it's a custom category
    return isCustomCategory() || selectedMeasurementTypes.size > 0;
  };

  const getMeasurementPanelVisibilityClass = () => {
    // Add visual feedback for when measurement panel is disabled
    if (!shouldShowMeasurementPanel()) {
      return "opacity-50 pointer-events-none";
    }
    return "";
  };

  const shouldShowNoSelectionMessage = () => {
    // Show message when no measurement types are selected for predefined categories
    return !isCustomCategory() && selectedMeasurementTypes.size === 0;
  };

  const getNoSelectionMessage = () => {
    return {
      title: "Select Measurement Types",
      description: "Please select at least one measurement type above to start adding product measurements. You can select multiple types if your product can be sold in different ways."
    };
  };

  // Get all available subcategories
  const getAllSubcategories = () => {
    const defaultSubcategories = ["Organic", "Traditional", "Premium", "Handmade"];
    return [...defaultSubcategories, ...customSubcategories];
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    console.log("🚀 FRONTEND: Starting product submission...");
    console.log("📋 FRONTEND: Form data validation:");
    console.log("  - Name:", name);
    console.log("  - Description:", description);
    console.log("  - Category:", category);
    console.log("  - SubCategory:", subCategory);
    console.log("  - MeasurementType:", measurementType);
    console.log("  - Measurements:", measurements);
    console.log("  - Images:", { image1: !!image1, image2: !!image2, image3: !!image3, image4: !!image4 });
    console.log("  - Backend URL:", backendUrl);
    console.log("  - Token exists:", !!token);
    
    // Comprehensive form validation
    const formErrors = validateFormBeforeSubmission();
    
    if (Object.keys(formErrors).length > 0) {
      console.error("❌ FRONTEND: Validation failed:", formErrors);
      setValidationErrors(formErrors);
      setShowValidationSummary(true);
      
      // Show the first error as a toast
      const firstError = Object.values(formErrors)[0];
      toast.error(firstError);
      
      setIsSubmitting(false);
      return;
    }
    
    // Clear any previous validation errors
    setValidationErrors({});
    setShowValidationSummary(false);
    
    try {
      console.log("📦 FRONTEND: Creating FormData...");
      const formData = new FormData();

      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("subCategory", subCategory === "None" ? "" : subCategory);
      formData.append("sizes", JSON.stringify(sizes));
      // For custom categories, use "custom" as measurement type, otherwise use the selected type
      formData.append("measurementType", isCustomCategory() ? "custom" : measurementType);
      
      // Enhanced measurements with category information
      const enhancedMeasurements = measurements.map(measurement => ({
        value: measurement.value,
        label: measurement.label,
        price: measurement.price,
        categoryId: measurement.categoryId,
        categoryInfo: measurement.categoryInfo
      }));
      formData.append("measurements", JSON.stringify(enhancedMeasurements));
      
      // Include custom measurement categories data
      if (customMeasurementCategories.length > 0) {
        formData.append("customMeasurementCategories", JSON.stringify(customMeasurementCategories));
      }
      
      // Include selected measurement types
      formData.append("selectedMeasurementTypes", JSON.stringify(Array.from(selectedMeasurementTypes)));

      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      console.log("📤 FRONTEND: Sending request to:", backendUrl + "/api/product/add");
      console.log("🔑 FRONTEND: Request headers:", { token: token ? "Present" : "Missing" });

      const response = await axios.post(
        backendUrl + "/api/product/add",
        formData,
        { headers: { token } }
      );

      console.log("📥 FRONTEND: Response received:", response.data);
      console.log("✅ FRONTEND: Response status:", response.status);

      if (response.data.success) {
        console.log("🎉 FRONTEND: Product added successfully!");
        toast.success(response.data.message);
        // Reset form
        setName("");
        setDescription("");
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setSizes([]);
        setCategory("Food");
        setSubCategory("None");
        setMeasurementType("weight");
        setSelectedMeasurementTypes(new Set(getMeasurementTypesForCategory("Food")));
        setMeasurements([]);
        setCustomMeasurement({ value: "", label: "", price: 0 });
        // Note: We don't reset customMeasurementCategories as they should persist for the session
      } else {
        console.error("❌ FRONTEND: Backend returned error:", response.data.message);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("💥 FRONTEND: Request failed with error:", error);
      console.error("💥 FRONTEND: Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      if (error.response) {
        toast.error(`Server Error: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        toast.error("Network Error: Could not connect to server");
      } else {
        toast.error(error.message || "Failed to add product");
      }
    } finally {
      console.log("🏁 FRONTEND: Request completed, resetting loading state");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <h1>Add New Product</h1>
        <p>Fill out the form below to add a new product to your inventory.</p>
      </div>

      <form onSubmit={onSubmitHandler} className="add-product-form" noValidate>
        {/* Product Name and Description */}
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="product-name">Product Name</label>
              <input
                type="text"
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Organic Turmeric Powder"
                required
                aria-required="true"
                aria-describedby={validationErrors.name ? "name-error" : ""}
              />
              {validationErrors.name && <p id="name-error" className="error-message">{validationErrors.name}</p>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="product-description">Product Description</label>
              <textarea
                id="product-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the product, its benefits, and usage."
                required
                aria-required="true"
                aria-describedby={validationErrors.description ? "description-error" : ""}
              />
              {validationErrors.description && <p id="description-error" className="error-message">{validationErrors.description}</p>}
            </div>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="form-section">
          <h2>Product Images</h2>
          <p>Upload up to 4 images. The first image will be the main display image.</p>
          <div className="image-upload-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="image-upload-slot">
                <label htmlFor={`image${i}`} className="image-upload-label">
                  {eval(`image${i}`) ? (
                    <img src={URL.createObjectURL(eval(`image${i}`))} alt={`Preview ${i}`} className="image-preview" />
                  ) : (
                    <div className="image-placeholder">
                      <i className="fas fa-camera"></i>
                      <span>{i === 1 ? "Main Image" : `Image ${i}`}</span>
                    </div>
                  )}
                </label>
                <input
                  type="file"
                  id={`image${i}`}
                  onChange={(e) => eval(`setImage${i}`)(e.target.files[0])}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            ))}
          </div>
          {validationErrors.image && <p className="error-message">{validationErrors.image}</p>}
        </div>

        {/* Category and Subcategory Selection */}
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category-select">Category</label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                aria-describedby={validationErrors.category ? "category-error" : ""}
              >
                {getAllCategories().map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              {validationErrors.category && <p id="category-error" className="error-message">{validationErrors.category}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="subcategory-select">Subcategory</label>
              <select
                id="subcategory-select"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              >
                <option value="None">None</option>
                {getAllSubcategories().map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>
          <div className="custom-category-buttons">
            <button type="button" onClick={() => setShowCustomCategoryModal(true)} className="btn-secondary">
              <i className="fas fa-plus-circle"></i> Add Custom Category
            </button>
            <button type="button" onClick={() => setShowCustomSubcategoryModal(true)} className="btn-secondary">
              <i className="fas fa-plus-circle"></i> Add Custom Subcategory
            </button>
          </div>
        </div>

        {/* Measurement System */}
        <div className="form-section measurement-section">
          <h2>How do you want to sell this product?</h2>
          <p>Select how this product is measured (e.g., by weight, size, or quantity). You can select multiple options.</p>

          {/* Custom Measurement Category Button */}
          <div className="custom-measurement-category-controls">
            <button type="button" className="btn-secondary" onClick={() => setShowCustomMeasurementCategoryModal(true)}>
              <i className="fas fa-ruler-combined"></i> Add Custom Measurement Category
            </button>
          </div>

          {/* Measurement Type Selection */}
          {shouldShowMeasurementTypeSelection() && (
            <div className="measurement-type-selection">
              <div className="measurement-type-list" role="group" aria-label="Select measurement types">
                {Object.values(MEASUREMENT_TYPES).map(type => (
                  <div
                    key={type.id}
                    role="checkbox"
                    aria-checked={selectedMeasurementTypes.has(type.id)}
                    tabIndex={0}
                    ref={el => measurementTypeRefs.current[type.id] = el}
                    className={`measurement-type-item ${selectedMeasurementTypes.has(type.id) ? 'selected' : ''}`}
                    onClick={() => toggleMeasurementType(type.id)}
                    onKeyDown={(e) => handleMeasurementTypeKeyDown(e, type.id)}
                    data-tooltip-id="measurement-type-tooltip"
                    data-tooltip-content={getMeasurementTypeTooltip(type.id)}
                  >
                    <span className="measurement-type-icon">{type.icon}</span>
                    <span className="measurement-type-label">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Measurement Category Management */}
          {customMeasurementCategories.length > 0 && (
            <div className="custom-measurement-category-list">
              {customMeasurementCategories.map(cat => (
                <div
                  key={cat.id}
                  role="checkbox"
                  aria-checked={selectedMeasurementTypes.has(cat.id)}
                  tabIndex={0}
                  ref={el => measurementTypeRefs.current[cat.id] = el}
                  className={`measurement-type-item custom-cat-item ${selectedMeasurementTypes.has(cat.id) ? 'selected' : ''}`}
                  onClick={() => toggleMeasurementType(cat.id)}
                  onKeyDown={(e) => handleMeasurementTypeKeyDown(e, cat.id)}
                  data-tooltip-id="measurement-type-tooltip"
                  data-tooltip-content={`Custom category: ${cat.name} (Unit: ${cat.unit})`}
                >
                  <span className="measurement-type-icon">{cat.icon || '🏷️'}</span>
                  <span className="measurement-type-label">{cat.name}</span>
                  <button
                    type="button"
                    className="delete-custom-cat-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomMeasurementCategory(cat.id);
                    }}
                    aria-label={`Delete custom category ${cat.name}`}
                    data-tooltip-id="delete-tooltip"
                    data-tooltip-content="Delete this custom category"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Active Type Selector and Summary */}
          <div className="active-type-selector">
            <label htmlFor="active-measurement-type">Active Measurement Type:</label>
            <select
              id="active-measurement-type"
              value={measurementType || ''}
              onChange={(e) => setMeasurementType(e.target.value)}
              disabled={selectedMeasurementTypes.size === 0}
            >
              {Array.from(selectedMeasurementTypes).map(typeId => {
                const typeInfo = MEASUREMENT_TYPES[typeId] || customMeasurementCategories.find(c => c.id === typeId);
                return typeInfo ? <option key={typeId} value={typeId}>{typeInfo.label || typeInfo.name}</option> : null;
              })}
            </select>
            <div className="selection-summary">
              <span>{selectedMeasurementTypes.size} type(s) selected</span>
              {validationErrors.measurementTypes && <p className="error-message-inline">{validationErrors.measurementTypes}</p>}
            </div>
          </div>

          {/* Message for custom category selection */}
          {isCustomCategory() && (
            <div className="info-box">
              <p>You've selected a custom category. Measurements will be added without predefined types. Define them below.</p>
            </div>
          )}

          {/* Message for no selection */}
          {shouldShowNoSelectionMessage() && (
            <div className="info-box no-selection-message">
              <h3>{getNoSelectionMessage().title}</h3>
              <p>{getNoSelectionMessage().description}</p>
            </div>
          )}

          {/* Quick Add Measurements Section */}
          <div className={`measurement-panel ${getMeasurementPanelVisibilityClass()}`}>
            {shouldShowQuickAddMeasurements() && (
              <div className="quick-add-section">
                <h4>Quick Add Measurements</h4>
                <div className="quick-add-buttons">
                  {shouldShowStandardQuickAddButtons() && getMeasurementTypeInfo(measurementType).commonOptions.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      ref={el => quickAddButtonRefs.current[m.value] = el}
                      className="btn-quick-add"
                      onClick={() => addCommonMeasurement({ ...m, price: 0 })}
                      onKeyDown={(e) => handleQuickAddKeyDown(e, m)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {shouldShowDivider() && <hr className="section-divider" />}

            {/* Custom Measurement Input Section */}
            {shouldShowCustomMeasurementSection() && (
              <div className="custom-measurement-section">
                <h4>{getCustomMeasurementSectionContent().title}</h4>
                <p>{getCustomMeasurementSectionContent().description}</p>
                <div className="custom-measurement-inputs">
                  <div className="form-group">
                    <label htmlFor="custom-measurement-value">Value</label>
                    <input
                      type="text"
                      id="custom-measurement-value"
                      value={customMeasurement.value}
                      onChange={(e) => setCustomMeasurement({ ...customMeasurement, value: e.target.value })}
                      placeholder={`e.g., 250g, Large, 12-pack`}
                      aria-describedby={validationErrors.customMeasurement ? "custom-measurement-error" : ""}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="custom-measurement-price">Price ($)</label>
                    <input
                      type="number"
                      id="custom-measurement-price"
                      value={customMeasurement.price}
                      onChange={(e) => setCustomMeasurement({ ...customMeasurement, price: e.target.value })}
                      placeholder="e.g., 15.99"
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <button type="button" className="btn-primary" onClick={addCustomMeasurement}>
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
                {validationErrors.customMeasurement && <p id="custom-measurement-error" className="error-message">{validationErrors.customMeasurement}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Selected Measurements List */}
        {shouldShowMeasurementsList() && (
          <div className="form-section">
            <h2>Selected Measurements</h2>
            {measurements.length === 0 ? (
              <p>No measurements added yet. Use the section above to add options for your customers.</p>
            ) : (
              <div className="measurements-list" ref={measurementListRef}>
                {Object.entries(
                  measurements.reduce((acc, m) => {
                    const categoryId = m.categoryId || 'custom';
                    if (!acc[categoryId]) {
                      acc[categoryId] = {
                        info: m.categoryInfo || { label: 'Custom', icon: '🏷️' },
                        items: []
                      };
                    }
                    acc[categoryId].items.push(m);
                    return acc;
                  }, {})
                ).map(([categoryId, group], groupIndex) => (
                  <div key={categoryId} className="measurement-group">
                    <h3>{group.info.icon} {group.info.label}</h3>
                    <ul className="measurement-items">
                      {group.items.map((m, index) => (
                        <li key={index} className="measurement-item">
                          <span className="measurement-label">{m.label}</span>
                          <div className="measurement-price-input">
                            <label htmlFor={`price-${index}`}>Price</label>
                            <input
                              type="number"
                              id={`price-${index}`}
                              value={m.price}
                              onChange={(e) => updateMeasurementPrice(measurements.indexOf(m), e.target.value)}
                              min="0.01"
                              step="0.01"
                            />
                          </div>
                          <button type="button" className="btn-remove" onClick={() => removeMeasurement(measurements.indexOf(m))}>
                            <i className="fas fa-times"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {validationErrors.measurements && <p className="error-message">{validationErrors.measurements}</p>}
            {validationErrors.measurementPrices && <p className="error-message">{validationErrors.measurementPrices}</p>}
          </div>
        )}

        {/* Validation Summary */}
        {showValidationSummary && Object.keys(validationErrors).length > 0 && (
          <div className="validation-summary" role="alert">
            <h3>Please correct the following errors:</h3>
            <ul>
              {Object.entries(validationErrors).map(([key, message]) => (
                <li key={key}>{message}</li>
              ))}
            </ul>
            <button type="button" onClick={() => setShowValidationSummary(false)} className="btn-dismiss">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* Submission Button */}
        <div className="form-submission">
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Submitting...
              </>
            ) : (
              'Add Product'
            )}
          </button>
        </div>
      </form>

      {/* Modals and Dialogs */}
      {showCustomCategoryModal && (
        <CustomCategoryModal
          onClose={() => setShowCustomCategoryModal(false)}
          onAdd={addCustomCategory}
        />
      )}
      {showCustomSubcategoryModal && (
        <CustomSubcategoryModal
          onClose={() => setShowCustomSubcategoryModal(false)}
          onAdd={addCustomSubcategory}
        />
      )}
      {showCustomMeasurementCategoryModal && (
        <CustomMeasurementCategoryModal
          onClose={() => setShowCustomMeasurementCategoryModal(false)}
          onAdd={addCustomMeasurementCategory}
          existingCategories={customMeasurementCategories}
        />
      )}
      {confirmationDialog.isOpen && (
        <ConfirmationDialog
          title={confirmationDialog.title}
          message={confirmationDialog.message}
          onConfirm={confirmationDialog.onConfirm}
          onCancel={closeConfirmationDialog}
          type={confirmationDialog.type}
        />
      )}

      {/* Accessibility Announcer */}
      <div className="sr-only" role="status" aria-live="polite">
        {announceMessage}
      </div>

      {/* Tooltips */}
      <Tooltip id="measurement-type-tooltip" />
      <Tooltip id="delete-tooltip" />
    </div>
  );
};

export default Add;
