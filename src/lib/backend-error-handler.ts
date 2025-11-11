import { showFieldError } from "@/lib/validation-toast";

export interface BackendError {
  field: string;
  message: string;
  type: string;
}

export interface BackendErrorResponse {
  success: false;
  message: string;
  errors: BackendError[];
  detail: string;
}

/**
 * Handle backend validation errors and show appropriate toast messages
 * @param error - The error object from the API response
 * @param setError - Function to set form error state (optional)
 */
export const handleBackendValidationErrors = (
  error: any,
  setError?: (error: string) => void
) => {
  // Check if it's a backend validation error response
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    const errors = error.response.data.errors as BackendError[];
    
    errors.forEach((backendError) => {
      // Extract field name from "body -> fieldName" format
      const fieldName = backendError.field?.split(' -> ').pop() || backendError.field;
      const message = backendError.message;
      
      // Show toast for each error with proper field name formatting
      const displayFieldName = formatFieldName(fieldName);
      showFieldError(displayFieldName, message);
    });
    
    // Set general form error if setError function is provided
    if (setError) {
      const firstError = errors[0];
      setError(firstError.message);
    }
    
    return true; // Indicates that backend errors were handled
  }
  
  // Handle general error messages
  if (error.response?.data?.message) {
    showFieldError('Form', error.response.data.message);
    if (setError) {
      setError(error.response.data.message);
    }
    return true;
  }
  
  // Handle network or other errors
  if (error.message) {
    showFieldError('Error', error.message);
    if (setError) {
      setError(error.message);
    }
    return true;
  }
  
  return false; // No backend errors were handled
};

/**
 * Format field names for better display in error messages
 * @param fieldName - The raw field name from backend
 * @returns Formatted field name for display
 */
const formatFieldName = (fieldName: string): string => {
  const fieldMappings: Record<string, string> = {
    'phone': 'Phone Number',
    'email': 'Email Address',
    'contacts': 'Contacts',
    'companyName': 'Company Name',
    'companyAddress': 'Company Address',
    'companyState': 'State',
    'companyPin': 'PIN Code',
    'gst': 'GST Number',
    'firstName': 'First Name',
    'lastName': 'Last Name',
    'telephoneNumber': 'Phone Number',
    'task_name': 'Project Name',
    'service_description': 'Description',
    'client_id': 'Client',
    'sac_code_id': 'SAC Code',
    'service_category_id': 'Service Category',
    'assignee_id': 'Assignee',
    'invoice_amount': 'Amount',
  };
  
  return fieldMappings[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
};

/**
 * Check if an error is a backend validation error
 * @param error - The error object to check
 * @returns True if it's a backend validation error
 */
export const isBackendValidationError = (error: any): boolean => {
  return error.response?.data?.errors && Array.isArray(error.response.data.errors);
};
