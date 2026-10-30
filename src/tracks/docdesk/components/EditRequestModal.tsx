import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Stack, Text, TextField } from '@/ui'
import { editRequest } from '../api/requests'
import type { DocRequest } from '../types'

interface EditRequestModalProps {
  request: DocRequest
  onClose: () => void
  onSuccess: () => void
}

export function EditRequestModal({ request, onClose, onSuccess }: EditRequestModalProps) {
  const [reason, setReason] = useState(request.reason)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = reason !== request.reason

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && !submitting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, submitting])

  function handleCancel() {
    if (isDirty && !window.confirm('You have unsaved changes. Discard?')) {
      return
    }
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (reason.trim().length < 5 || reason.trim().length > 1000) {
      setError('Reason must be between 5 and 1000 characters.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await editRequest(request.request_id, { reason: reason.trim() })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
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
      <Card style={{ maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap={4}>
            <Text id="edit-modal-title" as="h2" size="lg" weight="bold">
              Edit Pending Request
            </Text>

            {error && <Alert tone="danger">{error}</Alert>}

            <TextField
              label="Document Type"
              value={request.doc_type_name ?? request.doc_type_id}
              disabled
              hint="Document type cannot be modified directly after submission."
            />

            <TextField
              label="Reason for Request"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              hint="5 - 1000 characters describing your request."
              data-testid="edit-request-reason"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} data-testid="save-request-button">
                Save Changes
              </Button>
            </div>
          </Stack>
        </form>
      </Card>
    </div>
  )
}
