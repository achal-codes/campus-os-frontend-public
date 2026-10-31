import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ApiError } from '@/core/api'
import { Alert, Button, Spinner, TextArea, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { createRequest } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { showToast } from '../components/Toast'
import type { DocType } from '../types'
import styles from './RequestFormScreen.module.css'

export function RequestFormScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedDocTypeId = searchParams.get('doc_type_id') ?? ''

  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [loadingDocTypes, setLoadingDocTypes] = useState(true)
  const [selectedDocTypeId, setSelectedDocTypeId] = useState(preselectedDocTypeId)
  const [reason, setReason] = useState('')
  const [touchedReason, setTouchedReason] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = reason.length > 0

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

  useEffect(() => {
    let active = true
    async function loadCatalogue() {
      try {
        const res = await listDocTypes({ status: 'active', limit: 100 })
        if (active) {
          const activeOnly = res.items.filter((d) => d.status === 'active')
          setDocTypes(activeOnly)
          // Do not auto-select activeOnly[0]; require explicit user choice
          if (preselectedDocTypeId && activeOnly.some((d) => d.doc_type_id === preselectedDocTypeId)) {
            setSelectedDocTypeId(preselectedDocTypeId)
          } else {
            setSelectedDocTypeId('')
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load document types')
        }
      } finally {
        if (active) setLoadingDocTypes(false)
      }
    }
    loadCatalogue()
    return () => {
      active = false
    }
  }, [preselectedDocTypeId])

  const selectedDocType = docTypes.find((d) => d.doc_type_id === selectedDocTypeId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!selectedDocTypeId) {
      setError('Please select a document type.')
      return
    }

    const trimmedReason = reason.trim()
    if (trimmedReason.length < 5 || trimmedReason.length > 1000) {
      setError('Please provide a reason between 5 and 1000 characters.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const created = await createRequest({
        doc_type_id: selectedDocTypeId,
        reason: trimmedReason,
      })
      showToast('Request submitted')
      navigate(`/tracks/docdesk/requests/${created.request_id}`)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'DOC_TYPE_ARCHIVED' || err.status === 409) {
          setError('That document type is no longer available. Please choose another.')
        } else {
          setError(err.message || 'Failed to submit document request')
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to submit document request')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isSubmitDisabled = submitting || !selectedDocTypeId || reason.trim().length < 5 || reason.length > 1000

  return (
    <DocDeskLayout activeItem="new">
      <div className={styles.pageContainer} data-testid="docdesk-request-form-screen">
        <div className={styles.formCard}>
          {/* Header */}
          <div className={styles.headerText}>
            <h1 className={styles.title}>Request a document</h1>
            <p className={styles.subtitle}>Submit a request for bonafide certificates, transcripts, or official letters.</p>
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          {loadingDocTypes ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Spinner label="Loading document types..." />
            </div>
          ) : docTypes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Text size="md" weight="medium">
                No active document types available
              </Text>
              <Text size="sm" tone="textMuted" style={{ marginTop: '8px' }}>
                Please contact the Student Affairs department to add document types before requesting.
              </Text>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              {/* Document Type Selection */}
              <div className={styles.fieldGroup}>
                <label htmlFor="doctype-select" className={styles.fieldLabel}>
                  <span>
                    Document type<span className={styles.requiredMark}>*</span>
                  </span>
                </label>
                <select
                  id="doctype-select"
                  className={styles.select}
                  value={selectedDocTypeId}
                  onChange={(e) => setSelectedDocTypeId(e.target.value)}
                  required
                  data-testid="doctype-select"
                >
                  <option value="">Select a document type…</option>
                  {docTypes.map((dt) => (
                    <option key={dt.doc_type_id} value={dt.doc_type_id}>
                      {dt.name}
                    </option>
                  ))}
                </select>

                <p className={styles.fieldHelper}>
                  Examples: Bonafide Certificate, Transcript, Scholarship Form, Experience Certificate.
                </p>

                {selectedDocType?.description && (
                  <div className={styles.typeDescription}>
                    {selectedDocType.description}
                  </div>
                )}
              </div>

              {/* Reason Multiline TextArea */}
              <div className={styles.fieldGroup}>
                <TextArea
                  id="reason-textarea"
                  label="Reason"
                  required
                  rows={5}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  onBlur={() => setTouchedReason(true)}
                  placeholder="Needed for the scholarship application."
                  minLength={5}
                  maxLength={1000}
                  hint="Required: 5-1000 characters"
                  error={touchedReason && reason.trim().length > 0 && reason.trim().length < 5 ? 'Reason must be at least 5 characters' : undefined}
                  data-testid="request-reason-input"
                />
              </div>

              {/* Form Action Controls */}
              <div className={styles.actionsRow}>
                <Link to="/tracks/docdesk/my-requests" style={{ textDecoration: 'none' }}>
                  <Button type="button" variant="secondary" size="md">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submitting}
                  disabled={isSubmitDisabled}
                  data-testid="submit-request-button"
                >
                  Submit Request
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DocDeskLayout>
  )
}
