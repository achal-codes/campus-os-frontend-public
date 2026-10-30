import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Spinner, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { listRequests } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import glassStyles from '../theme/glass.module.css'
import type { DocRequest, DocType, RequestStatus } from '../types'
import { formatDate } from '../utils/time'
import styles from './MyRequestsScreen.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'answered', label: 'Answered' },
  { value: 'acknowledged', label: 'Acknowledged' },
]

export function MyRequestsScreen() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [docTypeFilter, setDocTypeFilter] = useState<string>('')
  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [items, setItems] = useState<DocRequest[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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
              New request
            </Button>
          </Link>
        </div>

        {/* Filter Glass Panel */}
        <div className={`${glassStyles.glassPanel} ${styles.filterPanel}`}>
          <h2 className={styles.filterHeading}>Filter requests</h2>
          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <label htmlFor="filter-status" className={styles.filterLabel}>
                Status
              </label>
              <select
                id="filter-status"
                className={glassStyles.glassSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter requests by status"
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
                className={glassStyles.glassSelect}
                value={docTypeFilter}
                onChange={(e) => setDocTypeFilter(e.target.value)}
                aria-label="Filter requests by document type"
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
                    ×
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
                    ×
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
          <div className={glassStyles.glassPanel} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Spinner label="Loading your requests..." />
          </div>
        ) : items.length === 0 ? (
          <div className={glassStyles.glassPanel} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Text as="h3" size="md" weight="medium">
              {isFiltered ? 'No requests match these filters' : "No requests found. Click 'New request' to get started."}
            </Text>
            <Text size="sm" tone="textMuted" style={{ marginTop: 'var(--space-2)' }}>
              {isFiltered
                ? 'Try resetting the filters to view all your document requests.'
                : 'Submit your bonafide certificates, transcripts, or official letters.'}
            </Text>
            <div style={{ marginTop: 'var(--space-4)' }}>
              {isFiltered ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Link to="/tracks/docdesk/new" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm">
                    New request
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className={`${glassStyles.glassTableContainer} ${styles.desktopTableContainer}`}>
              <table className={glassStyles.glassTable} aria-label="My Requests Table">
                <thead>
                  <tr>
                    <th>ID</th>
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
                            {copiedId === r.request_id ? '✓' : '📋'}
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
                        <Text size="xs" tone="textMuted">
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
                <div key={'m-' + r.request_id} className={`${glassStyles.glassCard} ${styles.mobileCard}`}>
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
                          {copiedId === r.request_id ? '✓' : '📋'}
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
                    <Text size="xs">{formatDate(r.created_at)}</Text>
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
