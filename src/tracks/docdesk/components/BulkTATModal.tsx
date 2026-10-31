import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Stack, Text, TextField } from '@/ui'
import { setBulkTAT } from '../api/requests'
import { todayIST } from '../utils/time'
import { DateField } from './DateField'

interface BulkTATModalProps {
  requestIds: string[]
  onClose: () => void
  onSuccess: () => void
}

export function BulkTATModal({ requestIds, onClose, onSuccess }: BulkTATModalProps) {
  const [expectedBy, setExpectedBy] = useState(todayIST())
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ESC key dismissal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [submitting, onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (requestIds.length === 0) {
      setError('No requests selected.')
      return
    }

    if (requestIds.length > 100) {
      setError('Cannot set TAT for more than 100 requests at a time.')
      return
    }

    if (!expectedBy) {
      setError('Enter a valid date as DD/MM/YYYY.')
      return
    }

    if (expectedBy < todayIST()) {
      setError('Expected date must be today or a future date in IST.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await setBulkTAT({
        request_ids: requestIds,
        expected_by: expectedBy,
        note: note.trim() || undefined,
      })
      onSuccess()
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Bulk TAT assignment failed'
      if (err && typeof err === 'object') {
        const anyErr = err as { details?: { request_ids?: string[] } }
        if (Array.isArray(anyErr.details?.request_ids)) {
          msg = `Failed: requests no longer pending: ${anyErr.details.request_ids.join(', ')}`
        }
      }
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-tat-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 'var(--space-4)',
      }}
    >
      <Card style={{ maxWidth: 500, width: '100%' }}>
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap={4}>
            <Text id="bulk-tat-modal-title" as="h2" size="lg" weight="bold">
              Bulk Set Turnaround Time
            </Text>

            <Text size="sm" tone="textMuted">
              Assigning completion target for <strong>{requestIds.length}</strong> selected pending request(s).
            </Text>

            {error && <Alert tone="danger">{error}</Alert>}

            <DateField
              label="Expected by (DD/MM/YYYY)"
              value={expectedBy}
              onChange={(iso) => {
                setExpectedBy(iso)
                if (error) setError(null)
              }}
              min={todayIST()}
              showChips
              required
              data-testid="bulk-tat-date-input"
            />

            <TextField
              label="Operational Note (Optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              hint="Optional internal reason or note for all selected records."
              data-testid="bulk-tat-note-input"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} data-testid="submit-bulk-tat-button">
                Apply to {requestIds.length} Records
              </Button>
            </div>
          </Stack>
        </form>
      </Card>
    </div>
  )
}
