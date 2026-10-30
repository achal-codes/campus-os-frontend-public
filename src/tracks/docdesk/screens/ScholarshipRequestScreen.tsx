import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Spinner, Stack, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { createRequest } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import glassStyles from '../theme/glass.module.css'
import type { DocType } from '../types'
import styles from './RequestFormScreen.module.css'

export function ScholarshipRequestScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [scholarshipDocType, setScholarshipDocType] = useState<DocType | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function findScholarshipType() {
      setLoading(true)
      setError(null)
      try {
        const res = await listDocTypes({ status: 'active', limit: 100 })
        if (active) {
          const match = res.items.find(
            (d) => d.name.toLowerCase().includes('scholarship') && d.status === 'active',
          )
          setScholarshipDocType(match ?? null)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load document catalogue')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    findScholarshipType()
    return () => {
      active = false
    }
  }, [])

  if (user && user.role !== 'student') {
    return (
      <DocDeskLayout>
        <div style={{ padding: '24px', maxWidth: 600, margin: '40px auto' }}>
          <Alert tone="info">
            Scholarship requesting is a student-only capability. Your current role is <strong>{user.role}</strong>.
          </Alert>
          <div style={{ marginTop: '16px' }}>
            <Link to="/tracks/docdesk/my-requests">
              <Button variant="secondary">View Requests</Button>
            </Link>
          </div>
        </div>
      </DocDeskLayout>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!scholarshipDocType) {
      setError('The Scholarship Application document type is not yet enabled by Student Affairs.')
      return
    }

    const trimmedReason = reason.trim()
    if (trimmedReason.length < 5 || trimmedReason.length > 1000) {
      setError('Please provide a reason or statement between 5 and 1000 characters.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const created = await createRequest({
        doc_type_id: scholarshipDocType.doc_type_id,
        reason: trimmedReason,
      })
      navigate(`/tracks/docdesk/requests/${created.request_id}`)
    } catch (err: any) {
      if (err?.code === 'DOC_TYPE_ARCHIVED' || err?.status === 409) {
        setError('The Scholarship Application document type is currently archived. Please contact Student Affairs.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to submit scholarship request')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DocDeskLayout activeItem="scholarship">
      <div className={styles.pageContainer} data-testid="docdesk-scholarship-request-screen">
        <div className={`${glassStyles.glassPanel} ${styles.formCard}`} style={{ maxWidth: 720 }}>
          {/* Header */}
          <div className={styles.headerText}>
            <h1 className={styles.title}>Apply for Campus Scholarship</h1>
            <p className={styles.subtitle}>
              Submit an official scholarship request to Student Affairs.
            </p>
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <Spinner label="Checking scholarship document type..." />
            </div>
          ) : !scholarshipDocType ? (
            <div style={{ padding: '20px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
              <Text size="md" weight="bold" style={{ color: '#92400e' }}>
                Scholarship Application Not Yet Configured
              </Text>
              <Text size="sm" style={{ color: '#78350f', marginTop: 8 }}>
                The &ldquo;Scholarship Application&rdquo; document type has not been enabled on the server yet.
                Please contact the Student Affairs department to create or activate &ldquo;Scholarship Application&rdquo; in the Document Types Manager.
              </Text>
              <div style={{ marginTop: 16 }}>
                <Link to="/tracks/docdesk/catalogue">
                  <Button variant="secondary" size="sm">
                    Back to Document Catalog
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Stack gap={5}>
                {/* Stage 1 Workflow Explanation Box (§6) */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Text size="sm" weight="bold" style={{ color: '#4338ca', marginBottom: 6 }}>
                    Stage 1: Submit Initial Request (No upload required at this stage)
                  </Text>
                  <Text size="xs" tone="textMuted" style={{ lineHeight: 1.6 }}>
                    When you submit this request, the <strong>Student Affairs office</strong> will review it and reply with the official scholarship application form, checklist, and specific instructions.
                  </Text>

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #cbd5e1' }}>
                    <Text size="xs" weight="bold" style={{ color: '#0f172a', marginBottom: 4 }}>
                      Typical Supporting Documents Required Later in Stage 2:
                    </Text>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                      <li>Aadhaar card or other accepted government identity proof</li>
                      <li>Family income certificate issued by competent authority</li>
                      <li>Previous academic-year marksheet / grade card</li>
                      <li><em>Note: Student Affairs may request additional specific documentation in their response.</em></li>
                    </ul>
                  </div>
                </div>

                {/* Preselected document type (§6: "do not ask the student to select a second document type") */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Selected Document Type</label>
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  >
                    {scholarshipDocType.name}
                  </div>
                  <span className={styles.helperText}>
                    The selected document type is locked to Scholarship Application.
                  </span>
                </div>

                {/* Statement / Reason textarea */}
                <div className={styles.formGroup}>
                  <label htmlFor="scholarship-reason" className={styles.label}>
                    Reason & Academic Background <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="scholarship-reason"
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe your current year/program, scholarship scheme interest (merit/need-based), and statement of eligibility..."
                    className={styles.textarea}
                    required
                    data-testid="scholarship-reason-input"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span className={styles.helperText}>
                      Minimum 5 characters, maximum 1000 characters.
                    </span>
                    <span
                      className={styles.helperText}
                      style={{ color: reason.length > 1000 ? '#dc2626' : undefined }}
                    >
                      {reason.length} / 1000
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className={styles.buttonRow}>
                  <Link to="/tracks/docdesk/catalogue" style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" size="md" type="button">
                      Cancel
                    </Button>
                  </Link>

                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    loading={submitting}
                    data-testid="submit-scholarship-button"
                  >
                    Submit Scholarship Request
                  </Button>
                </div>
              </Stack>
            </form>
          )}
        </div>
      </div>
    </DocDeskLayout>
  )
}
