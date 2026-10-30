import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Card, Spinner, Stack, Text } from '@/ui'
import { acknowledgeRequest, downloadDocument, getRequest, withdrawRequest } from '../api/requests'
import { DocDeskNav } from '../components/DocDeskNav'
import { EditRequestModal } from '../components/EditRequestModal'
import { FilledFormPanel } from '../components/FilledFormPanel'
import { RequestCommunicationPanel } from '../components/RequestCommunicationPanel'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import { useProfile } from '../hooks/useProfile'
import { can } from '../permissions/permissions'
import type { DocRequest } from '../types'
import { formatFileSize } from '../utils/files'
import { formatDateTime } from '../utils/time'
import styles from './RequestDetailScreen.module.css'

export function RequestDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isStudentAffairs } = useProfile()

  const [request, setRequest] = useState<DocRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [downloadingDoc, setDownloadingDoc] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)

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
      <Stack gap={6} data-testid="docdesk-request-detail-screen">
        <DocDeskNav />
        <Stack gap={4} style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
          <Spinner label="Loading request details..." />
        </Stack>
      </Stack>
    )
  }

  if (error || !request) {
    return (
      <Stack gap={6} data-testid="docdesk-request-detail-screen">
        <DocDeskNav />
        <Alert tone="danger">{error ?? 'Request not found'}</Alert>
        <Button variant="secondary" onClick={() => navigate('/tracks/docdesk/my-requests')}>
          Back to My Requests
        </Button>
      </Stack>
    )
  }

  const isOwner = user?.email === request.requested_by || user?.id === request.requested_by
  const permCtx = {
    role: user?.role ?? 'student',
    isStudentAffairs,
    requestStatus: request.status,
    isOwner,
    hasDocument: Boolean(request.document),
    hasFilledForm: Boolean(request.filled_form),
  }

  const canEdit = can('request.edit', permCtx)
  const canWithdraw = can('request.withdraw', permCtx)
  const canAcknowledge = can('request.acknowledge', permCtx)
  const canDownloadDoc = can('document.download', permCtx)

  async function handleDownloadDoc() {
    if (!id) return
    setDownloadingDoc(true)
    try {
      await downloadDocument(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloadingDoc(false)
    }
  }

  async function handleWithdraw() {
    if (!window.confirm('Are you sure you want to withdraw this pending request? This action cannot be undone.')) {
      return
    }

    setWithdrawing(true)
    try {
      await withdrawRequest(request!.request_id)
      navigate('/tracks/docdesk/my-requests')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw request')
      setWithdrawing(false)
    }
  }

  async function handleAcknowledge() {
    if (!window.confirm('Acknowledge that you have received the official resolution/document for this request?')) {
      return
    }

    setAcknowledging(true)
    try {
      await acknowledgeRequest(request!.request_id)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge request')
    } finally {
      setAcknowledging(false)
    }
  }

  return (
    <Stack gap={6} data-testid="docdesk-request-detail-screen">
      <DocDeskNav />

      <div className={styles.headerBar}>
        <Stack gap={1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Text as="h1" size="xl" weight="bold">
              {request.doc_type_name ?? request.doc_type_id}
            </Text>
            <StatusBadge status={request.status} />
          </div>
          <Text size="xs" tone="textMuted">
            Request #{request.request_id} • Submitted {formatDateTime(request.created_at)}
          </Text>
        </Stack>

        <div className={styles.actions}>
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowEditModal(true)}
              data-testid="edit-request-button"
            >
              Edit Reason
            </Button>
          )}

          {canWithdraw && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleWithdraw}
              loading={withdrawing}
              data-testid="withdraw-request-button"
            >
              Withdraw Request
            </Button>
          )}

          {canAcknowledge && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAcknowledge}
              loading={acknowledging}
              data-testid="acknowledge-request-button"
            >
              ✓ Acknowledge & Close
            </Button>
          )}
        </div>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <Card>
        <Stack gap={4}>
          <Text as="h2" size="md" weight="bold">
            Request Information
          </Text>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <Text size="xs" tone="textMuted">Requester</Text>
              <Text size="sm" weight="medium">
                {request.requested_by_name ?? request.requested_by} ({request.requested_by_role ?? 'student'})
              </Text>
            </div>

            {request.requested_by_dept && (
              <div className={styles.metaItem}>
                <Text size="xs" tone="textMuted">Department</Text>
                <Text size="sm">{request.requested_by_dept}</Text>
              </div>
            )}

            <div className={styles.metaItem}>
              <Text size="xs" tone="textMuted">Target Date (TAT)</Text>
              <div>{request.tat ? <TATBadge tat={request.tat} /> : <Text size="sm" tone="textMuted">Not set yet</Text>}</div>
            </div>

            <div className={styles.metaItem}>
              <Text size="xs" tone="textMuted">Last Updated</Text>
              <Text size="sm">{formatDateTime(request.updated_at)}</Text>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-2)' }}>
            <Text size="xs" tone="textMuted">Stated Purpose / Reason</Text>
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

      {/* Answer & Download Card */}
      {request.answer && (
        <Card data-testid="docdesk-answer-section">
          <Stack gap={4}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text as="h2" size="md" weight="bold">
                Student Affairs Official Answer
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

                {canDownloadDoc && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadDoc}
                    loading={downloadingDoc}
                    data-testid="download-answer-document-button"
                  >
                    Download Official Document
                  </Button>
                )}
              </div>
            )}
          </Stack>
        </Card>
      )}

      {/* Filled Form Panel */}
      <FilledFormPanel
        request={request}
        isOwner={isOwner}
        isStudentAffairs={isStudentAffairs}
        role={user?.role ?? 'student'}
        onUpdated={loadData}
      />

      {/* Chronological Communication Panel */}
      <RequestCommunicationPanel request={request} />

      {/* Edit Modal */}
      {showEditModal && (
        <EditRequestModal
          request={request}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            loadData()
          }}
        />
      )}
    </Stack>
  )
}
