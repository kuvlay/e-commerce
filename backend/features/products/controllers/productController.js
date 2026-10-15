import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";

// Helper function to manage featured products FIFO logic with priority system
const manageFeaturedProducts = async (productId, shouldBeFeatured) => {
  if (!shouldBeFeatured) {
    // Remove from featured - the pre-save middleware will handle priority reordering
    const product = await productModel.findById(productId);
    product.featured = false;
    await product.save();
    return { removedProduct: null, newPriority: null };
  }

  // Check current featured products count
  const featuredProducts = await productModel.find({ featured: true }).sort({ featuredPriority: -1 });
  let removedProduct = null;
  
  if (featuredProducts.length >= 3) {
    // Find the lowest priority (highest number) featured product
    const lowestPriorityProduct = featuredProducts[0];
    removedProduct = {
      id: lowestPriorityProduct._id,
      name: lowestPriorityProduct.name,
      priority: lowestPriorityProduct.featuredPriority
    };
  }

  // Add new featured product - the pre-save middleware will handle priority assignment
  const product = await productModel.findById(productId);
  product.featured = true;
  await product.save();

  return { removedProduct, newPriority: 1 };
};

import { createLogger } from "../../../core/utils/logger.js";
const productLogger = createLogger('Product');

// function for add product
export const addProduct = async (req, res) => {
  productLogger.info("Product addition request received", { 
    hasFiles: !!req.files,
    fileCount: req.files ? Object.keys(req.files).length : 0
  });
  
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      measurementType,
      measurements,
      selectedTypes,
    } = req.body;

    productLogger.debug("Extracted form data", {
      name,
      category,
      subCategory,
      measurementType,
      hasMeasurements: !!measurements,
      hasSizes: !!sizes,
      hasSelectedTypes: !!selectedTypes,
    });

    // Validation
    if (!name || !description || !category) {
      productLogger.warn("Missing required fields", { name: !!name, description: !!description, category: !!category });
      return res.json({ success: false, message: "Missing required fields: name, description, or category" });
    }

    // Simplified measurement validation
    const hasSelectedTypes = selectedTypes && JSON.parse(selectedTypes).length > 0;
    const hasMeasurements = measurements && JSON.parse(measurements).length > 0;
    
    // Require selectedTypes and measurements
    if (!hasSelectedTypes) {
      productLogger.warn("No measurement types selected");
      return res.json({ success: false, message: "At least one measurement type must be selected" });
    }

    if (!hasMeasurements) {
      productLogger.warn("No measurements provided");
      return res.json({ success: false, message: "At least one measurement is required" });
    }

    console.log("🖼️ BACKEND: Processing images...");
    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    console.log("📸 BACKEND: Found", images.length, "images to upload");

    if (images.length === 0) {
      productLogger.warn("No images provided");
      return res.json({ success: false, message: "At least one product image is required" });
    }

    console.log("☁️ BACKEND: Uploading images to Cloudinary...");
    const imagesUrl = await Promise.all(
      images.map(async (item, index) => {
        console.log(`📤 BACKEND: Uploading image ${index + 1}:`, item.path);
        try {
          let result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image",
          });
          productLogger.debug(`Image ${index + 1} uploaded successfully`, { url: result.secure_url });
          return result.secure_url;
        } catch (uploadError) {
          productLogger.error(`Failed to upload image ${index + 1}`, { error: uploadError.message });
          throw uploadError;
        }
      })
    );

    console.log("🎯 BACKEND: All images uploaded successfully");

    // Parse measurements and new measurement structure
    console.log("📊 BACKEND: Parsing measurements and categories...");
    let parsedMeasurements, parsedSelectedTypes;
    
    try {
      // Parse measurements with simplified structure
      parsedMeasurements = measurements ? JSON.parse(measurements).map(m => ({
        categoryId: m.categoryId || measurementType || 'weight', // Backward compatibility
        value: m.value,
        label: m.label,
        price: Number(m.price)
      })) : [];
      productLogger.debug("Parsed measurements", { count: parsedMeasurements.length });

      // Parse selected types
      parsedSelectedTypes = selectedTypes ? JSON.parse(selectedTypes) : [];
      productLogger.debug("Parsed selected types", { types: parsedSelectedTypes });

    } catch (parseError) {
      productLogger.error("Failed to parse measurement data", { error: parseError.message });
      return res.json({ success: false, message: "Invalid measurement data format" });
    }

    // Calculate base price from first measurement
    const basePrice = parsedMeasurements.length > 0 ? parsedMeasurements[0].price : 0;

    const productData = {
      name,
      description,
      category,
      price: Number(basePrice), // Use first measurement price as base price
      subCategory,
      bestSeller: false, // Default to false since we removed the UI
      // Simplified measurement system
      selectedTypes: parsedSelectedTypes,
      measurements: parsedMeasurements,
      // Legacy support for backward compatibility
      measurementType: measurementType || (parsedSelectedTypes.length > 0 ? parsedSelectedTypes[0] : 'weight'),
      sizes: sizes ? JSON.parse(sizes) : [],
      image: imagesUrl,
      date: Date.now(),
    };

    console.log("💾 BACKEND: Creating product with data:", productData);

    const product = new productModel(productData);

    console.log("🗄️ BACKEND: Saving product to MongoDB...");
    await product.save();

    console.log("🎉 BACKEND: Product saved successfully with ID:", product._id);

    res.json({ success: true, message: "Product Added Successfully", productId: product._id });
  } catch (error) {
    console.error("💥 BACKEND: Error in addProduct:", error);
    console.error("💥 BACKEND: Error stack:", error.stack);
    
    // More specific error messages
    if (error.name === 'ValidationError') {
      productLogger.error("MongoDB validation error", { errors: Object.keys(error.errors) });
      return res.json({ 
        success: false, 
        message: "Validation error",
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.json({ success: false, message: error.message || "Failed to add product" });
  }
};

// function for list product
export const listProduct = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (e) {
    res.json({ success: false, message: "Failed to fetch products" });
  }
};

// function for remove product
export const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product Removed" });
  } catch (e) {
    res.json({ success: false, message: "Failed to remove product" });
  }
};

