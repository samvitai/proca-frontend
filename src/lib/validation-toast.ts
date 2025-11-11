import { toast } from "@/hooks/use-toast";

// Interface for validation error detail from API
interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface ValidationErrorResponse {
  detail: ValidationErrorDetail[] | string;
}

/**
 * Shows a validation error toast with proper formatting
 * @param error - The error object from API or a custom message
 */
export function showValidationError(error: unknown) {
  let errorMessage = "Validation error occurred";

  if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object") {
    // Check if it's a validation error response with detail array
    const validationError = error as ValidationErrorResponse;
    
    if (validationError.detail) {
      if (Array.isArray(validationError.detail)) {
        // Extract all validation messages
        const messages = validationError.detail.map((err) => {
          // Format the field name from loc array
          const field = err.loc.length > 1 ? err.loc[err.loc.length - 1] : "Field";
          return `${String(field)}: ${err.msg}`;
        });
        errorMessage = messages.join("\n");
      } else if (typeof validationError.detail === "string") {
        errorMessage = validationError.detail;
      }
    } else if ("message" in error && typeof (error as { message: string }).message === "string") {
      errorMessage = (error as { message: string }).message;
    }
  }

  toast({
    title: "Validation Error",
    description: errorMessage,
    variant: "destructive",
    duration: 5000, // Show for 5 seconds
  });
}

/**
 * Shows a field-specific validation error
 * @param field - The field name
 * @param message - The error message
 */
export function showFieldError(field: string, message: string) {
  toast({
    title: `${field} Error`,
    description: message,
    variant: "destructive",
    duration: 4000,
  });
}

/**
 * Extracts validation error messages from axios error response
 * @param axiosError - The axios error object
 * @returns Formatted error message string
 */
export function extractValidationMessage(axiosError: {
  response?: {
    status?: number;
    data?: unknown;
  };
}): string {
  const status = axiosError.response?.status;
  const data = axiosError.response?.data;

  if (status === 422 || status === 400) {
    if (data && typeof data === "object") {
      const validationData = data as ValidationErrorResponse;
      
      if (validationData.detail) {
        if (Array.isArray(validationData.detail)) {
          const messages = validationData.detail.map((err) => {
            const field = err.loc.length > 1 ? err.loc[err.loc.length - 1] : "";
            return field ? `${String(field)}: ${err.msg}` : err.msg;
          });
          return messages.join(", ");
        } else if (typeof validationData.detail === "string") {
          return validationData.detail;
        }
      }
      
      if ("message" in data && typeof (data as { message: string }).message === "string") {
        return (data as { message: string }).message;
      }
    }
  }

  return "Validation error occurred";
}

