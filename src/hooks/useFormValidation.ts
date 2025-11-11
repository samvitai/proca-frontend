import { useState, useEffect, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface UseFormValidationReturn {
  errors: ValidationErrors;
  isValid: boolean;
  validateField: (field: string, value: any) => string | null;
  validateAll: (data: Record<string, any>) => boolean;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  setError: (field: string, error: string) => void;
}

export const useFormValidation = (rules: ValidationRules): UseFormValidationReturn => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = (field: string, value: any): string | null => {
    const rule = rules[field];
    if (!rule) return null;

    // Required validation
    if (rule.required) {
      if (value === null || value === undefined || value === '') {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
      // For strings, check if it's just whitespace
      if (typeof value === 'string' && value.trim() === '') {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${rule.minLength} characters`;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} must be no more than ${rule.maxLength} characters`;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} format is invalid`;
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  };

  const validateAll = (data: Record<string, any>): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Validate all fields that have rules
    Object.keys(rules).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const setError = (field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    errors,
    isValid,
    validateField,
    validateAll,
    clearError,
    clearAllErrors,
    setError,
  };
};

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\d{10,}$/, // At least 10 digits as per backend requirement
  pincode: /^\d{6}$/,
  gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
};

// Common validation rules
export const CommonValidationRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: ValidationPatterns.email,
    custom: (value: string) => {
      if (value && !ValidationPatterns.email.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },
  phone: { 
    required: true, 
    pattern: ValidationPatterns.phone,
    custom: (value: string) => {
      if (value && !ValidationPatterns.phone.test(value)) {
        return 'Phone number must be at least 10 digits';
      }
      return null;
    }
  },
  pincode: { 
    required: true, 
    pattern: ValidationPatterns.pincode,
    custom: (value: string) => {
      if (value && !ValidationPatterns.pincode.test(value)) {
        return 'PIN code must be exactly 6 digits';
      }
      return null;
    }
  },
  optionalEmail: { 
    pattern: ValidationPatterns.email,
    custom: (value: string) => {
      if (value && !ValidationPatterns.email.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },
  optionalPhone: { 
    pattern: ValidationPatterns.phone,
    custom: (value: string) => {
      if (value && !ValidationPatterns.phone.test(value)) {
        return 'Phone number must be at least 10 digits';
      }
      return null;
    }
  },
  amount: {
    custom: (value: string | number) => {
      if (value !== null && value !== undefined && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue < 0) {
          return 'Amount must be a valid positive number';
        }
      }
      return null;
    }
  },
  percentage: {
    custom: (value: string | number) => {
      if (value !== null && value !== undefined && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          return 'Percentage must be between 0 and 100';
        }
      }
      return null;
    }
  }
};