// function for single product info
export const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);

    res.json({ success: true, product });
  } catch (e) {
    res.json({ success: false, message: "Failed to fetch product" });
  }
};

// function to get featured products with priority sorting
export const getFeaturedProducts = async (req, res) => {
  try {
    const { type = 'manual', limit = 8 } = req.query;
    let products = [];

    switch (type) {
      case 'manual':
        // Admin manually selected featured products - sort by priority
        products = await productModel.find({ featured: true })
          .sort({ featuredPriority: 1 }) // 1 = highest priority
          .limit(parseInt(limit));
        break;
      
      case 'mostBought':
        // Most bought products (highest totalSales)
        products = await productModel.find({}).sort({ totalSales: -1 }).limit(parseInt(limit));
        break;
      
      case 'mostRated':
        // Most rated products (highest averageRating with minimum reviews)
        products = await productModel.find({ reviewCount: { $gte: 1 } })
          .sort({ averageRating: -1, reviewCount: -1 })
          .limit(parseInt(limit));
        break;
      
      case 'bestSeller':
        // Legacy bestSeller flag
        products = await productModel.find({ bestSeller: true }).limit(parseInt(limit));
        break;
      
      default:
        // Default to manual featured with priority sorting
        products = await productModel.find({ featured: true })
          .sort({ featuredPriority: 1 })
          .limit(parseInt(limit));
    }

    // If no products found with the criteria, fallback to recent products
    if (products.length === 0) {
      products = await productModel.find({}).sort({ date: -1 }).limit(parseInt(limit));
    }

    res.json({ success: true, products, type });
  } catch (e) {
    res.json({ success: false, message: "Failed to search products" });
  }
};

// function to get featured products with priority information (for admin panel)
export const getFeaturedProductsWithPriority = async (req, res) => {
  try {
    const products = await productModel.find({ featured: true })
      .sort({ featuredPriority: 1 })
      .select('name price image featuredPriority category');

    res.json({ 
      success: true, 
      products: products.map(product => ({
        ...product.toObject(),
        priorityLabel: product.featuredPriority ? `${product.featuredPriority}${product.featuredPriority === 1 ? 'st' : product.featuredPriority === 2 ? 'nd' : 'rd'} Priority` : 'No Priority'
      }))
    });
  } catch (e) {
    res.json({ success: false, message: "Failed to fetch featured products with priority" });
  }
};

// function to toggle featured status (admin only)
export const toggleFeatured = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    const newFeaturedStatus = !product.featured;
    
    // Use FIFO logic for featured products with detailed response
    const result = await manageFeaturedProducts(productId, newFeaturedStatus);

    let message = `Product ${newFeaturedStatus ? 'added to' : 'removed from'} featured products`;
    
    if (newFeaturedStatus && result.removedProduct) {
      message += `. Removed "${result.removedProduct.name}" (was ${result.removedProduct.priority}${result.removedProduct.priority === 1 ? 'st' : result.removedProduct.priority === 2 ? 'nd' : 'rd'} priority) to make room.`;
    }
    
    if (newFeaturedStatus) {
      message += ` New product assigned 1st priority.`;
    }

    res.json({ 
      success: true, 
      message,
      featured: newFeaturedStatus,
      newPriority: result.newPriority,
      removedProduct: result.removedProduct
    });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: "Failed to toggle featured status" });
  }
};

