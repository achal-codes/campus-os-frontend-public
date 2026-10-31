import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Alert, Button, Spinner, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { listRequests } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { LifecycleStrip } from '../components/LifecycleStrip'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import type { DocRequest, DocType, RequestStatus } from '../types'
import { formatDate, formatDateTime } from '../utils/time'
import styles from './MyRequestsScreen.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'answered', label: 'Answered' },
  { value: 'acknowledged', label: 'Acknowledged' },
]

export function MyRequestsScreen() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<string>(() => searchParams.get('status') ?? '')
  const [docTypeFilter, setDocTypeFilter] = useState<string>(() => searchParams.get('doc_type_id') ?? '')
  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [items, setItems] = useState<DocRequest[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (docTypeFilter) params.set('doc_type_id', docTypeFilter)
    setSearchParams(params, { replace: true })
  }, [statusFilter, docTypeFilter, setSearchParams])

  // Load available document types for the filter dropdown
  useEffect(() => {
    let active = true
    async function loadTypes() {
      try {
        const res = await listDocTypes()
        if (active) setDocTypes(res.items)
      } catch {
        // Silently keep empty list if types fail to load
      }
    }
    loadTypes()
    return () => {
      active = false
    }
  }, [])

  // Load requests based on API filters
  useEffect(() => {
    let active = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await listRequests({
          mine: true,
          status: (statusFilter as RequestStatus) || undefined,
          doc_type_id: docTypeFilter || undefined,
          limit: 25,
        })
        if (active) {
          setItems(res.items)
          setNextCursor(res.next_cursor)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load requests. Check connection and retry.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [statusFilter, docTypeFilter])

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await listRequests({
        mine: true,
        status: (statusFilter as RequestStatus) || undefined,
        doc_type_id: docTypeFilter || undefined,
        cursor: nextCursor,
        limit: 25,
      })
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.request_id))
        const newUnique = res.items.filter((i) => !existingIds.has(i.request_id))
        return [...prev, ...newUnique]
      })
      setNextCursor(res.next_cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more requests')
    } finally {
      setLoadingMore(false)
    }
  }

  function handleCopy(id: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(id).catch(() => {})
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function clearFilters() {
    setStatusFilter('')
    setDocTypeFilter('')
  }

  const activeDocTypeName = docTypes.find((d) => d.doc_type_id === docTypeFilter)?.name
  const isFiltered = Boolean(statusFilter || docTypeFilter)
  const latestRequest = items.length > 0 ? items[0] : null

  // Stat card counts computed dynamically
  const pendingCount = items.filter((i) => i.status === 'pending').length
  const answeredCount = items.filter((i) => i.status === 'answered').length
  const ackedCount = items.filter((i) => i.status === 'acknowledged').length

  return (
    <DocDeskLayout activeItem="my-requests">
      <div className={styles.container} data-testid="docdesk-my-requests-screen">
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h1 className={styles.title}>My requests</h1>
            <p className={styles.subtitle}>Track the status of your document requests.</p>
          </div>

          <Link to="/tracks/docdesk/new" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md" data-testid="new-request-button">
              New Request
            </Button>
          </Link>
        </div>

        {/* Stat Cards */}
        <div className={styles.statCardsRow}>
          <button
            type="button"
            className={`${styles.statCard} ${statusFilter === 'pending' ? styles.statCardActive : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
            aria-label="Filter by Pending status"
          >
            <div className={styles.statCardTitle}>Pending</div>
            <div className={styles.statCardValue}>{loading ? '—' : pendingCount}</div>
            <div className={styles.statCardSubtitle}>awaiting staff reply</div>
          </button>

          <button
            type="button"
            className={`${styles.statCard} ${statusFilter === 'answered' ? styles.statCardActive : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'answered' ? '' : 'answered')}
            aria-label="Filter by Answered status"
          >
            <div className={styles.statCardTitle}>Answered</div>
            <div className={styles.statCardValue}>{loading ? '—' : answeredCount}</div>
            <div className={styles.statCardSubtitle}>action needed</div>
          </button>

          <button
            type="button"
            className={`${styles.statCard} ${statusFilter === 'acknowledged' ? styles.statCardActive : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'acknowledged' ? '' : 'acknowledged')}
            aria-label="Filter by Acknowledged status"
          >
            <div className={styles.statCardTitle}>Acknowledged</div>
            <div className={styles.statCardValue}>{loading ? '—' : ackedCount}</div>
            <div className={styles.statCardSubtitle}>completed</div>
          </button>
        </div>

        {/* Latest Request Mini Progress Map */}
        {latestRequest && !isFiltered && (
          <div className={styles.miniMapCard} data-testid="latest-request-mini-map">
            <div className={styles.miniMapHeader}>
              Latest: <strong>Request #{latestRequest.request_id}</strong> · {latestRequest.doc_type_name ?? latestRequest.doc_type_id}
            </div>
            <LifecycleStrip
              status={latestRequest.status}
              submittedAt={latestRequest.created_at}
              answeredAt={latestRequest.answer?.answered_at}
              tat={latestRequest.tat}
            />
          </div>
        )}

        {/* Filter Panel */}
        <div className={styles.filterPanel}>
          <h2 className={styles.filterHeading}>Filter requests</h2>
          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <label htmlFor="filter-status" className={styles.filterLabel}>
                Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter requests by status"
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="filter-doctype" className={styles.filterLabel}>
                Document type
              </label>
              <select
                id="filter-doctype"
                value={docTypeFilter}
                onChange={(e) => setDocTypeFilter(e.target.value)}
                aria-label="Filter requests by document type"
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
              >
                <option value="">All types</option>
                {docTypes.map((dt) => (
                  <option key={dt.doc_type_id} value={dt.doc_type_id}>
                    {dt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {isFiltered && (
            <div className={styles.filterChipsRow}>
              <Text size="xs" tone="textMuted">Active filters:</Text>
              {statusFilter && (
                <span className={styles.chip}>
                  Status: <strong>{statusFilter}</strong>
                  <button
                    type="button"
                    className={styles.chipRemove}
                    onClick={() => setStatusFilter('')}
                    aria-label="Remove status filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {docTypeFilter && (
                <span className={styles.chip}>
                  Type: <strong>{activeDocTypeName ?? docTypeFilter}</strong>
                  <button
                    type="button"
                    className={styles.chipRemove}
                    onClick={() => setDocTypeFilter('')}
                    aria-label="Remove document type filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                type="button"
                className={styles.clearFiltersLink}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Alerts & Errors */}
        {error && <Alert tone="danger">{error}</Alert>}

        {/* Loading / Empty / Content */}
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <Spinner label="Loading your requests..." />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <Text as="h3" size="md" weight="medium">
              {isFiltered ? 'No requests match these filters' : "No requests found. Click 'New Request' to get started."}
            </Text>
            <Text size="sm" tone="textMuted" style={{ marginTop: '8px' }}>
              {isFiltered
                ? 'Try resetting the filters to view all your document requests.'
                : 'Submit your bonafide certificates, transcripts, or official letters.'}
            </Text>
            <div style={{ marginTop: '16px' }}>
              {isFiltered ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Link to="/tracks/docdesk/new" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm">
                    New Request
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className={styles.desktopTableContainer}>
              <table aria-label="My Requests Table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Document type</th>
                    <th>Status</th>
                    <th>TAT</th>
                    <th>Submitted</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.request_id} data-testid={`request-row-${r.request_id}`}>
                      <td>
                        <div className={styles.idCell}>
                          <Text size="xs" weight="bold" style={{ fontFamily: 'monospace' }}>
                            {r.request_id}
                          </Text>
                          <button
                            type="button"
                            className={styles.copyButton}
                            onClick={() => handleCopy(r.request_id)}
                            title="Copy Request ID"
                            aria-label={`Copy request ID ${r.request_id}`}
                          >
                            {copiedId === r.request_id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <Text size="sm" weight="medium">
                          {r.doc_type_name ?? r.doc_type_id}
                        </Text>
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        {r.tat ? <TATBadge tat={r.tat} /> : <Text size="xs" tone="textMuted">—</Text>}
                      </td>
                      <td>
                        <Text size="xs" tone="textMuted" title={formatDateTime(r.created_at)}>
                          {formatDate(r.created_at)}
                        </Text>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/tracks/docdesk/requests/${r.request_id}`} style={{ textDecoration: 'none' }}>
                          <Button variant="secondary" size="sm" data-testid={`inspect-${r.request_id}`}>
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* User-facing helper text */}
            <div className={styles.helperText}>
              Select View to open a request's details.
            </div>

            {/* Mobile Card-Based View */}
            <div className={styles.mobileCardsContainer}>
              {items.map((r) => (
                <div key={'m-' + r.request_id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <div>
                      <div className={styles.idCell}>
                        <Text size="xs" weight="bold" style={{ fontFamily: 'monospace' }}>
                          #{r.request_id}
                        </Text>
                        <button
                          type="button"
                          className={styles.copyButton}
                          onClick={() => handleCopy(r.request_id)}
                          title="Copy Request ID"
                          aria-label={`Copy request ID ${r.request_id}`}
                        >
                          {copiedId === r.request_id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <Text size="sm" weight="bold" style={{ display: 'block', marginTop: 4 }}>
                        {r.doc_type_name ?? r.doc_type_id}
                      </Text>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className={styles.mobileCardRow}>
                    <Text size="xs" tone="textMuted">
                      Submitted:
                    </Text>
                    <Text size="xs" title={formatDateTime(r.created_at)}>{formatDate(r.created_at)}</Text>
                  </div>

                  {r.tat && (
                    <div className={styles.mobileCardRow}>
                      <Text size="xs" tone="textMuted">
                        Target Date:
                      </Text>
                      <TATBadge tat={r.tat} />
                    </div>
                  )}

                  <div className={styles.mobileCardActions}>
                    <Link to={`/tracks/docdesk/requests/${r.request_id}`} style={{ textDecoration: 'none' }}>
                      <Button variant="secondary" size="sm" data-testid={`inspect-${r.request_id}`}>
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className={styles.paginationRow}>
              <Text size="xs" tone="textMuted">
                Showing {items.length} loaded records
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
      </div>
    </DocDeskLayout>
  )
}
