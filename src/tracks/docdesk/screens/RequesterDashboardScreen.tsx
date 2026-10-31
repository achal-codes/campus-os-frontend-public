import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Spinner, Stack, Text } from '@/ui'
import { listRequests } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import { useProfile } from '../hooks/useProfile'
import type { DocRequest } from '../types'
import { formatDate } from '../utils/time'
import styles from './RequesterDashboardScreen.module.css'

export function RequesterDashboardScreen() {
  const { user } = useAuth()
  const { profile, isStudentAffairs } = useProfile()
  const [requests, setRequests] = useState<DocRequest[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [acknowledgedCount, setAcknowledgedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [pendingRes, answeredRes, ackRes, listRes] = await Promise.all([
          listRequests({ mine: true, status: 'pending', limit: 1 }),
          listRequests({ mine: true, status: 'answered', limit: 1 }),
          listRequests({ mine: true, status: 'acknowledged', limit: 1 }),
          listRequests({ mine: true, limit: 5 }),
        ])
        if (active) {
          setPendingCount(pendingRes.count)
          setAnsweredCount(answeredRes.count)
          setAcknowledgedCount(ackRes.count)
          setRequests(listRes.items)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load requests')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [])

  return (
    <DocDeskLayout activeItem="dashboard">
      <Stack gap={6} data-testid="docdesk-requester-dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Stack gap={1}>
            <Text as="h1" size="2xl" weight="bold">
              DocDesk
            </Text>
            <Text tone="textMuted">
              Welcome, <strong>{profile?.name ?? user?.name ?? 'User'}</strong> ({user?.role})
              {profile?.dept && ` · Department: ${profile.dept}`}
              {profile?.usn && ` · USN: ${profile.usn}`}
            </Text>
          </Stack>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Link to="/tracks/docdesk/catalogue" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="md">
                Browse Catalogue
              </Button>
            </Link>
            <Link to="/tracks/docdesk/new" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md" data-testid="new-request-button">
                New Request
              </Button>
            </Link>
          </div>
        </div>

        {isStudentAffairs && (
          <div style={{ borderLeft: '4px solid var(--color-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Stack gap={1}>
                <Text size="md" weight="bold">Student Affairs Staff Operations</Text>
                <Text size="sm" tone="textMuted">
                  You are authorized as Student Affairs staff. Manage incoming student requests, set turnaround targets, and issue official documents.
                </Text>
              </Stack>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Link to="/tracks/docdesk/staff" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="md">
                    Open Staff Queue
                  </Button>
                </Link>
                <Link to="/tracks/docdesk/staff/dashboard" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" size="md">
                    Staff Operations Hub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert tone="danger" data-testid="dashboard-error">
            {error}
          </Alert>
        )}

        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Spinner label="Loading your requests..." />
          </div>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <Link to="/tracks/docdesk/my-requests?status=pending" className={styles.statCardLink}>
                <div className={styles.statCard}>
                  <Text size="sm" tone="textMuted">Pending Requests</Text>
                  <div className={styles.statNumber} data-testid="stat-pending">{pendingCount}</div>
                  <Text size="xs" tone="textMuted">Being processed by Student Affairs</Text>
                </div>
              </Link>
              <Link to="/tracks/docdesk/my-requests?status=answered" className={styles.statCardLink}>
                <div className={styles.statCard}>
                  <Text size="sm" tone="textMuted">Ready for Acknowledgment</Text>
                  <div className={styles.statNumber} data-testid="stat-answered">{answeredCount}</div>
                  <Text size="xs" tone="textMuted">Document issued, awaiting verification</Text>
                </div>
              </Link>
              <Link to="/tracks/docdesk/my-requests?status=acknowledged" className={styles.statCardLink}>
                <div className={styles.statCard}>
                  <Text size="sm" tone="textMuted">Completed / Closed</Text>
                  <div className={styles.statNumber} data-testid="stat-acknowledged">{acknowledgedCount}</div>
                  <Text size="xs" tone="textMuted">Officially fulfilled and archived</Text>
                </div>
              </Link>
            </div>

            <div className={styles.recentSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <Stack gap={1}>
                  <Text as="h2" size="lg" weight="bold">
                    Recent Document Requests
                  </Text>
                  <Text size="xs" tone="textMuted">
                    Showing {requests.length} loaded request{requests.length === 1 ? '' : 's'}
                  </Text>
                </Stack>
                <Link to="/tracks/docdesk/my-requests" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {requests.length === 0 ? (
                <div style={{ padding: 'var(--space-6)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <Text tone="textMuted" size="sm">You have not submitted any document requests yet.</Text>
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <Link to="/tracks/docdesk/new" style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="sm">
                        New Request
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className={styles.list}>
                  {requests.map((req) => (
                    <Link
                      key={req.request_id}
                      to={`/tracks/docdesk/requests/${req.request_id}`}
                      className={styles.listItem}
                    >
                      <Stack gap={1}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Text size="sm" weight="bold">
                            {req.doc_type_name ?? req.doc_type_id}
                          </Text>
                          <StatusBadge status={req.status} />
                          {req.tat && <TATBadge tat={req.tat} />}
                        </div>
                        <Text size="xs" tone="textMuted" style={{ maxWidth: '600px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Reason: {req.reason}
                        </Text>
                      </Stack>
                      <div style={{ textAlign: 'right' }}>
                        <Text size="xs" tone="textMuted">
                          {formatDate(req.created_at)}
                        </Text>
                        <Text size="xs" tone="primary" weight="medium" style={{ marginTop: 2 }}>
                          View
                        </Text>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Stack>
    </DocDeskLayout>
  )
}