// function to set specific featured priority (admin only)
export const setFeaturedPriority = async (req, res) => {
  try {
    const { productId, priority } = req.body;
    
    if (!priority || priority < 1 || priority > 3) {
      return res.json({ success: false, message: "Priority must be between 1 and 3" });
    }

    const product = await productModel.findById(productId);
    
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    if (!product.featured) {
      return res.json({ success: false, message: "Product must be featured to set priority" });
    }

    const oldPriority = product.featuredPriority;
    
    // Find product currently at the target priority
    const existingProduct = await productModel.findOne({ 
      featured: true, 
      featuredPriority: priority,
      _id: { $ne: productId }
    });

    if (existingProduct) {
      // Swap priorities
      existingProduct.featuredPriority = oldPriority;
      await existingProduct.save();
    }

    // Set new priority
    product.featuredPriority = priority;
    await product.save();

    res.json({ 
      success: true, 
      message: `Product priority updated to ${priority}${priority === 1 ? 'st' : priority === 2 ? 'nd' : 'rd'}`,
      oldPriority,
      newPriority: priority,
      swappedWith: existingProduct ? existingProduct.name : null
    });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: "Failed to set featured priority" });
  }
};

// function to validate custom measurement categories (admin only)
export const validateCustomCategories = async (req, res) => {
  try {
    const { customCategories } = req.body;
    
    if (!customCategories || !Array.isArray(customCategories)) {
      return res.json({ success: false, message: "Custom categories must be an array" });
    }

    const errors = [];
    const categoryNames = new Set();
    const categoryIds = new Set();

    for (let i = 0; i < customCategories.length; i++) {
      const category = customCategories[i];
      const prefix = `Category ${i + 1}`;

      // Validate required fields
      if (!category.name || typeof category.name !== 'string') {
        errors.push(`${prefix}: Name is required and must be a string`);
      }
      
      if (!category.unit || typeof category.unit !== 'string') {
        errors.push(`${prefix}: Unit is required and must be a string`);
      }

      if (!category.id || typeof category.id !== 'string') {
        errors.push(`${prefix}: ID is required and must be a string`);
      }

      // Check for duplicates
      if (category.name && categoryNames.has(category.name.toLowerCase())) {
        errors.push(`${prefix}: Duplicate category name "${category.name}"`);
      } else if (category.name) {
        categoryNames.add(category.name.toLowerCase());
      }

      if (category.id && categoryIds.has(category.id)) {
        errors.push(`${prefix}: Duplicate category ID "${category.id}"`);
      } else if (category.id) {
        categoryIds.add(category.id);
      }

      // Validate name format
      if (category.name && !/^[a-zA-Z0-9\s\-]+$/.test(category.name)) {
        errors.push(`${prefix}: Name contains invalid characters. Only letters, numbers, spaces, and hyphens are allowed`);
      }

      // Validate unit format (basic validation)
      if (category.unit && category.unit.length > 10) {
        errors.push(`${prefix}: Unit must be 10 characters or less`);
      }

      // Validate common options if provided
      if (category.commonOptions && Array.isArray(category.commonOptions)) {
        for (let j = 0; j < category.commonOptions.length; j++) {
          const option = category.commonOptions[j];
          if (!option.value || !option.label) {
            errors.push(`${prefix}, Option ${j + 1}: Both value and label are required`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.json({ success: false, message: "Validation failed", errors });
    }

    res.json({ success: true, message: "Custom categories are valid" });
  } catch (e) {
    productLogger.error("Custom category validation error", { error: e.message });
    res.json({ success: false, message: "Failed to validate custom categories" });
  }
};

// function to get measurement configuration for a product (for editing)
export const getProductMeasurementConfig = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId).select('selectedTypes customCategories measurements measurementType');

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Provide backward compatibility data structure
    const config = {
      selectedTypes: product.selectedTypes || [],
      customCategories: product.customCategories || [],
      measurements: product.measurements || [],
      // Legacy support
      measurementType: product.measurementType || 'weight',
      // Migration helper - if no new fields, create from legacy
      needsMigration: (!product.selectedTypes || product.selectedTypes.length === 0) && 
                     (!product.customCategories || product.customCategories.length === 0) &&
                     product.measurementType
    };

    res.json({ success: true, config });
  } catch (e) {
    productLogger.error("Failed to get measurement config", { error: e.message });
    res.json({ success: false, message: "Failed to get measurement configuration" });
  }
};
