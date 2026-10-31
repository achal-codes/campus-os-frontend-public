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
import { LifecycleStrip } from '../components/LifecycleStrip'
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
    if (!id) return
    getRequest(id)
      .then((data) => {
        if (active) setRequest(data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load request')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
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
    const warningMsg = request!.filled_form
      ? `Withdraw this answer? The request will revert to pending status. NOTE: The requester's uploaded filled form (${request!.filled_form.filename}) will also be permanently deleted by the server.`
      : 'Withdraw this answer? The request will revert to pending status and all attached documents will be detached.'

    if (!window.confirm(warningMsg)) {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', marginBottom: 6 }}>
            <Link to="/tracks/docdesk/staff" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
              Requests
            </Link>
            <span style={{ color: 'var(--color-text-muted)' }}>/</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{request.request_id}</span>
          </div>

          <div className={styles.headerBar}>
            <Stack gap={1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Text as="h1" size="2xl" weight="bold">
                  Process request: {request.request_id}
                </Text>
                <StatusBadge status={request.status} />
              </div>
              <Text size="xs" tone="textMuted">
                Document: <strong>{request.doc_type_name ?? request.doc_type_id}</strong> · Lifecycle: <strong>{getPresentationState()}</strong>
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
                    Save TAT
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
                    Send Answer
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
                    Edit Message
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

        {/* 3-Step Lifecycle Progress Strip */}
        <LifecycleStrip status={request.status} />

        {error && <Alert tone="danger">{error}</Alert>}

        {/* 3-Panel Grid */}
        <div className={styles.threePanelGrid}>
          {/* Panel A: Requester & Request Info */}
          <div className={`${glass.panel} ${glass.tintBlue}`}>
            <Stack gap={4}>
              <Text as="h2" size="sm" weight="bold" tone="accent" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                REQUESTER & REQUEST
              </Text>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <Text size="xs" tone="textMuted">Requester</Text>
                  <Text size="sm" weight="bold">
                    {request.requested_by_name ?? request.requested_by}
                  </Text>
                </div>

                <div className={styles.metaItem}>
                  <Text size="xs" tone="textMuted">Email</Text>
                  <Text size="sm">{request.requested_by}</Text>
                </div>

                <div className={styles.metaItem}>
                  <Text size="xs" tone="textMuted">Document</Text>
                  <Text size="sm">{request.doc_type_name ?? request.doc_type_id}</Text>
                </div>

                <div className={styles.metaItem}>
                  <Text size="xs" tone="textMuted">Submitted</Text>
                  <Text size="sm">{formatDateTime(request.created_at)}</Text>
                </div>

                {request.requested_by_dept && (
                  <div className={styles.metaItem}>
                    <Text size="xs" tone="textMuted">Department</Text>
                    <Text size="sm">{request.requested_by_dept}</Text>
                  </div>
                )}
              </div>

              <div>
                <Text size="xs" tone="textMuted">Reason</Text>
                <div className={styles.reasonQuote}>
                  {request.reason}
                </div>
              </div>

              {/* Returned Filled Form Callout if present */}
              {request.filled_form && (
                <div className={styles.fileCallout}>
                  <Stack gap={1}>
                    <Text size="sm" weight="bold">
                      Requester Submission: {request.filled_form.filename}
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
                <Text as="h2" size="sm" weight="bold" tone="accent" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  TURNAROUND TIME (PENDING ONLY)
                </Text>
                {request.status === 'pending' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTATModal(true)}
                  >
                    Save TAT
                  </Button>
                )}
              </div>

              <div className={styles.metaItem}>
                <Text size="xs" tone="textMuted">Expected by (YYYY-MM-DD)</Text>
                <div style={{ marginTop: 'var(--space-1)' }}>
                  {request.tat ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text size="sm" weight="bold">{formatDate(request.tat.expected_by)}</Text>
                      <TATBadge tat={request.tat} />
                    </div>
                  ) : (
                    <Text size="sm" tone="textMuted">No turnaround target specified.</Text>
                  )}
                </div>
              </div>

              {request.tat?.note && (
                <div className={styles.metaItem}>
                  <Text size="xs" tone="textMuted">TAT note (optional)</Text>
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
                <Text as="h2" size="sm" weight="bold" tone="accent" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ANSWER THE REQUEST
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
                      Edit Message
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleWithdrawAnswer}
                      loading={withdrawingAnswer}
                    >
                      Withdraw Answer
                    </Button>
                  </div>
                )}
              </div>

              {request.status === 'pending' ? (
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-md)' }}>
                  <Stack gap={3}>
                    <Text size="sm">
                      Initial answer requires a 1-2000 character message. The document is optional. TAT can be set only while pending.
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
                        Send Answer →
                      </Button>
                    </div>
                  </Stack>
                </div>
              ) : (
                <Stack gap={4}>
                  {/* Staff Answer Box */}
                  <div>
                    <Text size="xs" tone="textMuted">Answer message *</Text>
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
                          Attached Document: {request.document.filename}
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

                  <Text size="xs" tone="textMuted" style={{ fontStyle: 'italic' }}>
                    If withdrawing an answer, the request returns to pending.
                  </Text>

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
