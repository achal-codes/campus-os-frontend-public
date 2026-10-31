import { apiRequest } from '@/core/api'
import type { Role } from '@/core/auth'

export interface ProfileData {
  name: string
  email_id?: string
  email?: string
  role: Role | string
  phone_number?: string
  team_id?: string
  usn?: string
  dept?: string
  designation?: string
  institution_name?: string
  created_at?: string
  updated_at?: string
}

/**
 * Fetch profile data for the active user.
 * Admin uses /admin/me.
 * Student, Faculty, and Office Staff use /users/me.
 */
export async function getProfile(role: Role): Promise<ProfileData> {
  if (role === 'admin') {
    return apiRequest<ProfileData>('/admin/me')
  }
  return apiRequest<ProfileData>('/users/me')
}

