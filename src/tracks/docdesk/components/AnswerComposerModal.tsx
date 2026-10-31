import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { Alert, Button, Card, Stack, Text, TextField } from '@/ui'
import { createAnswer, editAnswer } from '../api/requests'
import type { DocRequest } from '../types'
import { ANSWER_DOC_ACCEPT, formatFileSize, validateAnswerDocument } from '../utils/files'

interface AnswerComposerModalProps {
  request: DocRequest
  isEditing?: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AnswerComposerModal({
  request,
  isEditing = false,
  onClose,
  onSuccess,
}: AnswerComposerModalProps) {
  const [message, setMessage] = useState(request.answer?.message ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [removeDocument, setRemoveDocument] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const isDirty = message !== (request.answer?.message ?? '') || file !== null || removeDocument

  // Prevent accidental unload with unsaved changes
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

  // ESC key dismissal (BUG-06)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) {
        if (isDirty) {
          if (window.confirm('You have unsaved changes. Discard?')) {
            onClose()
          }
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDirty, submitting, onClose])

  function handleCancel() {
    if (isDirty && !window.confirm('You have unsaved changes. Discard?')) {
      return
    }
    onClose()
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    const validation = validateAnswerDocument(dropped)
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid file')
      setFile(null)
      return
    }
    setError(null)
    setFile(dropped)
    setRemoveDocument(false)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) {
      setFile(null)
      return
    }

    const validation = validateAnswerDocument(selected)
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid file')
      setFile(null)
      e.target.value = ''
      return
    }

    setError(null)
    setFile(selected)
    setRemoveDocument(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (message.trim().length < 1 || message.trim().length > 2000) {
      setError('Official answer message must be between 1 and 2000 characters.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (isEditing) {
        await editAnswer(request.request_id, {
          message: message.trim(),
          document: file ?? undefined,
          remove_document: removeDocument,
        })
      } else {
        await createAnswer(request.request_id, message.trim(), file ?? undefined)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit official answer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="answer-modal-title"
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
      <Card style={{ maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap={4}>
            <Text id="answer-modal-title" as="h2" size="lg" weight="bold">
              {isEditing ? 'Edit Official Response' : 'Answer Document Request'}
            </Text>

            {error && <Alert tone="danger">{error}</Alert>}

            <TextField
              label="Answer message *"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              hint="Initial answer requires a 1-2000 character message."
              data-testid="answer-message-input"
            />

            <Stack gap={2}>
              <Text as="label" size="sm" weight="medium">
                Document from staff (optional)
              </Text>
              <Text size="xs" tone="textMuted">
                Attach PDF or Word (.docx), max 10 MB.
              </Text>

              {request.document && !removeDocument && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'var(--color-surface-muted)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Text size="xs">
                    Current attachment: <strong>{request.document.filename}</strong> (
                    {formatFileSize(request.document.size_bytes)})
                  </Text>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setRemoveDocument(true)}
                      type="button"
                    >
                      Remove Document
                    </Button>
                  )}
                </div>
              )}

              {removeDocument && (
                <Alert tone={request.filled_form ? 'danger' : 'info'}>
                  {request.filled_form ? (
                    <span>
                      <strong>Warning:</strong> Removing this staff document will also permanently delete the
                      requester&apos;s uploaded filled form ({request.filled_form.filename}).
                    </span>
                  ) : (
                    <span>Document will be removed when saved.</span>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setRemoveDocument(false)}
                    type="button"
                    style={{ marginLeft: 'var(--space-2)' }}
                  >
                    Undo
                  </Button>
                </Alert>
              )}

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                  border: isDragging ? '2px dashed var(--color-primary)' : '1px dashed var(--color-border)',
                  backgroundColor: isDragging ? 'rgba(170, 59, 255, 0.08)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3)',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="file"
                  accept={ANSWER_DOC_ACCEPT}
                  onChange={handleFileChange}
                  disabled={submitting}
                  data-testid="answer-document-file-input"
                  style={{
                    fontSize: 'var(--text-sm)',
                    padding: 'var(--space-1)',
                    cursor: 'pointer',
                  }}
                />
                <Text size="xs" tone="textMuted" style={{ marginTop: 4 }}>
                  Drag and drop document file here (PDF or DOCX, max 10 MB)
                </Text>
              </div>
              {file && (
                <Text size="xs" tone="primary">
                  Selected new file: {file.name} ({formatFileSize(file.size)})
                </Text>
              )}
            </Stack>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} data-testid="submit-answer-button">
                {isEditing ? 'Save Changes' : 'Send Answer'}
              </Button>
            </div>
          </Stack>
        </form>
      </Card>
    </div>
  )
}
