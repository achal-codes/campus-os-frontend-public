const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'You need to sign in to continue.',
  INVALID_TOKEN: 'Your session has expired. Please sign in again.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'This item already exists.',
  DOC_TYPE_ARCHIVED: 'This document type has been archived and cannot be used for new requests.',
  REQUEST_NOT_PENDING: 'This request is no longer pending and cannot be modified.',
  ALREADY_ANSWERED: 'This request has already been answered.',
  NOT_ANSWERED: 'This request has not been answered yet.',
  NO_DOCUMENT: 'No document is attached to this request.',
  ALREADY_ACKNOWLEDGED: 'This request has already been acknowledged.',
  PAYLOAD_TOO_LARGE: 'The file is too large. Maximum size is 10 MB.',
  FILE_TOO_LARGE: 'The file is too large. Maximum size is 10 MB.',
  UNSUPPORTED_FILE_TYPE: 'This file type is not supported.',
  VALIDATION_ERROR: 'Please check the form and correct any errors.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  STORAGE_NOT_CONFIGURED: 'File storage is not available. Please contact an administrator.',
  USE_ADMIN_LOGIN: 'Admin accounts use a separate login.',
  NETWORK_ERROR: 'Cannot reach the server. Check your connection and try again.',
  TIMEOUT: 'The server took too long to respond. Try again.',
}

/** Get a user-friendly error message from an API error code */
export function getUserMessage(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? 'Something went wrong. Please try again.'
}

/** Check if an error is a conflict (stale data) */
export function isConflict(status: number): boolean {
  return status === 409
}

/** Check if the error suggests retrying after a delay */
export function isRateLimited(code: string): boolean {
  return code === 'RATE_LIMITED'
}
