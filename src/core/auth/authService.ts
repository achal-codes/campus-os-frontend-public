// Auth against campus-os-backend. The UI talks only to this module.
// Everyone signs in with their email and the OTP the admin was given when creating them.

import { ApiError, apiRequest } from '@/core/api'
import { loadSession, saveSession, type Role, type User } from './session'

export type { Role, User } from './session'

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
  /** Seconds */
  expires_in: number
  profile: { role: Role; name: string; email_id: string }
}

export interface SignInOptions {
  /** If true, directly calls the admin login endpoint */
  isAdmin?: boolean
}

export function getCurrentUser(): User | null {
  return loadSession()?.user ?? null
}

/**
 * Normal user login against /auth/login.
 * Retries exactly ONCE against /auth/admin/login if error.code === 'USE_ADMIN_LOGIN'.
 */
async function loginUser(email_id: string, otp: string): Promise<TokenResponse> {
  const json = { email_id, otp }
  try {
    return await apiRequest<TokenResponse>('/auth/login', { method: 'POST', json })
  } catch (error) {
    if (error instanceof ApiError && error.code === 'USE_ADMIN_LOGIN') {
      // Automatic safe recovery: retry exactly ONCE against the admin endpoint
      return await apiRequest<TokenResponse>('/auth/admin/login', { method: 'POST', json })
    }
    throw error
  }
}

/**
 * Direct admin login against /auth/admin/login.
 * Does NOT retry or loop if it fails.
 */
async function loginAdmin(email_id: string, otp: string): Promise<TokenResponse> {
  const json = { email_id, otp }
  return await apiRequest<TokenResponse>('/auth/admin/login', { method: 'POST', json })
}

export async function signIn(email: string, otp: string, options: SignInOptions = {}): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedOtp = otp.trim()

  const res = options.isAdmin
    ? await loginAdmin(normalizedEmail, normalizedOtp)
    : await loginUser(normalizedEmail, normalizedOtp)

  const { profile } = res
  const user: User = {
    id: profile.email_id,
    name: profile.name,
    email: profile.email_id,
    role: profile.role,
  }

  saveSession({
    accessToken: res.access_token,
    expiresAt: Date.now() + res.expires_in * 1000,
    user,
  })

  return user
}

export async function signInAdmin(email: string, otp: string): Promise<User> {
  return signIn(email, otp, { isAdmin: true })
}

/** The backend has no logout endpoint; dropping the token is enough. */
export async function signOut(): Promise<void> {
  saveSession(null)
}
