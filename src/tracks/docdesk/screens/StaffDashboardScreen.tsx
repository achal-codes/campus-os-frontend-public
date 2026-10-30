import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Spinner, Stack, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { listRequests } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import glass from '../theme/glass.module.css'
import type { DocRequest, DocType } from '../types'
import { formatDate } from '../utils/time'
import styles from './StaffDashboardScreen.module.css'

export function StaffDashboardScreen() {
  const [requests, setRequests] = useState<DocRequest[]>([])
  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function init() {
      setLoading(true)
      try {
        const [reqRes, typeRes] = await Promise.all([
          listRequests({ limit: 50 }),
          listDocTypes(),
        ])
        if (active) {
          setRequests(reqRes.items)
          setDocTypes(typeRes.items)
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load staff dashboard metrics')
      } finally {
        if (active) setLoading(false)
      }
    }
    init()
    return () => {
      active = false
    }
  }, [])

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const answeredRequests = requests.filter((r) => r.status === 'answered')
  const acknowledgedRequests = requests.filter((r) => r.status === 'acknowledged')
  const activeTypes = docTypes.filter((t) => t.status === 'active')

  return (
    <DocDeskLayout activeItem="dashboard">
      <div className={styles.container} data-testid="docdesk-staff-dashboard-screen">
        <Stack gap={1}>
          <Text as="h1" size="2xl" weight="bold">
            Student Affairs Operations Hub
          </Text>
          <Text tone="textMuted">
            Real-time operational overview, workload metrics, and document processing pipeline.
          </Text>
        </Stack>

        {error && <Alert tone="danger">{error}</Alert>}

        {loading ? (
          <div className={`${glass.panel} ${glass.tintBlue}`} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Spinner label="Loading operational metrics..." />
          </div>
        ) : (
          <>
            {/* Operational Metrics */}
            <div className={styles.metricsGrid}>
              <div className={`${glass.panel} ${glass.tintBlue} ${styles.metricCard}`}>
                <Text size="xs" weight="bold" tone="textMuted">PENDING WORKLOAD</Text>
                <Text size="2xl" weight="bold" data-testid="metric-pending-count">
                  {pendingRequests.length}
                </Text>
                <Text size="xs" tone="textMuted">Awaiting officer resolution</Text>
              </div>

              <div className={`${glass.panel} ${glass.tintBlue} ${styles.metricCard}`}>
                <Text size="xs" weight="bold" tone="textMuted">ANSWERED (ACTIVE)</Text>
                <Text size="2xl" weight="bold" data-testid="metric-answered-count">
                  {answeredRequests.length}
                </Text>
                <Text size="xs" tone="textMuted">Awaiting requester acknowledgement</Text>
              </div>

              <div className={`${glass.panel} ${glass.tintBlue} ${styles.metricCard}`}>
                <Text size="xs" weight="bold" tone="textMuted">COMPLETED & ARCHIVED</Text>
                <Text size="2xl" weight="bold" data-testid="metric-acknowledged-count">
                  {acknowledgedRequests.length}
                </Text>
                <Text size="xs" tone="textMuted">Fulfilled and acknowledged</Text>
              </div>

              <div className={`${glass.panel} ${glass.tintBlue} ${styles.metricCard}`}>
                <Text size="xs" weight="bold" tone="textMuted">DOCUMENT TYPES</Text>
                <Text size="2xl" weight="bold" data-testid="metric-doctypes-count">
                  {activeTypes.length}
                </Text>
                <Text size="xs" tone="textMuted">Active institutional catalogues</Text>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.actionsBar}>
              <Link to="/tracks/docdesk/staff" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md" data-testid="dash-goto-queue">
                  View Full Request Queue →
                </Button>
              </Link>
              <Link to="/tracks/docdesk/staff/bulk-tat" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="md" data-testid="dash-goto-bulk-tat">
                  Bulk Set TAT
                </Button>
              </Link>
              <Link to="/tracks/docdesk/staff/doc-types" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="md" data-testid="dash-goto-doc-types">
                  Manage Document Types
                </Button>
              </Link>
              <Link to="/tracks/docdesk/new" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="md" data-testid="dash-goto-new-request">
                  Submit Request
                </Button>
              </Link>
            </div>

            {/* Urgent Pending Queue */}
            <div className={`${glass.panel} ${glass.tintBlue}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <Stack gap={1}>
                  <Text as="h2" size="md" weight="bold">
                    Immediate Action Items (Pending Requests)
                  </Text>
                  <Text size="xs" tone="textMuted">
                    Requests waiting for turnaround target or resolution
                  </Text>
                </Stack>
                <Link to="/tracks/docdesk/staff" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" size="sm">See All ({requests.length})</Button>
                </Link>
              </div>

              {pendingRequests.length === 0 ? (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                  <Text size="sm" tone="textMuted">
                    Queue clear! No pending document requests require attention.
                  </Text>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Requester</th>
                        <th>Document Type</th>
                        <th>Submitted</th>
                        <th>Target (TAT)</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.slice(0, 5).map((r) => (
                        <tr key={r.request_id} data-testid={`dash-row-${r.request_id}`}>
                          <td><Text size="xs" weight="bold">{r.request_id}</Text></td>
                          <td>
                            <Stack gap={1}>
                              <Text size="sm" weight="medium">{r.requested_by_name ?? r.requested_by}</Text>
                              <Text size="xs" tone="textMuted">{r.requested_by_role ?? 'student'}</Text>
                            </Stack>
                          </td>
                          <td><Text size="sm">{r.doc_type_name ?? r.doc_type_id}</Text></td>
                          <td><Text size="xs" tone="textMuted">{formatDate(r.created_at)}</Text></td>
                          <td><TATBadge tat={r.tat} /></td>
                          <td><StatusBadge status={r.status} /></td>
                          <td>
                            <Link to={`/tracks/docdesk/staff/requests/${r.request_id}`} style={{ textDecoration: 'none' }}>
                              <Button variant="secondary" size="sm">Process</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DocDeskLayout>
  )
}
