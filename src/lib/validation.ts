// Comprehensive validation utilities for the wedding QR system

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FileValidationOptions {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  minFiles?: number;
}

export interface FormValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}

// File validation constants
export const FILE_VALIDATION_CONSTANTS = {
  MAX_GUEST_PHOTOS: 20,
  MAX_HOST_PHOTOS: 50,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.wmv', '.webm']
};

// Form field validation constants
export const FORM_VALIDATION_CONSTANTS = {
  GUEST_NAME: { minLength: 2, maxLength: 100 },
  ALBUM_NAME: { minLength: 1, maxLength: 100 },
  ALBUM_DESCRIPTION: { maxLength: 500 },
  INVITATION_MESSAGE: { minLength: 10, maxLength: 1000 },
  QR_MONOGRAM: { minLength: 1, maxLength: 10 }
};

/**
 * Validates files for upload
 */
export function validateFiles(files: File[], options: FileValidationOptions = {}): ValidationResult {
  const {
    maxFiles = FILE_VALIDATION_CONSTANTS.MAX_GUEST_PHOTOS,
    maxFileSize = FILE_VALIDATION_CONSTANTS.MAX_FILE_SIZE,
    allowedTypes = [...FILE_VALIDATION_CONSTANTS.ALLOWED_IMAGE_TYPES, ...FILE_VALIDATION_CONSTANTS.ALLOWED_VIDEO_TYPES],
    minFiles = 1
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum files
  if (files.length < minFiles) {
    errors.push(`Please select at least ${minFiles} file${minFiles > 1 ? 's' : ''}.`);
  }

  // Check maximum files
  if (files.length > maxFiles) {
    errors.push(`You can only upload up to ${maxFiles} files at a time. You selected ${files.length} files.`);
  }

  // Check individual files
  files.forEach((file, index) => {
    // File size validation
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      errors.push(`File "${file.name}" is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.`);
    }

    // File type validation
    if (!allowedTypes.includes(file.type)) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = FILE_VALIDATION_CONSTANTS.ALLOWED_EXTENSIONS.join(', ');
      errors.push(`File "${file.name}" has an unsupported format. Allowed formats: ${allowedExtensions}`);
    }

    // File name validation
    if (file.name.length > 255) {
      errors.push(`File "${file.name}" has a name that's too long. Please rename it to be under 255 characters.`);
    }

    // Warn about very large files (even if under limit)
    if (file.size > maxFileSize * 0.8) {
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      warnings.push(`File "${file.name}" is quite large (${fileSizeMB}MB). Upload may take longer.`);
    }
  });

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSize = maxFileSize * Math.min(files.length, 10); // Reasonable total limit
  if (totalSize > maxTotalSize) {
    const totalSizeMB = Math.round(totalSize / (1024 * 1024));
    const maxTotalSizeMB = Math.round(maxTotalSize / (1024 * 1024));
    errors.push(`Total file size (${totalSizeMB}MB) exceeds the limit (${maxTotalSizeMB}MB). Please select fewer or smaller files.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a text field
 */
export function validateTextField(value: string, options: FormValidationOptions = {}): ValidationResult {
  const {
    required = false,
    minLength = 0,
    maxLength = Infinity,
    pattern,
    customValidator
  } = options;

  const errors: string[] = [];
  const trimmedValue = value.trim();

  // Required validation
  if (required && !trimmedValue) {
    errors.push('This field is required.');
  }

  // Length validation (only if value is provided)
  if (trimmedValue) {
    if (trimmedValue.length < minLength) {
      errors.push(`Must be at least ${minLength} characters long.`);
    }
    if (trimmedValue.length > maxLength) {
      errors.push(`Must be no more than ${maxLength} characters long.`);
    }
  }

  // Pattern validation
  if (trimmedValue && pattern && !pattern.test(trimmedValue)) {
    errors.push('Invalid format.');
  }

  // Custom validation
  if (trimmedValue && customValidator) {
    const customError = customValidator(trimmedValue);
    if (customError) {
      errors.push(customError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates guest name
 */
export function validateGuestName(name: string): ValidationResult {
  return validateTextField(name, {
    required: true,
    minLength: FORM_VALIDATION_CONSTANTS.GUEST_NAME.minLength,
    maxLength: FORM_VALIDATION_CONSTANTS.GUEST_NAME.maxLength,
    customValidator: (value) => {
      // Check for potentially inappropriate content (basic check)
      const inappropriateWords = ['test', 'admin', 'null', 'undefined'];
      if (inappropriateWords.some((word: string) => value.toLowerCase().includes(word))) {
        return 'Please enter a valid guest name.';
      }
      return null;
    }
  });
}

/**
 * Validates album name
 */
export function validateAlbumName(name: string): ValidationResult {
  return validateTextField(name, {
    required: true,
    minLength: FORM_VALIDATION_CONSTANTS.ALBUM_NAME.minLength,
    maxLength: FORM_VALIDATION_CONSTANTS.ALBUM_NAME.maxLength,
    customValidator: (value) => {
      // Check for special characters that might cause issues
      if (!/^[a-zA-Z0-9\s\-_&'.,!]+$/.test(value)) {
        return 'Album name contains invalid characters. Use only letters, numbers, spaces, and basic punctuation.';
      }
      return null;
    }
  });
}

/**
 * Validates album description
 */
export function validateAlbumDescription(description: string): ValidationResult {
  return validateTextField(description, {
    required: false,
    maxLength: FORM_VALIDATION_CONSTANTS.ALBUM_DESCRIPTION.maxLength
  });
}

/**
 * Validates invitation message
 */
export function validateInvitationMessage(message: string): ValidationResult {
  return validateTextField(message, {
    required: true,
    minLength: FORM_VALIDATION_CONSTANTS.INVITATION_MESSAGE.minLength,
    maxLength: FORM_VALIDATION_CONSTANTS.INVITATION_MESSAGE.maxLength,
    customValidator: (value) => {
      // Check for minimum word count
      const wordCount = value.split(/\s+/).filter((word: string) => word.length > 0).length;
      if (wordCount < 3) {
        return 'Please provide a more detailed invitation message (at least 3 words).';
      }
      return null;
    }
  });
}

/**
 * Validates QR monogram text
 */
export function validateQRMonogram(monogram: string): ValidationResult {
  return validateTextField(monogram, {
    required: true,
    minLength: FORM_VALIDATION_CONSTANTS.QR_MONOGRAM.minLength,
    maxLength: FORM_VALIDATION_CONSTANTS.QR_MONOGRAM.maxLength,
    pattern: /^[A-Za-z0-9&\s]+$/,
    customValidator: (value) => {
      if (value.length > 5) {
        return 'Monogram should be short (5 characters or less) for best display.';
      }
      return null;
    }
  });
}

/**
 * Validates email format
 */
export function validateEmail(email: string, required: boolean = false): ValidationResult {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return validateTextField(email, {
    required,
    pattern: emailPattern,
    customValidator: (value) => {
      if (value && !emailPattern.test(value)) {
        return 'Please enter a valid email address.';
      }
      return null;
    }
  });
}

/**
 * Validates phone number format
 */
export function validatePhone(phone: string, required: boolean = false): ValidationResult {
  const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
  
  return validateTextField(phone, {
    required,
    customValidator: (value) => {
      if (value) {
        // Remove common formatting characters
        const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');
        if (!phonePattern.test(cleanPhone)) {
          return 'Please enter a valid phone number.';
        }
        if (cleanPhone.length < 10) {
          return 'Phone number must be at least 10 digits.';
        }
      }
      return null;
    }
  });
}

/**
 * Batch validation for multiple fields
 */
export function validateForm(validations: { [key: string]: ValidationResult }): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  let isValid = true;

  Object.entries(validations).forEach(([field, result]) => {
    if (!result.isValid) {
      isValid = false;
      result.errors.forEach(error => {
        allErrors.push(`${field}: ${error}`);
      });
    }
    if (result.warnings) {
      result.warnings.forEach(warning => {
        allWarnings.push(`${field}: ${warning}`);
      });
    }
  });

  return {
    isValid,
    errors: allErrors,
    warnings: allWarnings.length > 0 ? allWarnings : undefined
  };
}

/**
 * Real-time validation helper for React components
 */
export function useValidation() {
  const validateField = (value: any, validator: (value: any) => ValidationResult) => {
    return validator(value);
  };

  const getFieldError = (validation: ValidationResult): string | null => {
    return validation.errors.length > 0 ? validation.errors[0] : null;
  };

  const hasFieldError = (validation: ValidationResult): boolean => {
    return !validation.isValid;
  };

  return {
    validateField,
    getFieldError,
    hasFieldError
  };
}
