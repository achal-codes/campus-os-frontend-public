import { apiRequest } from '@/core/api'
import type { UserProfile } from '../types'

/** Fetch the current user's profile from the backend (non-admin users) */
export function getMyProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me')
}
