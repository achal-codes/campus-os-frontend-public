import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { Alert, Button, SelectField, Spinner, Stack, Text, TextField } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { listRequests } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import glass from '../theme/glass.module.css'
import type { DocRequest, DocType, RequestStatus } from '../types'
import { formatDate } from '../utils/time'
import styles from './StaffQueueScreen.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending Only' },
  { value: 'answered', label: 'Answered' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

export function StaffQueueScreen() {
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [docTypeFilter, setDocTypeFilter] = useState<string>('')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'mine'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [docTypes, setDocTypes] = useState<DocType[]>([])

  const [items, setItems] = useState<DocRequest[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
        mine: scopeFilter === 'mine' ? true : undefined,
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
  }, [statusFilter, docTypeFilter, scopeFilter])

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await listRequests({
        status: (statusFilter as RequestStatus) || undefined,
        doc_type_id: docTypeFilter || undefined,
        mine: scopeFilter === 'mine' ? true : undefined,
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

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const query = searchQuery.toLowerCase()
    return items.filter((r) => {
      const idMatch = r.request_id.toLowerCase().includes(query)
      const nameMatch = (r.requested_by_name ?? '').toLowerCase().includes(query)
      const emailMatch = r.requested_by.toLowerCase().includes(query)
      const docMatch = (r.doc_type_name ?? '').toLowerCase().includes(query)
      const noteMatch = (r.reason ?? '').toLowerCase().includes(query)
      return idMatch || nameMatch || emailMatch || docMatch || noteMatch
    })
  }, [items, searchQuery])

  const pendingItems = filteredItems.filter((i) => i.status === 'pending')
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

  function handleNavigateBulk() {
    navigate('/tracks/docdesk/staff/bulk-tat', {
      state: { selectedIds: Array.from(selectedIds) },
    })
  }

  return (
    <DocDeskLayout activeItem="queue">
      <div className={styles.container} data-testid="docdesk-staff-queue-screen">
        <div className={styles.header}>
          <Stack gap={1}>
            <Text as="h1" size="2xl" weight="bold">
              Student Affairs Request Queue
            </Text>
            <Text tone="textMuted">
              Review incoming requests, set turnaround targets, and issue official resolutions.
            </Text>
          </Stack>

          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadQueue(true)}
              data-testid="queue-refresh-button"
            >
              ↻ Refresh
            </Button>

            {selectedIds.size > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNavigateBulk}
                data-testid="bulk-tat-button"
              >
                Set Bulk TAT ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>

        {/* Glass Filter Panel */}
        <div className={`${glass.panel} ${glass.tintBlue} ${styles.filtersPanel}`}>
          {/* Status Pills */}
          <div className={styles.statusPills}>
            {STATUS_OPTIONS.map((opt) => {
              const isActive = statusFilter === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.statusPill} ${isActive ? styles.statusPillActive : ''}`}
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          <div className={styles.filterControls}>
            {/* Scope Selector */}
            <div className={styles.scopeSelector}>
              <button
                type="button"
                className={`${styles.scopeOption} ${scopeFilter === 'all' ? styles.scopeOptionActive : ''}`}
                onClick={() => setScopeFilter('all')}
              >
                All Requests
              </button>
              <button
                type="button"
                className={`${styles.scopeOption} ${scopeFilter === 'mine' ? styles.scopeOptionActive : ''}`}
                onClick={() => setScopeFilter('mine')}
              >
                My Queue
              </button>
            </div>

            <div style={{ minWidth: 160, display: 'none' }}>
              <SelectField
                label="Status Filter"
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={(e) => setStatusFilter(e.target.value)}
                data-testid="queue-status-filter"
              />
            </div>

            <div style={{ minWidth: 200, flex: 1 }}>
              <SelectField
                label="Document Type"
                value={docTypeFilter}
                options={typeOptions}
                onChange={(e) => setDocTypeFilter(e.target.value)}
                data-testid="queue-doctype-filter"
              />
            </div>

            <div style={{ minWidth: 220, flex: 1.2 }}>
              <TextField
                label="Search Requests"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, requester, note..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text size="xs" tone="textMuted">
              Loaded: <strong>{filteredItems.length}</strong> records
              {selectedIds.size > 0 && ` · ${selectedIds.size} pending selected`}
            </Text>
          </div>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}

        {loading ? (
          <div className={`${glass.panel} ${glass.tintBlue}`} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Spinner label="Loading operational queue..." />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={`${glass.panel} ${glass.tintBlue}`} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Stack gap={2} style={{ alignItems: 'center' }}>
              <Text size="md" weight="medium">No requests match current filters</Text>
              <Text size="sm" tone="textMuted">
                No pending or historical requests found for this filter combination.
              </Text>
            </Stack>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className={`${glass.panel} ${glass.tintBlue} ${styles.desktopOnly}`}>
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
                    {filteredItems.map((r) => {
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
            </div>

            {/* Mobile Card List */}
            <div className={styles.mobileCardList}>
              {filteredItems.map((r) => {
                const isPending = r.status === 'pending'
                const isSelected = selectedIds.has(r.request_id)

                return (
                  <div
                    key={r.request_id}
                    className={`${glass.panel} ${glass.tintBlue} ${styles.mobileCard} ${isSelected ? styles.selectedRow : ''}`}
                    data-testid={`queue-row-${r.request_id}`}
                  >
                    <div className={styles.mobileCardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isPending}
                          onChange={() => toggleSelect(r.request_id)}
                          aria-label={`Select ${r.request_id}`}
                        />
                        <Text size="xs" weight="bold">#{r.request_id}</Text>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>

                    <Stack gap={1}>
                      <Text size="sm" weight="bold">{r.doc_type_name ?? r.doc_type_id}</Text>
                      <Text size="xs" tone="textMuted">
                        By {r.requested_by_name ?? r.requested_by} ({r.requested_by_role})
                      </Text>
                      <Text size="xs" tone="textMuted">Submitted: {formatDate(r.created_at)}</Text>
                    </Stack>

                    <div className={styles.mobileCardFooter}>
                      <TATBadge tat={r.tat} />
                      <Link to={`/tracks/docdesk/staff/requests/${r.request_id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm" data-testid={`inspect-${r.request_id}`}>
                          Process
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
              <Text size="xs" tone="textMuted">
                Showing {filteredItems.length} loaded records
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
      </div>
    </DocDeskLayout>
  )
}
