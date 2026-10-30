import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Alert, Button, Spinner, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { createRequest } from '../api/requests'
import { DocDeskTopbar } from '../components/DocDeskTopbar'
import glassStyles from '../theme/glass.module.css'
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadCatalogue() {
      try {
        const res = await listDocTypes({ status: 'active', limit: 100 })
        if (active) {
          const activeOnly = res.items.filter((d) => d.status === 'active')
          setDocTypes(activeOnly)
          if (!selectedDocTypeId && activeOnly.length > 0) {
            setSelectedDocTypeId(activeOnly[0].doc_type_id)
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
  }, [selectedDocTypeId])

  const selectedDocType = docTypes.find((d) => d.doc_type_id === selectedDocTypeId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!selectedDocTypeId) {
      setError('Please select a valid document type.')
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
      navigate(`/tracks/docdesk/requests/${created.request_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit document request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={glassStyles.glassContainer}>
      <DocDeskTopbar />

      <main className={styles.pageContainer} data-testid="docdesk-request-form-screen">
        <div className={`${glassStyles.glassPanel} ${styles.formCard}`}>
          {/* Header */}
          <div className={styles.headerText}>
            <h1 className={styles.title}>Request a Document</h1>
            <p className={styles.subtitle}>Choose the document you need and explain why you need it.</p>
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          {loadingDocTypes ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <Spinner label="Loading document types..." />
            </div>
          ) : docTypes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <Text size="md" weight="medium">
                No active document types available
              </Text>
              <Text size="sm" tone="textMuted" style={{ marginTop: 'var(--space-2)' }}>
                Please contact the Student Affairs department to add document types before requesting.
              </Text>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              {/* Document Type Selection */}
              <div className={styles.fieldGroup}>
                <label htmlFor="doctype-select" className={styles.fieldLabel}>
                  <span>
                    Document Type<span className={styles.requiredMark}>*</span>
                  </span>
                </label>
                <select
                  id="doctype-select"
                  className={glassStyles.glassSelect}
                  value={selectedDocTypeId}
                  onChange={(e) => setSelectedDocTypeId(e.target.value)}
                  required
                  data-testid="doctype-select"
                >
                  {docTypes.map((dt) => (
                    <option key={dt.doc_type_id} value={dt.doc_type_id}>
                      {dt.name}
                    </option>
                  ))}
                </select>

                {selectedDocType?.description && (
                  <div className={styles.typeDescription}>
                    ℹ️ {selectedDocType.description}
                  </div>
                )}
              </div>

              {/* Reason Multiline Textarea */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <label htmlFor="reason-textarea">
                    Reason for Request<span className={styles.requiredMark}>*</span>
                  </label>
                  <span className={styles.charCounter} aria-live="polite">
                    {reason.length} / 1000 characters
                  </span>
                </div>
                <textarea
                  id="reason-textarea"
                  className={glassStyles.glassTextarea}
                  rows={5}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you require this document (e.g. scholarship application, passport renewal, visa clearance)..."
                  required
                  minLength={5}
                  maxLength={1000}
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
                  disabled={submitting || reason.trim().length < 5}
                  data-testid="submit-request-button"
                >
                  Submit Request
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
