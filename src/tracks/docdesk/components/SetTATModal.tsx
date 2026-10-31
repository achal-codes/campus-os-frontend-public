import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Stack, Text, TextField } from '@/ui'
import { setTAT } from '../api/requests'
import type { DocRequest } from '../types'
import { addDaysIST, todayIST } from '../utils/time'

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

  // ESC key dismissal (BUG-06)
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
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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

            <Stack gap={1}>
              <TextField
                label="Expected by (YYYY-MM-DD)"
                type="date"
                value={expectedBy}
                onChange={(e) => setExpectedBy(e.target.value)}
                min={todayIST()}
                required
                data-testid="tat-date-input"
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
              label="TAT note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verification in progress"
              data-testid="tat-note-input"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
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
