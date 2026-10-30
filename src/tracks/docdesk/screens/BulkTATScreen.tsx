import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Alert, Button, Spinner, Stack, Text, TextField } from '@/ui'
import { listRequests, setBulkTAT } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { TATBadge } from '../components/TATBadge'
import glass from '../theme/glass.module.css'
import type { DocRequest } from '../types'
import { formatDate, todayIST } from '../utils/time'
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

  useEffect(() => {
    let active = true
    async function fetchPending() {
      setLoading(true)
      try {
        const res = await listRequests({ status: 'pending', limit: 100 })
        if (active) {
          setPendingRequests(res.items)
          // If no initial selection was passed, leave selection empty or keep existing
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
      else next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    if (selectedIds.size === pendingRequests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingRequests.map((r) => r.request_id)))
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
      setError('Expected date must be today or a future date in IST.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await setBulkTAT({
        request_ids: Array.from(selectedIds),
        expected_by: expectedBy,
        note: note.trim() || undefined,
      })
      setSuccess(`Successfully updated Turnaround Time for ${selectedIds.size} request(s).`)
      setTimeout(() => {
        navigate('/tracks/docdesk/staff')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk TAT assignment failed')
      setSubmitting(false)
    }
  }

  const selectedRequests = pendingRequests.filter((r) => selectedIds.has(r.request_id))

  return (
    <DocDeskLayout activeItem="queue">
      <div className={styles.container} data-testid="docdesk-bulk-tat-screen">
        <div>
          <Link to="/tracks/docdesk/staff" className={styles.backLink}>
            ← Back to Operations Queue
          </Link>
          <div className={styles.header}>
            <Stack gap={1}>
              <Text as="h1" size="2xl" weight="bold">
                Bulk Turnaround Time Assignment
              </Text>
              <Text tone="textMuted">
                Set target resolution dates and operational notices for multiple pending requests simultaneously.
              </Text>
            </Stack>
          </div>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        {loading ? (
          <div className={`${glass.panel} ${glass.tintBlue}`} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Spinner label="Loading pending requests..." />
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Left Panel: Pending Requests Table */}
            <div className={`${glass.panel} ${glass.tintBlue}`}>
              <div className={styles.panelHeader}>
                <Stack gap={1}>
                  <Text as="h2" size="md" weight="bold">
                    Select Pending Requests
                  </Text>
                  <Text size="xs" tone="textMuted">
                    {selectedIds.size} of {pendingRequests.length} pending requests selected
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
                  <Text size="sm" tone="textMuted">
                    No pending document requests currently requiring TAT assignment.
                  </Text>
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
                        <th>Document Type</th>
                        <th>Submitted</th>
                        <th>Current TAT</th>
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
                              <Text size="xs" tone="textMuted">{formatDate(r.created_at)}</Text>
                            </td>
                            <td>
                              <TATBadge tat={r.tat} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Panel: Apply TAT Form */}
            <div className={`${glass.panel} ${glass.tintBlue}`}>
              <form onSubmit={handleSubmit} noValidate>
                <Stack gap={4}>
                  <div className={styles.panelHeader}>
                    <Text as="h2" size="md" weight="bold">
                      Set Completion Target
                    </Text>
                    <span className={glass.badge} data-testid="bulk-selected-count">
                      {selectedIds.size} Selected
                    </span>
                  </div>

                  <TextField
                    label="Expected Completion Date (IST)"
                    type="date"
                    value={expectedBy}
                    onChange={(e) => setExpectedBy(e.target.value)}
                    min={todayIST()}
                    required
                    data-testid="bulk-tat-date-input"
                  />

                  <TextField
                    label="Operational Note (Optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Bulk semester audit cycle processing"
                    hint="Optional message recorded against all selected records."
                    data-testid="bulk-tat-note-input"
                  />

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
                      Apply Bulk TAT ({selectedIds.size})
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
