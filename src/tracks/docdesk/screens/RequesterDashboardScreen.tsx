import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Spinner, Stack, Text } from '@/ui'
import { listRequests } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import { useProfile } from '../hooks/useProfile'
import glass from '../theme/glass.module.css'
import type { DocRequest } from '../types'
import { formatDate } from '../utils/time'
import styles from './RequesterDashboardScreen.module.css'

export function RequesterDashboardScreen() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [requests, setRequests] = useState<DocRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await listRequests({ mine: true, limit: 25 })
        if (active) {
          setRequests(res.items)
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

  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const answeredCount = requests.filter((r) => r.status === 'answered').length
  const acknowledgedCount = requests.filter((r) => r.status === 'acknowledged').length

  return (
    <DocDeskLayout activeItem="dashboard">
      <Stack gap={6} data-testid="docdesk-requester-dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Stack gap={1}>
            <Text as="h1" size="2xl" weight="bold">
              DocDesk — Document Portal
            </Text>
            <Text tone="textMuted">
              Welcome, <strong>{profile?.name ?? user?.name ?? 'User'}</strong> ({user?.role})
              {profile?.dept && ` • Department: ${profile.dept}`}
              {profile?.usn && ` • USN: ${profile.usn}`}
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
                + Request Document
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert tone="danger" data-testid="dashboard-error">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className={`${glass.panel} ${glass.tintBlue}`} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Spinner label="Loading your requests..." />
          </div>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <Text size="sm" tone="textMuted">Pending Requests</Text>
                <div className={styles.statNumber} data-testid="stat-pending">{pendingCount}</div>
                <Text size="xs" tone="textMuted">Being processed by Student Affairs</Text>
              </div>
              <div className={styles.statCard}>
                <Text size="sm" tone="textMuted">Ready for Acknowledgment</Text>
                <div className={styles.statNumber} data-testid="stat-answered">{answeredCount}</div>
                <Text size="xs" tone="textMuted">Document issued, awaiting verification</Text>
              </div>
              <div className={styles.statCard}>
                <Text size="sm" tone="textMuted">Completed / Closed</Text>
                <div className={styles.statNumber} data-testid="stat-acknowledged">{acknowledgedCount}</div>
                <Text size="xs" tone="textMuted">Officially fulfilled and archived</Text>
              </div>
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
                <div className={`${glass.panel} ${glass.tintBlue}`} style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                  <Stack gap={2} style={{ alignItems: 'center' }}>
                    <Text size="md" weight="medium">No document requests found</Text>
                    <Text size="sm" tone="textMuted">
                      You have not submitted any document requests yet. Browse the catalogue or start a new request.
                    </Text>
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <Link to="/tracks/docdesk/catalogue" style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm">
                          Browse Catalogue
                        </Button>
                      </Link>
                    </div>
                  </Stack>
                </div>
              ) : (
                <div className={styles.list}>
                  {requests.slice(0, 5).map((req) => (
                    <Link
                      key={req.request_id}
                      to={`/tracks/docdesk/requests/${req.request_id}`}
                      className={styles.listItem}
                      data-testid={`request-row-${req.request_id}`}
                    >
                      <Stack gap={1}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Text size="sm" weight="bold">
                            {req.doc_type_name ?? req.doc_type_id}
                          </Text>
                          <Text size="xs" tone="textMuted">
                            #{req.request_id}
                          </Text>
                        </div>
                        <Text size="xs" tone="textMuted">
                          Requested: {formatDate(req.created_at)}
                        </Text>
                      </Stack>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <TATBadge tat={req.tat} />
                        <StatusBadge status={req.status} />
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
