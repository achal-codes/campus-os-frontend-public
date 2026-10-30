import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Alert, Button, Spinner, Stack, Text } from '@/ui'
import {
  downloadDocument,
  downloadFilledForm,
  getRequest,
  withdrawAnswer,
} from '../api/requests'
import { AnswerComposerModal } from '../components/AnswerComposerModal'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { RequestCommunicationPanel } from '../components/RequestCommunicationPanel'
import { SetTATModal } from '../components/SetTATModal'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import glass from '../theme/glass.module.css'
import type { DocRequest } from '../types'
import { formatFileSize } from '../utils/files'
import { formatDate, formatDateTime } from '../utils/time'
import styles from './StaffDetailScreen.module.css'

export function StaffDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [request, setRequest] = useState<DocRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [isEditingAnswer, setIsEditingAnswer] = useState(false)
  const [showTATModal, setShowTATModal] = useState(false)
  const [withdrawingAnswer, setWithdrawingAnswer] = useState(false)
  const [downloadingDoc, setDownloadingDoc] = useState(false)
  const [downloadingForm, setDownloadingForm] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getRequest(id)
      setRequest(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load request')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    let active = true
    async function init() {
      if (!id) return
      try {
        const data = await getRequest(id)
        if (active) setRequest(data)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load request')
      } finally {
        if (active) setLoading(false)
      }
    }
    init()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <DocDeskLayout activeItem="queue">
        <div style={{ padding: 'var(--space-8)', textAlign: 'center' }} data-testid="docdesk-staff-detail-screen">
          <Spinner label="Loading request details..." />
        </div>
      </DocDeskLayout>
    )
  }

  if (error || !request) {
    return (
      <DocDeskLayout activeItem="queue">
        <div className={styles.container} data-testid="docdesk-staff-detail-screen">
          <Alert tone="danger">{error ?? 'Request not found'}</Alert>
          <div>
            <Button variant="secondary" onClick={() => navigate('/tracks/docdesk/staff')}>
              Back to Staff Queue
            </Button>
          </div>
        </div>
      </DocDeskLayout>
    )
  }

  async function handleWithdrawAnswer() {
    if (!window.confirm('Withdraw this answer? The request will revert to pending status and all attached documents will be detached.')) {
      return
    }

    setWithdrawingAnswer(true)
    try {
      await withdrawAnswer(request!.request_id)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw answer')
    } finally {
      setWithdrawingAnswer(false)
    }
  }

  async function handleDownloadDoc() {
    setDownloadingDoc(true)
    try {
      await downloadDocument(request!.request_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document')
    } finally {
      setDownloadingDoc(false)
    }
  }

  async function handleDownloadForm() {
    setDownloadingForm(true)
    try {
      await downloadFilledForm(request!.request_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download filled form')
    } finally {
      setDownloadingForm(false)
    }
  }

  function getPresentationState(): string {
    if (request!.status === 'pending') return 'Pending (awaiting officer response)'
    if (request!.status === 'acknowledged') return 'Acknowledged (closed & completed)'
    if (request!.filled_form) return 'Answered (requester submitted filled form)'
    if (request!.document) return 'Answered (awaiting requester filled form / acknowledgement)'
    return 'Answered (awaiting requester acknowledgement)'
  }

  return (
    <DocDeskLayout activeItem="queue">
      <div className={styles.container} data-testid="docdesk-staff-detail-screen">
        <div>
          <Link to="/tracks/docdesk/staff" className={styles.backLink}>
            ← Back to Request Queue
          </Link>
          <div className={styles.headerBar}>
            <Stack gap={1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Text as="h1" size="2xl" weight="bold">
                  Process: {request.doc_type_name ?? request.doc_type_id}
                </Text>
                <StatusBadge status={request.status} />
              </div>
              <Text size="xs" tone="textMuted">
                Request ID: <strong>#{request.request_id}</strong> · Lifecycle: <strong>{getPresentationState()}</strong>
              </Text>
            </Stack>

            <div className={styles.actions}>
              {request.status === 'pending' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTATModal(true)}
                    data-testid="set-tat-button"
                  >
                    Set TAT
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsEditingAnswer(false)
                      setShowAnswerModal(true)
                    }}
                    data-testid="answer-request-button"
                  >
                    Submit Official Answer
                  </Button>
                </>
              )}

              {request.status === 'answered' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsEditingAnswer(true)
                      setShowAnswerModal(true)
                    }}
                    data-testid="edit-answer-button"
                  >
                    Edit Answer
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleWithdrawAnswer}
                    loading={withdrawingAnswer}
                    data-testid="withdraw-answer-button"
                  >
                    Withdraw Answer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}

        {/* 3-Panel Grid */}
        <div className={styles.threePanelGrid}>
          {/* Panel A: Requester & Request Info */}
          <div className={`${glass.panel} ${glass.tintBlue}`}>
            <Stack gap={4}>
              <Text as="h2" size="md" weight="bold">
                Requester Information & Notes
              </Text>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <Text size="xs" tone="textMuted">Requester Name</Text>
                  <Text size="sm" weight="bold">
                    {request.requested_by_name ?? request.requested_by}
                  </Text>
                </div>

                <div className={styles.metaItem}>
                  <Text size="xs" tone="textMuted">Email Address</Text>
                  <Text size="sm">{request.requested_by}</Text>
                </div>

                <div className={styles.metaItem}>
                  <Text size="xs" tone="textMuted">Institutional Role</Text>
                  <Text size="sm">{request.requested_by_role ?? 'student'}</Text>
                </div>

                {request.requested_by_dept && (
                  <div className={styles.metaItem}>
                    <Text size="xs" tone="textMuted">Department</Text>
                    <Text size="sm">{request.requested_by_dept}</Text>
                  </div>
                )}

                {request.requested_by_phone_number && (
                  <div className={styles.metaItem}>
                    <Text size="xs" tone="textMuted">Phone Number</Text>
                    <Text size="sm">{request.requested_by_phone_number}</Text>
                  </div>
                )}

                <div className={styles.metaItem}>
                  <Text size="xs" tone="textMuted">Submitted At</Text>
                  <Text size="sm">{formatDateTime(request.created_at)}</Text>
                </div>
              </div>

              <div>
                <Text size="xs" tone="textMuted">Requester Stated Reason</Text>
                <div className={styles.reasonQuote}>
                  {request.reason}
                </div>
              </div>

              {/* Returned Filled Form Callout if present */}
              {request.filled_form && (
                <div className={styles.fileCallout}>
                  <Stack gap={1}>
                    <Text size="sm" weight="bold">
                      📝 Requester Submission: {request.filled_form.filename}
                    </Text>
                    <Text size="xs" tone="textMuted">
                      {formatFileSize(request.filled_form.size_bytes)} ({request.filled_form.content_type})
                    </Text>
                  </Stack>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadForm}
                    loading={downloadingForm}
                    data-testid="staff-download-filled-form"
                  >
                    Download Filled Form
                  </Button>
                </div>
              )}
            </Stack>
          </div>

          {/* Panel B: Turnaround Time (TAT) Management */}
          <div className={`${glass.panel} ${glass.tintBlue}`}>
            <Stack gap={4}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text as="h2" size="md" weight="bold">
                  Turnaround Time SLA Target
                </Text>
                {request.status === 'pending' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTATModal(true)}
                  >
                    Adjust TAT
                  </Button>
                )}
              </div>

              <div className={styles.metaItem}>
                <Text size="xs" tone="textMuted">Target Completion Date (IST)</Text>
                <div style={{ marginTop: 'var(--space-1)' }}>
                  {request.tat ? (
                    <TATBadge tat={request.tat} />
                  ) : (
                    <Text size="sm" tone="textMuted">No turnaround target specified.</Text>
                  )}
                </div>
              </div>

              {request.tat?.note && (
                <div className={styles.metaItem}>
                  <Text size="xs" tone="textMuted">TAT Operational Note</Text>
                  <div className={styles.reasonQuote}>
                    {request.tat.note}
                  </div>
                </div>
              )}

              {request.tat?.updated_at && (
                <Text size="xs" tone="textMuted">
                  Updated on {formatDateTime(request.tat.updated_at)}
                  {request.tat.updated_by ? ` by ${request.tat.updated_by}` : ''}
                </Text>
              )}
            </Stack>
          </div>

          {/* Panel C: Official Answer & Resolution */}
          <div className={`${glass.panel} ${glass.tintBlue} ${styles.fullWidthPanel}`}>
            <Stack gap={4}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <Text as="h2" size="md" weight="bold">
                  Official Document Resolution & Communication
                </Text>

                {request.status === 'answered' && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsEditingAnswer(true)
                        setShowAnswerModal(true)
                      }}
                    >
                      Edit Resolution
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleWithdrawAnswer}
                      loading={withdrawingAnswer}
                    >
                      Withdraw
                    </Button>
                  </div>
                )}
              </div>

              {request.status === 'pending' ? (
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-md)' }}>
                  <Stack gap={3}>
                    <Text size="sm">
                      This request has not yet been answered. Prepare the required certificate or institutional document and deliver official remarks.
                    </Text>
                    <div>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => {
                          setIsEditingAnswer(false)
                          setShowAnswerModal(true)
                        }}
                      >
                        Prepare & Submit Official Answer →
                      </Button>
                    </div>
                  </Stack>
                </div>
              ) : (
                <Stack gap={4}>
                  {/* Staff Answer Box */}
                  <div>
                    <Text size="xs" tone="textMuted">Official Remarks on Record</Text>
                    <div className={styles.reasonQuote}>
                      {request.answer?.message ?? 'No remarks recorded.'}
                    </div>
                    {request.answer?.answered_at && (
                      <Text size="xs" tone="textMuted" style={{ marginTop: 'var(--space-1)', display: 'block' }}>
                        Answered on {formatDateTime(request.answer.answered_at)}
                        {request.answer.answered_by_name ? ` by ${request.answer.answered_by_name}` : ''}
                      </Text>
                    )}
                  </div>

                  {/* Attached Document */}
                  {request.document ? (
                    <div className={styles.fileCallout}>
                      <Stack gap={1}>
                        <Text size="sm" weight="bold">
                          📎 Attached Document: {request.document.filename}
                        </Text>
                        <Text size="xs" tone="textMuted">
                          {formatFileSize(request.document.size_bytes)} ({request.document.content_type})
                        </Text>
                      </Stack>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleDownloadDoc}
                        loading={downloadingDoc}
                        data-testid="staff-download-doc"
                      >
                        Download Attached Document
                      </Button>
                    </div>
                  ) : (
                    <Text size="xs" tone="textMuted">No document attached to this resolution.</Text>
                  )}

                  {/* Acknowledgment Banner */}
                  {request.status === 'acknowledged' ? (
                    <div className={`${styles.ackBanner} ${styles.ackBannerSuccess}`}>
                      <span>✓</span>
                      <span>
                        Requester acknowledged receipt and accepted the resolution
                        {request.acknowledged_at ? ` on ${formatDate(request.acknowledged_at)}` : ''}. Request lifecycle completed.
                      </span>
                    </div>
                  ) : (
                    <div className={`${styles.ackBanner} ${styles.ackBannerPending}`}>
                      <span>⏳</span>
                      <span>
                        Awaiting student/requester acknowledgment. Once verified, the lifecycle will close.
                      </span>
                    </div>
                  )}
                </Stack>
              )}
            </Stack>
          </div>
        </div>

        {/* Chronological Timeline */}
        <RequestCommunicationPanel request={request} />

        {showAnswerModal && (
          <AnswerComposerModal
            request={request}
            isEditing={isEditingAnswer}
            onClose={() => setShowAnswerModal(false)}
            onSuccess={() => {
              setShowAnswerModal(false)
              loadData()
            }}
          />
        )}

        {showTATModal && (
          <SetTATModal
            request={request}
            onClose={() => setShowTATModal(false)}
            onSuccess={() => {
              setShowTATModal(false)
              loadData()
            }}
          />
        )}
      </div>
    </DocDeskLayout>
  )
}
