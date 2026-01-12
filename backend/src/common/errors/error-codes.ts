/**
 * Centralized error codes and messages for consistent API responses
 */

export interface ApiError {
  code: string;
  message: string;
}

// ============================================
// Auth Errors
// ============================================
export const AUTH_ERRORS = {
  EMAIL_ALREADY_EXISTS: {
    code: 'EMAIL_ALREADY_EXISTS',
    message: 'Email already exists',
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'Invalid or expired token',
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'Token has expired',
  },
} as const;

// ============================================
// User Errors
// ============================================
export const USER_ERRORS = {
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
  },
} as const;

// ============================================
// Team Errors
// ============================================
export const TEAM_ERRORS = {
  TEAM_NOT_FOUND: {
    code: 'TEAM_NOT_FOUND',
    message: 'Team not found',
  },
  NOT_TEAM_MEMBER: {
    code: 'NOT_TEAM_MEMBER',
    message: 'You are not a member of this team',
  },
  NOT_TEAM_ADMIN: {
    code: 'NOT_TEAM_ADMIN',
    message: 'Only team owner or admin can perform this action',
  },
  NOT_TEAM_OWNER: {
    code: 'NOT_TEAM_OWNER',
    message: 'Only team owner can perform this action',
  },
  ALREADY_TEAM_MEMBER: {
    code: 'ALREADY_TEAM_MEMBER',
    message: 'User is already a member of this team',
  },
  CANNOT_REMOVE_OWNER: {
    code: 'CANNOT_REMOVE_OWNER',
    message: 'Cannot remove the team owner',
  },
} as const;

// ============================================
// Task Errors
// ============================================
export const TASK_ERRORS = {
  TASK_NOT_FOUND: {
    code: 'TASK_NOT_FOUND',
    message: 'Task not found',
  },
  TASK_ACCESS_DENIED: {
    code: 'TASK_ACCESS_DENIED',
    message: 'You do not have permission to access this task',
  },
  TASK_EDIT_DENIED: {
    code: 'TASK_EDIT_DENIED',
    message: 'You do not have permission to edit this task',
  },
  TASK_DELETE_DENIED: {
    code: 'TASK_DELETE_DENIED',
    message: 'You do not have permission to delete this task',
  },
  INVALID_PARENT_TASK: {
    code: 'INVALID_PARENT_TASK',
    message: 'Invalid parent task',
  },
} as const;

// ============================================
// Comment Errors
// ============================================
export const COMMENT_ERRORS = {
  COMMENT_NOT_FOUND: {
    code: 'COMMENT_NOT_FOUND',
    message: 'Comment not found',
  },
  COMMENT_EDIT_DENIED: {
    code: 'COMMENT_EDIT_DENIED',
    message: 'You can only edit your own comments',
  },
} as const;

// ============================================
// Generic Errors
// ============================================
export const GENERIC_ERRORS = {
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'You do not have permission to perform this action',
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
  },
} as const;

// Combined export for convenience
export const ERROR_CODES = {
  ...AUTH_ERRORS,
  ...USER_ERRORS,
  ...TEAM_ERRORS,
  ...TASK_ERRORS,
  ...COMMENT_ERRORS,
  ...GENERIC_ERRORS,
} as const;
