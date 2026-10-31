import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ApiError } from '@/core/api'
import { Alert, Button, Stack, Text } from '@/ui'
import { deleteFilledForm, downloadFilledForm, uploadFilledForm } from '../api/requests'
import { ConfirmModal } from './ConfirmModal'
import { showToast } from './Toast'
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  const [isDragging, setIsDragging] = useState(false)

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const validation = validateFilledForm(file)
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid file')
      return
    }
    setError(null)
    setSelectedFile(file)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (!canUpload) return
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const validation = validateFilledForm(file)
      if (!validation.valid) {
        setError(validation.error ?? 'Invalid file')
        return
      }
      setError(null)
      setSelectedFile(file)
    }
  }

  async function handleUpload() {
    if (!selectedFile) return
    setError(null)
    setUploading(true)
    try {
      await uploadFilledForm(request.request_id, selectedFile)
      setSelectedFile(null)
      showToast('Filled form uploaded')
      onUpdated()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'NOT_ANSWERED') {
          setError('Request is still pending. You can only upload a filled form once answered.')
        } else if (err.code === 'NO_DOCUMENT') {
          setError('The answer does not contain an official document to fill.')
        } else if (err.code === 'ALREADY_ACKNOWLEDGED') {
          setError('The request is already closed and cannot be modified.')
        } else {
          setError(err.message || 'Failed to upload filled form')
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to upload filled form')
      }
    } finally {
      setUploading(false)
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

  async function handleConfirmDelete() {
    setError(null)
    setDeleting(true)
    try {
      await deleteFilledForm(request.request_id)
      setShowDeleteModal(false)
      showToast('Document removed')
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
          <Text as="h3" size="sm" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)' }}>
            Filled-in form
          </Text>
          <Text size="xs" tone="textMuted">
            Upload your completed PDF, DOCX, JPEG, or PNG (max 10 MB).
          </Text>
        </Stack>

        {error && <Alert tone="danger">{error}</Alert>}

        {/* Existing uploaded form */}
        {request.filled_form ? (
          <div className={styles.fileInfo}>
            <Stack gap={1}>
              <Text size="sm" weight="bold">
                {request.filled_form.filename}
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
                  Download Filled Form
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  loading={deleting}
                  data-testid="delete-filled-form"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ) : (
          canUpload && (
            <Stack gap={2}>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="choose-file-button"
                  >
                    Choose file
                  </Button>

                  {selectedFile ? (
                    <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong>{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      No file chosen
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILLED_FORM_ACCEPT}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  data-testid="upload-filled-form-input"
                />
              </div>

              {selectedFile && (
                <div>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={uploading}
                    onClick={handleUpload}
                    data-testid="upload-filled-form-button"
                  >
                    Upload Form
                  </Button>
                </div>
              )}
            </Stack>
          )
        )}

        <Text size="xs" tone="textMuted" style={{ fontStyle: 'italic', marginTop: '4px' }}>
          You can download or remove your filled form before acknowledging receipt.
        </Text>
      </Stack>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Remove filled form"
        message="Remove your filled form? This cannot be undone."
        confirmLabel="Remove"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
