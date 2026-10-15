import { performance } from 'perf_hooks';

// Performance-optimized validation middleware
class OptimizedValidator {
  constructor() {
    // Cache compiled schemas for better performance
    this.schemaCache = new Map();
    this.metrics = {
      totalValidations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      validationErrors: 0,
      averageValidationTime: 0,
      validationTimes: []
    };
  }

  // Compile and cache validation schema
  compileSchema(schemaKey, schema) {
    if (!this.schemaCache.has(schemaKey)) {
      // Simple validation compiler (in production, use Joi or Ajv)
      const compiledSchema = this.compileValidationRules(schema);
      this.schemaCache.set(schemaKey, compiledSchema);
      this.metrics.cacheMisses++;
    } else {
      this.metrics.cacheHits++;
    }
    
    return this.schemaCache.get(schemaKey);
  }

  // Optimized validation rules compiler
  compileValidationRules(schema) {
    return {
      validate: (data) => {
        const errors = [];
        
        for (const [field, rules] of Object.entries(schema)) {
          const value = data[field];
          
          // Required field check
          if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
            continue;
          }
          
          // Skip further validation if field is not present and not required
          if (value === undefined || value === null) {
            continue;
          }
          
          // Type validation
          if (rules.type && typeof value !== rules.type) {
            errors.push(`${field} must be of type ${rules.type}`);
            continue;
          }
          
          // String validations
          if (rules.type === 'string') {
            if (rules.minLength && value.length < rules.minLength) {
              errors.push(`${field} must be at least ${rules.minLength} characters`);
            }
            if (rules.maxLength && value.length > rules.maxLength) {
              errors.push(`${field} must be at most ${rules.maxLength} characters`);
            }
            if (rules.pattern && !rules.pattern.test(value)) {
              errors.push(`${field} format is invalid`);
            }
          }
          
          // Number validations
          if (rules.type === 'number') {
            if (rules.min !== undefined && value < rules.min) {
              errors.push(`${field} must be at least ${rules.min}`);
            }
            if (rules.max !== undefined && value > rules.max) {
              errors.push(`${field} must be at most ${rules.max}`);
            }
          }
          
          // Array validations
          if (rules.type === 'array') {
            if (rules.minItems && value.length < rules.minItems) {
              errors.push(`${field} must have at least ${rules.minItems} items`);
            }
            if (rules.maxItems && value.length > rules.maxItems) {
              errors.push(`${field} must have at most ${rules.maxItems} items`);
            }
          }
          
          // Custom validation function
          if (rules.custom && typeof rules.custom === 'function') {
            const customResult = rules.custom(value);
            if (customResult !== true) {
              errors.push(customResult || `${field} is invalid`);
            }
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      }
    };
  }

  // High-performance validation middleware factory
  createValidationMiddleware(schemaKey, schema) {
    const compiledSchema = this.compileSchema(schemaKey, schema);
    
    return (req, res, next) => {
      const start = performance.now();
      this.metrics.totalValidations++;
      
      try {
        // Determine what to validate based on request method
        let dataToValidate = {};
        
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          dataToValidate = req.body || {};
        }
        
        // Add query parameters for GET requests if schema includes them
        if (req.method === 'GET' && Object.keys(req.query).length > 0) {
          dataToValidate = { ...dataToValidate, ...req.query };
        }
        
        // Add URL parameters
        if (req.params && Object.keys(req.params).length > 0) {
          dataToValidate = { ...dataToValidate, ...req.params };
        }
        
        const result = compiledSchema.validate(dataToValidate);
        
        if (!result.isValid) {
          this.metrics.validationErrors++;
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: result.errors
          });
        }
        
        const validationTime = performance.now() - start;
        this.updateValidationMetrics(validationTime);
        
        // Log slow validations
        if (validationTime > 5) {
          console.warn(`Slow validation for ${schemaKey}: ${validationTime.toFixed(2)}ms`);
        }
        
        next();
      } catch (error) {
        console.error('Validation middleware error:', error);
        this.metrics.validationErrors++;
        
        return res.status(500).json({
          success: false,
          message: 'Internal validation error'
        });
      }
    };
  }

  // Update performance metrics
  updateValidationMetrics(validationTime) {
    this.metrics.validationTimes.push(validationTime);
    
    // Keep only last 1000 measurements
    if (this.metrics.validationTimes.length > 1000) {
      this.metrics.validationTimes.shift();
    }
    
    this.metrics.averageValidationTime = 
      this.metrics.validationTimes.reduce((a, b) => a + b, 0) / 
      this.metrics.validationTimes.length;
  }

  // Get performance metrics
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.schemaCache.size,
      cacheHitRate: this.metrics.totalValidations > 0 ? 
        (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 : 0,
      errorRate: this.metrics.totalValidations > 0 ? 
        (this.metrics.validationErrors / this.metrics.totalValidations) * 100 : 0
    };
  }

  // Clear cache (for testing or memory management)
  clearCache() {
    this.schemaCache.clear();
  }
}

// Create singleton instance
const validator = new OptimizedValidator();

// Common validation schemas
export const userRegistrationSchema = {
  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/
  },
  email: {
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: 'string',
    required: true,
    minLength: 8,
    custom: (value) => {
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
      }
      return true;
    }
  }
};

export const userLoginSchema = {
  email: {
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: 'string',
    required: true,
    minLength: 1
  }
};

export const productSchema = {
  name: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 200
  },
  description: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 2000
  },
  price: {
    type: 'number',
    required: true,
    min: 0
  },
  category: {
    type: 'string',
    required: true,
    minLength: 1
  }
};

// Export validation middleware creators
export const validateUserRegistration = validator.createValidationMiddleware('userRegistration', userRegistrationSchema);
export const validateUserLogin = validator.createValidationMiddleware('userLogin', userLoginSchema);
export const validateProduct = validator.createValidationMiddleware('product', productSchema);

// Export metrics function
export const getValidationMetrics = () => {
  return validator.getMetrics();
};

// Export validator instance for custom schemas
export const createCustomValidation = (schemaKey, schema) => {
  return validator.createValidationMiddleware(schemaKey, schema);
};