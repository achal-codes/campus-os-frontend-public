import { ApiError } from '@/core/api'

export interface MappedAuthError {
  message: string
  code: string
  requestId?: string
  isRateLimited?: boolean
  isRecoverable?: boolean
}

/**
 * Maps backend error codes to user-facing messages.
 * Strict rule: branches on error.code ONLY, never on error.message text.
 */
export function mapAuthError(error: unknown): MappedAuthError {
  const isApiError = error instanceof ApiError || (typeof error === 'object' && error !== null && 'code' in error)
  if (isApiError) {
    const err = error as ApiError
    const code = err.code
    const requestId = err.requestId

    switch (code) {
      case 'INVALID_CREDENTIALS':
        return {
          code,
          message: 'Invalid email_id or OTP. Please check your credentials and try again.',
          requestId,
        }

      case 'UNKNOWN_INSTITUTION':
        return {
          code,
          message: 'Unknown institution. Please sign in with your registered campus email.',
          requestId,
        }

      case 'RATE_LIMITED':
        return {
          code,
          message: 'Too many login attempts. Please wait 30 seconds before trying again.',
          requestId,
          isRateLimited: true,
        }

      case 'VALIDATION_ERROR':
        return {
          code,
          message: 'Please provide a valid campus email and 4-8 digit OTP.',
          requestId,
        }

      case 'USE_ADMIN_LOGIN':
        return {
          code,
          message: 'This is an administrator account. Please use Admin Sign In.',
          requestId,
        }

      case 'TIMEOUT':
      case 'GATEWAY_TIMEOUT':
        return {
          code: 'TIMEOUT',
          message: 'The server took too long to respond. The free-tier server may be waking up—please wait a moment and try again.',
          requestId,
          isRecoverable: true,
        }

      case 'NETWORK_ERROR':
        return {
          code,
          message: 'Cannot reach the authentication server. Please check your connection and try again.',
          requestId,
          isRecoverable: true,
        }

      default:
        if (err.status === 504 || err.status === 408) {
          return {
            code: 'TIMEOUT',
            message: 'The server took too long to respond. The free-tier server may be waking up—please wait a moment and try again.',
            requestId,
            isRecoverable: true,
          }
        }
        if (typeof err.status === 'number' && err.status >= 500) {
          return {
            code: 'SERVER_ERROR',
            message: 'The authentication server encountered an unexpected error. Please try again in a few moments.',
            requestId,
            isRecoverable: true,
          }
        }
        return {
          code,
          message: err.message || 'Authentication failed. Please try again.',
          requestId,
        }
    }
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN',
      message: error.message,
    }
  }

  return {
    code: 'UNKNOWN',
    message: 'An unexpected authentication error occurred. Please try again.',
  }
}
