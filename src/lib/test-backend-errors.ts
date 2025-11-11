// Test file to demonstrate backend error handling
// This file shows how the backend validation errors are handled

import { handleBackendValidationErrors } from './backend-error-handler';

// Example of the backend error response you provided
const exampleBackendError = {
  response: {
    data: {
      success: false,
      message: "Validation failed",
      errors: [
        {
          field: "body -> phone",
          message: "Phone number must be at least 10 digits",
          type: "value_error"
        },
        {
          field: "body -> email", 
          message: "value is not a valid email address: The email address is not valid. It must have exactly one @-sign.",
          type: "value_error"
        },
        {
          field: "body -> contacts",
          message: "At least one contact is required",
          type: "value_error"
        }
      ],
      detail: "Please check the provided data and try again"
    }
  }
};

// Test function to demonstrate error handling
export const testBackendErrorHandling = () => {
  console.log('Testing backend error handling...');
  
  // This will show toast messages for each error:
  // - "Phone Number: Phone number must be at least 10 digits"
  // - "Email Address: value is not a valid email address: The email address is not valid. It must have exactly one @-sign."
  // - "Contacts: At least one contact is required"
  
  const setError = (error: string) => {
    console.log('Form error set:', error);
  };
  
  const wasHandled = handleBackendValidationErrors(exampleBackendError, setError);
  console.log('Error was handled:', wasHandled);
};

// Export for testing purposes
export { exampleBackendError };
