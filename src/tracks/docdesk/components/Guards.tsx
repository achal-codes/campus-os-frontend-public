import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Card, Spinner, Stack, Text } from '@/ui'
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

  if (loading || (user?.role === 'office_staff' && profile === null && !error)) {
    return (
      <Stack gap={4} style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
        <Spinner label="Verifying Student Affairs clearance..." />
        <Text size="sm" tone="textMuted">Checking departmental authorization...</Text>
      </Stack>
    )
  }

  if (user?.role !== 'office_staff' || !isStudentAffairs) {
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: 640, margin: 'var(--space-6) auto' }}>
        <Stack gap={4}>
          <Alert tone="danger">
            <strong>Student Affairs Clearance Required</strong>
          </Alert>
          <Card>
            <Stack gap={3}>
              <Text as="h2" size="lg" weight="bold">
                Student Affairs Operations Area
              </Text>
              <Text size="sm" tone="textMuted">
                This area (queue triage, turnaround time setting, answering requests with official documents, and document types management) is restricted to <strong>Office Staff</strong> assigned to the <strong>Student Affairs</strong> department.
              </Text>
              <div style={{ background: 'var(--color-surface-muted)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                <Text size="xs" weight="medium">
                  Currently signed in as: <strong>{user?.name ?? user?.email ?? 'Unknown'}</strong>
                </Text>
                <Text size="xs" tone="textMuted" style={{ marginTop: 2 }}>
                  Role: <code>{user?.role ?? 'none'}</code> {profile?.dept ? `· Department: ${profile.dept}` : ''}
                </Text>
              </div>
              <div style={{ background: 'rgba(170, 59, 255, 0.08)', border: '1px solid rgba(170, 59, 255, 0.2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
                <Text size="xs" weight="bold" tone="primary" style={{ marginBottom: 4 }}>
                  How to test or log in as Student Affairs:
                </Text>
                <Text size="xs" tone="textMuted" style={{ lineHeight: 1.5 }}>
                  1. Log in as <strong>Admin</strong>.<br />
                  2. Visit <code>/admin</code> to create an <strong>Office staff</strong> user with Department: <strong>Student Affairs</strong>.<br />
                  3. Use the OTP returned by the API to sign in as that user at <code>/login</code>.
                </Text>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Link to="/tracks/docdesk" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" size="sm">
                    ← Back to Requester Portal
                  </Button>
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="sm">
                      Go to Admin User Management →
                    </Button>
                  </Link>
                )}
              </div>
            </Stack>
          </Card>
        </Stack>
      </div>
    )
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
