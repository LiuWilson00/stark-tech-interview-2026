import { AxiosError } from 'axios';

/**
 * API Error Response structure from backend
 */
interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string | string[];
  };
  message?: string | string[];
  statusCode?: number;
}

/**
 * Type guard to check if error is an AxiosError
 */
export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Extract error message from any error type
 * Handles: AxiosError, API error response, Error instances, strings
 */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  // Handle null/undefined
  if (!error) {
    return fallback;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle AxiosError specifically
  if (isAxiosError(error)) {
    const responseData = error.response?.data;

    // Try nested error.message format
    if (responseData?.error?.message) {
      const message = responseData.error.message;
      return Array.isArray(message) ? message.join(', ') : message;
    }

    // Try direct message format
    if (responseData?.message) {
      const message = responseData.message;
      return Array.isArray(message) ? message.join(', ') : message;
    }

    // Network error (no response from server)
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection.';
    }

    // Timeout error
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    // Use axios error message as last resort
    return error.message || fallback;
  }

  // Handle Error instances
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // Handle API error response object
  const apiError = error as ApiErrorResponse;

  // Try error.error.message first (common backend format)
  if (apiError.error?.message) {
    const message = apiError.error.message;
    return Array.isArray(message) ? message.join(', ') : message;
  }

  // Try error.message directly
  if (apiError.message) {
    const message = apiError.message;
    return Array.isArray(message) ? message.join(', ') : message;
  }

  return fallback;
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  const apiError = error as ApiErrorResponse;
  return apiError.statusCode;
}

/**
 * Get error code from API response
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isAxiosError(error)) {
    return error.response?.data?.error?.code;
  }
  const apiError = error as ApiErrorResponse;
  return apiError.error?.code;
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  return getErrorStatusCode(error) === 401;
}

/**
 * Check if error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  return getErrorStatusCode(error) === 404;
}

/**
 * Check if error is a forbidden error (403)
 */
export function isForbiddenError(error: unknown): boolean {
  return getErrorStatusCode(error) === 403;
}

/**
 * Check if error is a validation error (400)
 */
export function isValidationError(error: unknown): boolean {
  return getErrorStatusCode(error) === 400;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  const status = getErrorStatusCode(error);
  return status !== undefined && status >= 500 && status < 600;
}

/**
 * Check if error is a network error (no response from server)
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.code === 'ERR_NETWORK' || !error.response;
  }
  return false;
}
