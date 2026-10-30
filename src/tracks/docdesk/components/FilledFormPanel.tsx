import { useRef, useState, type ChangeEvent } from 'react'
import { Alert, Button, Stack, Text } from '@/ui'
import { deleteFilledForm, downloadFilledForm, uploadFilledForm } from '../api/requests'
import { can } from '../permissions/permissions'
import type { DocRequest } from '../types'
import { FILLED_FORM_ACCEPT, formatFileSize, validateFilledForm } from '../utils/files'
import styles from './FilledFormPanel.module.css'

interface FilledFormPanelProps {
  request: DocRequest
  isOwner: boolean
  isStudentAffairs: boolean
  role: 'admin' | 'student' | 'faculty' | 'office_staff'
  onUpdated: () => void
}

export function FilledFormPanel({
  request,
  isOwner,
  isStudentAffairs,
  role,
  onUpdated,
}: FilledFormPanelProps) {
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const permCtx = {
    role,
    isStudentAffairs,
    requestStatus: request.status,
    isOwner,
    hasDocument: Boolean(request.document),
    hasFilledForm: Boolean(request.filled_form),
  }

  const canUpload = can('filledForm.upload', permCtx)
  const canDownload = can('filledForm.download', permCtx)
  const canDelete = can('filledForm.delete', permCtx)

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateFilledForm(file)
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid file')
      return
    }

    setError(null)
    setUploading(true)
    try {
      await uploadFilledForm(request.request_id, file)
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload filled form')
    } finally {
      setUploading(false)
      // reset file input
      e.target.value = ''
    }
  }

  async function handleDownload() {
    setError(null)
    setDownloading(true)
    try {
      await downloadFilledForm(request.request_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this submitted filled form?')) return

    setError(null)
    setDeleting(true)
    try {
      await deleteFilledForm(request.request_id)
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={styles.container} data-testid="filled-form-panel">
      <Stack gap={3}>
        <Stack gap={1}>
          <Text as="h3" size="sm" weight="bold" tone="accent" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OPTIONAL: FILLED-IN FORM (ONLY IF STAFF ATTACHED A DOCUMENT)
          </Text>
          <Text size="xs" tone="textMuted">
            Choose completed PDF / DOCX / JPEG / PNG (max 10 MB). If already uploaded: Download or Remove (before acknowledgement).
          </Text>
        </Stack>

        {error && <Alert tone="danger">{error}</Alert>}

        {request.filled_form ? (
          <div className={styles.fileInfo}>
            <Stack gap={1}>
              <Text size="sm" weight="bold">
                📄 {request.filled_form.filename}
              </Text>
              <Text size="xs" tone="textMuted">
                {formatFileSize(request.filled_form.size_bytes)} ({request.filled_form.content_type})
              </Text>
            </Stack>

            <div className={styles.actions}>
              {canDownload && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDownload}
                  loading={downloading}
                  data-testid="download-filled-form"
                >
                  Download
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleting}
                  data-testid="delete-filled-form"
                >
                  Remove
                </Button>
              )}
              {canUpload && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={FILLED_FORM_ACCEPT}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    data-testid="replace-filled-form-input"
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <Stack gap={2}>
            {canUpload && (
              <div>
                <Button
                  size="sm"
                  variant="primary"
                  loading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="upload-filled-form-button"
                >
                  Upload Form
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILLED_FORM_ACCEPT}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  data-testid="upload-filled-form-input"
                />
              </div>
            )}
          </Stack>
        )}

        <Text size="xs" tone="textMuted" style={{ fontStyle: 'italic', marginTop: 'var(--space-1)' }}>
          After upload: you can download or remove your filled form before acknowledgement. After acknowledgement: view/download only; no further upload, removal or acknowledgement.
        </Text>
      </Stack>
    </div>
  )
}
