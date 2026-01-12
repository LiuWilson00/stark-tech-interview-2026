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
 * Extract error message from API error response
 * Handles various error formats from the backend
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

  // Handle Error instances
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // Handle API error response
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
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  const apiError = error as ApiErrorResponse;
  return apiError.statusCode === 401;
}

/**
 * Check if error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  const apiError = error as ApiErrorResponse;
  return apiError.statusCode === 404;
}
