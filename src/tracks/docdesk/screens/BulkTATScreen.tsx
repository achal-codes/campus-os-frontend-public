import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Alert, Button, Spinner, Stack, Text, TextField } from '@/ui'
import { listRequests, setBulkTAT } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import glass from '../theme/glass.module.css'
import type { DocRequest } from '../types'
import { addDaysIST, formatDate, todayIST } from '../utils/time'
import styles from './BulkTATScreen.module.css'

interface LocationState {
  selectedIds?: string[]
}

export function BulkTATScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | undefined

  const [pendingRequests, setPendingRequests] = useState<DocRequest[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(state?.selectedIds ?? [])
  )
  const [expectedBy, setExpectedBy] = useState(todayIST())
  const [note, setNote] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [failedIds, setFailedIds] = useState<string[]>([])

  useEffect(() => {
    let active = true
    async function fetchPending() {
      setLoading(true)
      try {
        const res = await listRequests({ status: 'pending', limit: 100 })
        if (active) {
          setPendingRequests(res.items)
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load pending requests')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchPending()
    return () => {
      active = false
    }
  }, [])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        if (next.size >= 100) {
          setError('Maximum of 100 requests can be selected for a single batch.')
          return prev
        }
        next.add(id)
      }
      return next
    })
  }

  function handleSelectAll() {
    if (selectedIds.size === pendingRequests.length) {
      setSelectedIds(new Set())
    } else {
      const capped = pendingRequests.slice(0, 100).map((r) => r.request_id)
      setSelectedIds(new Set(capped))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (selectedIds.size === 0) {
      setError('Please select at least one pending request.')
      return
    }

    if (selectedIds.size > 100) {
      setError('Cannot assign TAT for more than 100 requests in a single batch.')
      return
    }

    if (!expectedBy || expectedBy < todayIST()) {
      setError('The date cannot be before today.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const count = selectedIds.size
      await setBulkTAT({
        request_ids: Array.from(selectedIds),
        expected_by: expectedBy,
        note: note.trim() || undefined,
      })
      setSuccess(`${count} requests updated`)
      setTimeout(() => {
        navigate('/tracks/docdesk/staff')
      }, 1500)
    } catch (err: unknown) {
      let failed: string[] = []
      if (err && typeof err === 'object') {
        const anyErr = err as { code?: string; details?: { request_ids?: string[] } }
        if (Array.isArray(anyErr.details?.request_ids)) {
          failed = anyErr.details.request_ids
        }
      }
      setFailedIds(failed)
      if (failed.length > 0) {
        setError(`No requests were updated. The following ${failed.length} request(s) are no longer pending or not found: ${failed.join(', ')}.`)
      } else {
        setError(
          err instanceof Error
            ? `No requests were updated: ${err.message}`
            : 'No requests were updated. If any selected request is invalid or no longer pending, none are updated.'
        )
      }
      setSubmitting(false)
    }
  }

  const selectedRequests = pendingRequests.filter((r) => selectedIds.has(r.request_id))

  return (
    <DocDeskLayout activeItem="queue">
      <div className={styles.container} data-testid="docdesk-bulk-tat-screen">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', marginBottom: 6 }}>
            <Link to="/tracks/docdesk/staff" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
              Requests
            </Link>
            <span style={{ color: 'var(--color-text-muted)' }}>/</span>
            <span style={{ color: 'var(--color-text-muted)' }}>Set turnaround time</span>
          </div>

          <div className={styles.header}>
            <Stack gap={1}>
              <Text as="h1" size="2xl" weight="bold">
                Set turnaround time for selected requests
              </Text>
              <Text tone="textMuted">
                Select pending requests, then apply one expected date and optional note.
              </Text>
            </Stack>
          </div>
        </div>

        {error && (
          <Alert tone="danger">
            <Stack gap={2}>
              <div>{error}</div>
              {failedIds.length > 0 && (
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev)
                        for (const fid of failedIds) next.delete(fid)
                        return next
                      })
                      setFailedIds([])
                      setError(null)
                    }}
                  >
                    Unselect Failed Requests ({failedIds.length})
                  </Button>
                </div>
              )}
            </Stack>
          </Alert>
        )}
        {success && <Alert tone="success">{success}</Alert>}

        {loading ? (
          <div className={`${glass.panel} ${glass.tintBlue}`} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Spinner label="Loading pending requests..." />
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Panel A: PENDING REQUESTS */}
            <div className={`${glass.panel} ${glass.tintBlue}`}>
              <div className={styles.panelHeader}>
                <Stack gap={1}>
                  <Text as="h2" size="sm" weight="bold" tone="accent" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PENDING REQUESTS
                  </Text>
                  <Text size="xs" tone="textMuted">
                    {selectedIds.size} of 100 selected
                  </Text>
                </Stack>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={pendingRequests.length === 0}
                  data-testid="bulk-select-all-button"
                >
                  {selectedIds.size === pendingRequests.length && pendingRequests.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>

              {pendingRequests.length === 0 ? (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                  <Text size="sm" tone="textMuted" style={{ marginBottom: 'var(--space-3)' }}>
                    No pending document requests currently requiring TAT assignment.
                  </Text>
                  <Link to="/tracks/docdesk/staff" style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" size="sm">
                      Back to Requests
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table} aria-label="Pending Requests for Bulk TAT">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.size > 0 && selectedIds.size === pendingRequests.length}
                            onChange={handleSelectAll}
                            aria-label="Toggle all pending requests"
                          />
                        </th>
                        <th>Request ID</th>
                        <th>Requester</th>
                        <th>Document type</th>
                        <th>Status</th>
                        <th>Existing expected date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((r) => {
                        const isSelected = selectedIds.has(r.request_id)
                        return (
                          <tr
                            key={r.request_id}
                            className={isSelected ? styles.selectedRow : undefined}
                            onClick={() => toggleSelect(r.request_id)}
                            style={{ cursor: 'pointer' }}
                            data-testid={`bulk-row-${r.request_id}`}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(r.request_id)}
                                aria-label={`Select ${r.request_id}`}
                              />
                            </td>
                            <td>
                              <Text size="xs" weight="bold">{r.request_id}</Text>
                            </td>
                            <td>
                              <Stack gap={1}>
                                <Text size="sm" weight="medium">
                                  {r.requested_by_name ?? r.requested_by}
                                </Text>
                                <Text size="xs" tone="textMuted">
                                  {r.requested_by_role ?? 'student'}
                                </Text>
                              </Stack>
                            </td>
                            <td>
                              <Text size="sm">{r.doc_type_name ?? r.doc_type_id}</Text>
                            </td>
                            <td>
                              <StatusBadge status={r.status} />
                            </td>
                            <td>
                              {r.tat?.expected_by ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Text size="xs">{formatDate(r.tat.expected_by)}</Text>
                                  <TATBadge tat={r.tat} />
                                </div>
                              ) : (
                                <Text size="xs" tone="textMuted">—</Text>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Panel B: APPLY TURNAROUND TIME */}
            <div className={`${glass.panel} ${glass.tintBlue}`}>
              <form onSubmit={handleSubmit} noValidate>
                <Stack gap={4}>
                  <div className={styles.panelHeader}>
                    <Text as="h2" size="sm" weight="bold" tone="accent" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      APPLY TURNAROUND TIME
                    </Text>
                    <span className={glass.badge} data-testid="bulk-selected-count">
                      {selectedIds.size} Selected
                    </span>
                  </div>

                  <Stack gap={1}>
                    <TextField
                      label="Expected by * (YYYY-MM-DD)"
                      type="date"
                      value={expectedBy}
                      onChange={(e) => setExpectedBy(e.target.value)}
                      min={todayIST()}
                      required
                      data-testid="bulk-tat-date-input"
                    />

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
                        Quick select:
                      </span>
                      <button
                        type="button"
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          borderRadius: 6,
                          border: '1px solid rgba(170, 59, 255, 0.3)',
                          background: 'rgba(170, 59, 255, 0.08)',
                          cursor: 'pointer',
                          color: 'var(--color-text)',
                        }}
                        onClick={() => setExpectedBy(addDaysIST(3))}
                      >
                        +3 days
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          borderRadius: 6,
                          border: '1px solid rgba(170, 59, 255, 0.3)',
                          background: 'rgba(170, 59, 255, 0.08)',
                          cursor: 'pointer',
                          color: 'var(--color-text)',
                        }}
                        onClick={() => setExpectedBy(addDaysIST(7))}
                      >
                        +1 week
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          borderRadius: 6,
                          border: '1px solid rgba(170, 59, 255, 0.3)',
                          background: 'rgba(170, 59, 255, 0.08)',
                          cursor: 'pointer',
                          color: 'var(--color-text)',
                        }}
                        onClick={() => setExpectedBy(addDaysIST(14))}
                      >
                        +2 weeks
                      </button>
                    </div>
                  </Stack>

                  <TextField
                    label="Note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Bulk semester audit cycle processing"
                    hint="Optional message recorded against all selected records."
                    data-testid="bulk-tat-note-input"
                  />

                  {/* Wireframe Rules Box */}
                  <div className={styles.rulesBox}>
                    <p style={{ margin: 0, fontWeight: 600 }}>Rules for Bulk Turnaround Time:</p>
                    <p style={{ margin: 0 }}>
                      Select 1-100 requests; all must still be pending. If any selected request is invalid or no longer pending, none are updated. Review the failed request IDs and retry.
                    </p>
                    <p style={{ margin: 0 }}>
                      Repeated IDs are ignored. The date cannot be before today.
                    </p>
                  </div>

                  {selectedRequests.length > 0 && (
                    <Stack gap={2}>
                      <Text size="xs" weight="bold" tone="textMuted">
                        Affected Requests Preview ({selectedRequests.length})
                      </Text>
                      <div className={styles.previewList}>
                        {selectedRequests.map((r) => (
                          <div key={r.request_id} className={styles.previewItem}>
                            <span><strong>{r.request_id}</strong> · {r.doc_type_name ?? r.doc_type_id}</span>
                            <span style={{ color: 'var(--color-text-muted)' }}>{r.requested_by_name ?? r.requested_by}</span>
                          </div>
                        ))}
                      </div>
                    </Stack>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => navigate('/tracks/docdesk/staff')}
                      disabled={submitting}
                      data-testid="bulk-tat-cancel-button"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      loading={submitting}
                      disabled={selectedIds.size === 0}
                      data-testid="apply-bulk-tat-button"
                    >
                      Set TAT for Selected
                    </Button>
                  </div>
                </Stack>
              </form>
            </div>
          </div>
        )}
      </div>
    </DocDeskLayout>
  )
}
