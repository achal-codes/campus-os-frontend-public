import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Card, SelectField, Spinner, Stack, Text, TextField } from '@/ui'
import { listRequests } from '../api/requests'
import { DocDeskNav } from '../components/DocDeskNav'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import type { DocRequest, RequestStatus } from '../types'
import { formatDate } from '../utils/time'
import styles from './MyRequestsScreen.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'answered', label: 'Answered' },
  { value: 'acknowledged', label: 'Acknowledged' },
]

export function MyRequestsScreen() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<DocRequest[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await listRequests({
          mine: true,
          status: (statusFilter as RequestStatus) || undefined,
          limit: 25,
        })
        if (active) {
          setItems(res.items)
          setNextCursor(res.next_cursor)
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
  }, [statusFilter])

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await listRequests({
        mine: true,
        status: (statusFilter as RequestStatus) || undefined,
        cursor: nextCursor,
        limit: 25,
      })
      setItems((prev) => [...prev, ...res.items])
      setNextCursor(res.next_cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more requests')
    } finally {
      setLoadingMore(false)
    }
  }

  // Client-side filter on loaded records
  const filtered = items.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.request_id.toLowerCase().includes(q) ||
      (item.doc_type_name && item.doc_type_name.toLowerCase().includes(q)) ||
      item.reason.toLowerCase().includes(q)
    )
  })

  return (
    <Stack gap={6} data-testid="docdesk-my-requests-screen">
      <DocDeskNav />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <Stack gap={1}>
          <Text as="h1" size="2xl" weight="bold">
            My Document Requests
          </Text>
          <Text tone="textMuted">
            Track status, review official responses, and download issued documents.
          </Text>
        </Stack>

        <Link to="/tracks/docdesk/new" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="sm">
            + New Request
          </Button>
        </Link>
      </div>

      <div className={styles.filters}>
        <div style={{ minWidth: 200 }}>
          <SelectField
            label="Filter by Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>

        <div style={{ flexGrow: 1, minWidth: 240 }}>
          <TextField
            label="Search Loaded Records"
            placeholder="Search by ID, type, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            hint="Client-side search applies to currently loaded records only."
          />
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <Stack gap={4} style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
          <Spinner label="Loading your requests..." />
        </Stack>
      ) : filtered.length === 0 ? (
        <Card>
          <Stack gap={2} style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            <Text size="md" weight="medium">No matching requests found</Text>
            <Text size="sm" tone="textMuted">
              Try adjusting your filter or submit a new document request.
            </Text>
          </Stack>
        </Card>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table} aria-label="My Requests Table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Document Type</th>
                  <th>Reason Preview</th>
                  <th>Submitted</th>
                  <th>Target Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.request_id} data-testid={`request-row-${r.request_id}`}>
                    <td>
                      <Text size="xs" weight="bold">
                        {r.request_id}
                      </Text>
                    </td>
                    <td>
                      <Text size="sm" weight="medium">
                        {r.doc_type_name ?? r.doc_type_id}
                      </Text>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <Text size="xs" tone="textMuted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.reason}
                      </Text>
                    </td>
                    <td>
                      <Text size="xs" tone="textMuted">
                        {formatDate(r.created_at)}
                      </Text>
                    </td>
                    <td>
                      <TATBadge tat={r.tat} />
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <Link to={`/tracks/docdesk/requests/${r.request_id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm">
                          Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
            <Text size="xs" tone="textMuted">
              Showing {filtered.length} of {items.length} loaded records
            </Text>

            {nextCursor && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadMore}
                loading={loadingMore}
                data-testid="load-more-button"
              >
                Load More
              </Button>
            )}
          </div>
        </>
      )}
    </Stack>
  )
}
