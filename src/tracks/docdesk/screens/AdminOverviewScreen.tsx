import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Card, SelectField, Spinner, Stack, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { listRequests } from '../api/requests'
import { DocDeskNav } from '../components/DocDeskNav'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import type { DocRequest, DocType, RequestStatus } from '../types'
import { formatDate } from '../utils/time'
import styles from './AdminOverviewScreen.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'answered', label: 'Answered' },
  { value: 'acknowledged', label: 'Acknowledged' },
]

export function AdminOverviewScreen() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [docTypeFilter, setDocTypeFilter] = useState<string>('')
  const [docTypes, setDocTypes] = useState<DocType[]>([])

  const [items, setItems] = useState<DocRequest[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await listDocTypes()
        setDocTypes(res.items)
      } catch {
        // silent fallback
      }
    }
    loadTypes()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const res = await listRequests({
        status: (statusFilter as RequestStatus) || undefined,
        doc_type_id: docTypeFilter || undefined,
        limit: 25,
      })
      setItems(res.items)
      setNextCursor(res.next_cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, docTypeFilter])

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await listRequests({
        status: (statusFilter as RequestStatus) || undefined,
        doc_type_id: docTypeFilter || undefined,
        cursor: nextCursor,
        limit: 25,
      })
      setItems((prev) => [...prev, ...res.items])
      setNextCursor(res.next_cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more records')
    } finally {
      setLoadingMore(false)
    }
  }

  const typeOptions = [
    { value: '', label: 'All Document Types' },
    ...docTypes.map((dt) => ({ value: dt.doc_type_id, label: dt.name })),
  ]

  return (
    <Stack gap={6} data-testid="docdesk-admin-overview-screen">
      <DocDeskNav />

      <Stack gap={1}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Text as="h1" size="2xl" weight="bold">
            DocDesk — Institutional Audit & Overview
          </Text>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-bold)',
              backgroundColor: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            STRICTLY READ-ONLY
          </span>
        </div>
        <Text tone="textMuted">
          Institution-wide audit inspection of all student, faculty, and staff document requests and resolutions.
        </Text>
      </Stack>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 180 }}>
          <SelectField
            label="Filter Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>

        <div style={{ minWidth: 220 }}>
          <SelectField
            label="Filter Document Type"
            value={docTypeFilter}
            options={typeOptions}
            onChange={(e) => setDocTypeFilter(e.target.value)}
          />
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <Stack gap={4} style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
          <Spinner label="Loading institution-wide requests..." />
        </Stack>
      ) : items.length === 0 ? (
        <Card>
          <Stack gap={2} style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            <Text size="md" weight="medium">No records found</Text>
            <Text size="sm" tone="textMuted">No document requests match the selected filters.</Text>
          </Stack>
        </Card>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table} aria-label="Admin Audit Table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Requester</th>
                  <th>Role / Dept</th>
                  <th>Document Type</th>
                  <th>Submitted</th>
                  <th>Target (TAT)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.request_id} data-testid={`admin-row-${r.request_id}`}>
                    <td><Text size="xs" weight="bold">{r.request_id}</Text></td>
                    <td>
                      <Stack gap={1}>
                        <Text size="sm" weight="medium">{r.requested_by_name ?? r.requested_by}</Text>
                        <Text size="xs" tone="textMuted">{r.requested_by}</Text>
                      </Stack>
                    </td>
                    <td>
                      <Text size="xs">{r.requested_by_role}{r.requested_by_dept ? ` • ${r.requested_by_dept}` : ''}</Text>
                    </td>
                    <td><Text size="sm">{r.doc_type_name ?? r.doc_type_id}</Text></td>
                    <td><Text size="xs" tone="textMuted">{formatDate(r.created_at)}</Text></td>
                    <td><TATBadge tat={r.tat} /></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <Link to={`/tracks/docdesk/admin/requests/${r.request_id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm">Inspect</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
            <Text size="xs" tone="textMuted">Showing {items.length} loaded records</Text>
            {nextCursor && (
              <Button variant="secondary" size="sm" onClick={handleLoadMore} loading={loadingMore}>
                Load More
              </Button>
            )}
          </div>
        </>
      )}
    </Stack>
  )
}
