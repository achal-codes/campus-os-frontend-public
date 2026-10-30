import { useState, type FormEvent } from 'react'
import { Alert, Button, Card, Stack, Text, TextField } from '@/ui'
import { setTAT } from '../api/requests'
import type { DocRequest } from '../types'
import { todayIST } from '../utils/time'

interface SetTATModalProps {
  request: DocRequest
  onClose: () => void
  onSuccess: () => void
}

export function SetTATModal({ request, onClose, onSuccess }: SetTATModalProps) {
  const [expectedBy, setExpectedBy] = useState(request.tat?.expected_by ?? todayIST())
  const [note, setNote] = useState(request.tat?.note ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!expectedBy) {
      setError('Please select an expected completion date.')
      return
    }

    if (expectedBy < todayIST()) {
      setError('Expected date cannot be earlier than today in IST.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await setTAT(request.request_id, {
        expected_by: expectedBy,
        note: note.trim() || undefined,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set turnaround time')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tat-modal-title"
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
      <Card style={{ maxWidth: 480, width: '100%' }}>
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap={4}>
            <Text id="tat-modal-title" as="h2" size="lg" weight="bold">
              Set Turnaround Time (TAT)
            </Text>

            {error && <Alert tone="danger">{error}</Alert>}

            <TextField
              label="Expected Completion Date (IST)"
              type="date"
              value={expectedBy}
              onChange={(e) => setExpectedBy(e.target.value)}
              min={todayIST()}
              required
              data-testid="tat-date-input"
            />

            <TextField
              label="Operational Note (Optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              hint="Optional message for internal queue tracking or requester notice."
              data-testid="tat-note-input"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} data-testid="save-tat-button">
                Set TAT
              </Button>
            </div>
          </Stack>
        </form>
      </Card>
    </div>
  )
}
