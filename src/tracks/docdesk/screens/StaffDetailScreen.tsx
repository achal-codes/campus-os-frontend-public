import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Alert, Button, Card, Spinner, Stack, Text } from '@/ui'
import {
  downloadDocument,
  downloadFilledForm,
  getRequest,
  withdrawAnswer,
} from '../api/requests'
import { AnswerComposerModal } from '../components/AnswerComposerModal'
import { DocDeskNav } from '../components/DocDeskNav'
import { RequestCommunicationPanel } from '../components/RequestCommunicationPanel'
import { SetTATModal } from '../components/SetTATModal'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import type { DocRequest } from '../types'
import { formatFileSize } from '../utils/files'
import { formatDateTime } from '../utils/time'
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
      <Stack gap={6} data-testid="docdesk-staff-detail-screen">
        <DocDeskNav />
        <Stack gap={4} style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
          <Spinner label="Loading request details..." />
        </Stack>
      </Stack>
    )
  }

  if (error || !request) {
    return (
      <Stack gap={6} data-testid="docdesk-staff-detail-screen">
        <DocDeskNav />
        <Alert tone="danger">{error ?? 'Request not found'}</Alert>
        <Button variant="secondary" onClick={() => navigate('/tracks/docdesk/staff')}>
          Back to Staff Queue
        </Button>
      </Stack>
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

  // Presentation status label
  function getPresentationState(): string {
    if (request!.status === 'pending') return 'Pending (awaiting staff response)'
    if (request!.status === 'acknowledged') return 'Acknowledged (closed)'
    if (request!.filled_form) return 'Answered (filled form returned by requester)'
    if (request!.document) return 'Answered (waiting for requester filled form / acknowledgement)'
    return 'Answered (awaiting requester acknowledgement)'
  }

  return (
    <Stack gap={6} data-testid="docdesk-staff-detail-screen">
      <DocDeskNav />

      <div className={styles.headerBar}>
        <Stack gap={1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Text as="h1" size="xl" weight="bold">
              Process: {request.doc_type_name ?? request.doc_type_id}
            </Text>
            <StatusBadge status={request.status} />
          </div>
          <Text size="xs" tone="textMuted">
            ID: #{request.request_id} • Lifecycle State: <strong>{getPresentationState()}</strong>
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

      {error && <Alert tone="danger">{error}</Alert>}

      <Card>
        <Stack gap={4}>
          <Text as="h2" size="md" weight="bold">
            Requester Profile & Submission Data
          </Text>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <Text size="xs" tone="textMuted">Requester Name</Text>
              <Text size="sm" weight="bold">
                {request.requested_by_name ?? request.requested_by}
              </Text>
            </div>

            <div className={styles.metaItem}>
              <Text size="xs" tone="textMuted">Email Identifier</Text>
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
              <Text size="xs" tone="textMuted">Target Date (TAT)</Text>
              <div>{request.tat ? <TATBadge tat={request.tat} /> : <Text size="sm" tone="textMuted">Not set</Text>}</div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-2)' }}>
            <Text size="xs" tone="textMuted">Requester Stated Reason</Text>
            <div
              style={{
                marginTop: 'var(--space-1)',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-surface-muted)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.5,
              }}
            >
              {request.reason}
            </div>
          </div>
        </Stack>
      </Card>

      {/* Answer Preview if already answered */}
      {request.answer && (
        <Card>
          <Stack gap={4}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text as="h2" size="md" weight="bold">
                Official Response on Record
              </Text>
              {request.answer.answered_at && (
                <Text size="xs" tone="textMuted">
                  Answered: {formatDateTime(request.answer.answered_at)}
                </Text>
              )}
            </div>

            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-primary-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.5,
              }}
            >
              {request.answer.message}
            </div>

            {request.document && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-surface-muted)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Stack gap={1}>
                  <Text size="sm" weight="bold">
                    📎 {request.document.filename}
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
            )}
          </Stack>
        </Card>
      )}

      {/* Returned Filled Form Card (if uploaded by requester) */}
      {request.filled_form && (
        <Card>
          <Stack gap={3}>
            <Text as="h2" size="md" weight="bold">
              Returned Filled Form (From Requester)
            </Text>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-surface-muted)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Stack gap={1}>
                <Text size="sm" weight="bold">
                  📝 {request.filled_form.filename}
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
                Download Requester Submission
              </Button>
            </div>
          </Stack>
        </Card>
      )}

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
    </Stack>
  )
}
