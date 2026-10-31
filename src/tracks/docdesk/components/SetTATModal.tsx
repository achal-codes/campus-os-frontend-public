import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Stack, Text, TextField } from '@/ui'
import { setTAT } from '../api/requests'
import { showToast } from './Toast'
import type { DocRequest } from '../types'
import { todayIST } from '../utils/time'
import { DateField } from './DateField'

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

    if (!expectedBy) {
      setError('Enter a valid date as DD/MM/YYYY.')
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
      showToast('Turnaround time saved')
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
              Set Turnaround Time
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
              data-testid="tat-date-input"
            />

            <TextField
              label="TAT note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Awaiting signature from registrar"
              maxLength={500}
              data-testid="tat-note-input"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={onClose} disabled={submitting} data-testid="cancel-tat-button">
                Cancel
              </Button>
              <Button type="submit" loading={submitting} data-testid="save-tat-button">
                Save TAT
              </Button>
            </div>
          </Stack>
        </form>
      </Card>
    </div>
  )
}
