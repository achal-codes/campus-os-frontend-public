import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/core/auth'
import { getMyProfile } from '../api/profile'
import type { UserProfile } from '../types'
import { isStudentAffairs } from '../utils/department'

export interface ProfileState {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  isStudentAffairs: boolean
  retry: () => void
}

export function useProfile(): ProfileState {
  const { user } = useAuth()
  const needsProfile = Boolean(user && user.role !== 'admin')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!needsProfile) return
    setLoading(true)
    setError(null)
    try {
      const data = await getMyProfile()
      setProfile(data)
      fetchedRef.current = user?.id ?? null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [needsProfile, user])

  useEffect(() => {
    if (needsProfile && fetchedRef.current !== user?.id) {
      fetchProfile()
    }
  }, [needsProfile, user, fetchProfile])

  const sa = user?.role === 'office_staff' && profile ? isStudentAffairs(profile.dept) : false

  return {
    profile: needsProfile ? profile : null,
    loading: needsProfile ? loading : false,
    error: needsProfile ? error : null,
    isStudentAffairs: sa,
    retry: fetchProfile,
  }
}
