import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '@/core/auth'
import { Spinner, Stack, Text } from '@/ui'
import { useProfile } from '../hooks/useProfile'

interface GuardProps {
  children: ReactNode
}

/** Allows non-admin requesters (student, faculty, office_staff). Redirects admin to /tracks/docdesk/admin */
export function RequesterGuard({ children }: GuardProps) {
  const { user } = useAuth()

  if (user?.role === 'admin') {
    return <Navigate to="/tracks/docdesk/admin" replace />
  }

  return <>{children}</>
}

/** Strictly checks office_staff with Student Affairs department. Waits for profile hydration. */
export function StudentAffairsGuard({ children }: GuardProps) {
  const { user } = useAuth()
  const { loading, isStudentAffairs, error, profile } = useProfile()

  if (user?.role !== 'office_staff') {
    return <Navigate to="/tracks/docdesk" replace />
  }

  if (loading || (profile === null && !error)) {
    return (
      <Stack gap={4} style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
        <Spinner label="Verifying Student Affairs clearance..." />
        <Text size="sm" tone="textMuted">Checking departmental authorization...</Text>
      </Stack>
    )
  }

  if (error || !isStudentAffairs) {
    return <Navigate to="/tracks/docdesk" replace />
  }

  return <>{children}</>
}

/** Admin route guard. Never blocks on profile hydration. */
export function AdminGuard({ children }: GuardProps) {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <Navigate to="/tracks/docdesk" replace />
  }

  return <>{children}</>
}
