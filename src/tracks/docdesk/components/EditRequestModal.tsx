import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, SelectField, Stack, Text, TextArea, TextField } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { editRequest } from '../api/requests'
import { showToast } from './Toast'
import type { DocRequest, DocType } from '../types'

interface EditRequestModalProps {
  request: DocRequest
  onClose: () => void
  onSuccess: () => void
}

export function EditRequestModal({ request, onClose, onSuccess }: EditRequestModalProps) {
  const [docTypeId, setDocTypeId] = useState(request.doc_type_id)
  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [reason, setReason] = useState(request.reason)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = reason !== request.reason || docTypeId !== request.doc_type_id

  useEffect(() => {
    let active = true
    async function loadTypes() {
      try {
        const res = await listDocTypes({ status: 'active', limit: 100 })
        if (active) {
          setDocTypes(res.items)
        }
      } catch {
        // Fallback to current type if types list fails
      }
    }
    loadTypes()
    return () => {
      active = false
    }
  }, [])

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

  function handleCancel() {
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
      await editRequest(request.request_id, {
        doc_type_id: docTypeId !== request.doc_type_id ? docTypeId : undefined,
        reason: reason.trim(),
      })
      showToast('Request updated')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request')
    } finally {
      setSubmitting(false)
    }
  }

  // Build options list ensuring current request doc type is always present
  const optionsMap = new Map<string, string>()
  optionsMap.set(request.doc_type_id, request.doc_type_name ?? request.doc_type_id)
  for (const dt of docTypes) {
    optionsMap.set(dt.doc_type_id, dt.name)
  }
  const typeOptions = Array.from(optionsMap.entries()).map(([value, label]) => ({ value, label }))

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

            {typeOptions.length > 1 ? (
              <SelectField
                label="Document Type"
                value={docTypeId}
                onChange={(e) => setDocTypeId(e.target.value)}
                options={typeOptions}
                data-testid="edit-request-doc-type"
              />
            ) : (
              <TextField
                label="Document Type"
                value={request.doc_type_name ?? request.doc_type_id}
                disabled
              />
            )}

            <TextArea
              label="Reason for Request"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              maxLength={1000}
              hint="5 - 1000 characters describing your request."
              data-testid="edit-request-reason"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} data-testid="save-request-button">
                Edit Request
              </Button>
            </div>
          </Stack>
        </form>
      </Card>
    </div>
  )
}
