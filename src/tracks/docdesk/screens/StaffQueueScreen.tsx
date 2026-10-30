import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Card, SelectField, Spinner, Stack, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { listRequests } from '../api/requests'
import { BulkTATModal } from '../components/BulkTATModal'
import { DocDeskNav } from '../components/DocDeskNav'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import type { DocRequest, DocType, RequestStatus } from '../types'
import { formatDate } from '../utils/time'
import styles from './StaffQueueScreen.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending Only' },
  { value: 'answered', label: 'Answered' },
  { value: 'acknowledged', label: 'Acknowledged' },
]

export function StaffQueueScreen() {
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [docTypeFilter, setDocTypeFilter] = useState<string>('')
  const [docTypes, setDocTypes] = useState<DocType[]>([])

  const [items, setItems] = useState<DocRequest[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)

  // Load doc types for filter
  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await listDocTypes()
        setDocTypes(res.items)
      } catch {
        // silent filter fallback
      }
    }
    loadTypes()
  }, [])

  async function loadQueue(isRefresh = false) {
    if (!isRefresh) setLoading(true)
    setError(null)
    try {
      const res = await listRequests({
        status: (statusFilter as RequestStatus) || undefined,
        doc_type_id: docTypeFilter || undefined,
        limit: 25,
      })
      setItems(res.items)
      setNextCursor(res.next_cursor)
      setSelectedIds(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
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

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pendingItems = items.filter((i) => i.status === 'pending')
  const allPendingSelected =
    pendingItems.length > 0 && pendingItems.every((i) => selectedIds.has(i.request_id))

  function toggleSelectAllPending() {
    if (allPendingSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingItems.map((i) => i.request_id)))
    }
  }

  const typeOptions = [
    { value: '', label: 'All Document Types' },
    ...docTypes.map((dt) => ({ value: dt.doc_type_id, label: dt.name })),
  ]

  return (
    <Stack gap={6} data-testid="docdesk-staff-queue-screen">
      <DocDeskNav />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <Stack gap={1}>
          <Text as="h1" size="2xl" weight="bold">
            Student Affairs Operations Queue
          </Text>
          <Text tone="textMuted">
            Review incoming requests, set turnaround targets, and issue official resolutions.
          </Text>
        </Stack>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" size="sm" onClick={() => loadQueue(true)} data-testid="queue-refresh-button">
            ↻ Refresh
          </Button>

          {selectedIds.size > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowBulkModal(true)}
              data-testid="bulk-tat-button"
            >
              Bulk Set TAT ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <div style={{ minWidth: 180 }}>
            <SelectField
              label="Status"
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-testid="queue-status-filter"
            />
          </div>

          <div style={{ minWidth: 220 }}>
            <SelectField
              label="Document Type"
              value={docTypeFilter}
              options={typeOptions}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              data-testid="queue-doctype-filter"
            />
          </div>
        </div>

        <Text size="xs" tone="textMuted">
          Loaded: <strong>{items.length}</strong> records
        </Text>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <Stack gap={4} style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
          <Spinner label="Loading operational queue..." />
        </Stack>
      ) : items.length === 0 ? (
        <Card>
          <Stack gap={2} style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            <Text size="md" weight="medium">No requests match current filters</Text>
            <Text size="sm" tone="textMuted">
              No pending or historical requests found for this filter combination.
            </Text>
          </Stack>
        </Card>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table} aria-label="Student Affairs Queue">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleSelectAllPending}
                      disabled={pendingItems.length === 0}
                      aria-label="Select all pending records"
                      title="Select all pending records"
                    />
                  </th>
                  <th>ID</th>
                  <th>Requester</th>
                  <th>Role / Dept</th>
                  <th>Document Type</th>
                  <th>Submitted</th>
                  <th>Target (TAT)</th>
                  <th>Indicators</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const isPending = r.status === 'pending'
                  const isSelected = selectedIds.has(r.request_id)

                  return (
                    <tr
                      key={r.request_id}
                      className={isSelected ? styles.selectedRow : undefined}
                      data-testid={`queue-row-${r.request_id}`}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isPending}
                          onChange={() => toggleSelect(r.request_id)}
                          aria-label={`Select ${r.request_id}`}
                        />
                      </td>
                      <td>
                        <Text size="xs" weight="bold">
                          {r.request_id}
                        </Text>
                      </td>
                      <td>
                        <Stack gap={1}>
                          <Text size="sm" weight="medium">
                            {r.requested_by_name ?? r.requested_by}
                          </Text>
                          <Text size="xs" tone="textMuted">
                            {r.requested_by}
                          </Text>
                        </Stack>
                      </td>
                      <td>
                        <Text size="xs">
                          {r.requested_by_role}
                          {r.requested_by_dept ? ` • ${r.requested_by_dept}` : ''}
                        </Text>
                      </td>
                      <td>
                        <Text size="sm">{r.doc_type_name ?? r.doc_type_id}</Text>
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
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          {r.document && <span title="Answer document attached">📎 Doc</span>}
                          {r.filled_form && <span title="Filled form returned by requester">📝 Form</span>}
                          {!r.document && !r.filled_form && <Text size="xs" tone="textMuted">—</Text>}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        <Link to={`/tracks/docdesk/staff/requests/${r.request_id}`} style={{ textDecoration: 'none' }}>
                          <Button variant="secondary" size="sm" data-testid={`inspect-${r.request_id}`}>
                            Process
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
            <Text size="xs" tone="textMuted">
              Showing {items.length} loaded records
            </Text>

            {nextCursor && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadMore}
                loading={loadingMore}
                data-testid="queue-load-more"
              >
                Load More
              </Button>
            )}
          </div>
        </>
      )}

      {showBulkModal && (
        <BulkTATModal
          requestIds={Array.from(selectedIds)}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            setShowBulkModal(false)
            loadQueue(true)
          }}
        />
      )}
    </Stack>
  )
}
