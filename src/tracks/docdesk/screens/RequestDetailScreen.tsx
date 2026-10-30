import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Spinner, Text } from '@/ui'
import { acknowledgeRequest, downloadDocument, getRequest, withdrawRequest } from '../api/requests'
import { DocDeskTopbar } from '../components/DocDeskTopbar'
import { EditRequestModal } from '../components/EditRequestModal'
import { FilledFormPanel } from '../components/FilledFormPanel'
import { RequestCommunicationPanel } from '../components/RequestCommunicationPanel'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import { useProfile } from '../hooks/useProfile'
import { can } from '../permissions/permissions'
import glassStyles from '../theme/glass.module.css'
import type { DocRequest } from '../types'
import { formatFileSize } from '../utils/files'
import { formatDate, formatDateTime } from '../utils/time'
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
      <div className={glassStyles.glassContainer}>
        <DocDeskTopbar />
        <main className={styles.container} style={{ padding: 'var(--space-8) var(--space-5)', textAlign: 'center' }} data-testid="docdesk-request-detail-screen">
          <Spinner label="Loading request details..." />
        </main>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className={glassStyles.glassContainer}>
        <DocDeskTopbar />
        <main className={styles.container} style={{ padding: 'var(--space-6) var(--space-5)' }} data-testid="docdesk-request-detail-screen">
          <Alert tone="danger">{error ?? 'Request not found'}</Alert>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" onClick={() => navigate('/tracks/docdesk/my-requests')}>
              Back to My Requests
            </Button>
          </div>
        </main>
      </div>
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

  const isPending = request.status === 'pending'
  const isAnsweredOrAck = request.status === 'answered' || request.status === 'acknowledged'

  return (
    <div className={glassStyles.glassContainer}>
      <DocDeskTopbar />

      <main className={styles.container} style={{ padding: 'var(--space-6) var(--space-5)' }} data-testid="docdesk-request-detail-screen">
        {/* Header Bar */}
        <div className={`${glassStyles.glassPanel} ${styles.headerBar}`}>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{request.doc_type_name ?? request.doc_type_id}</h1>
              <StatusBadge status={request.status} />
            </div>
            <p className={styles.subtitle}>
              Request #{request.request_id} • Submitted on {formatDateTime(request.created_at)}
            </p>
          </div>

          <div className={styles.actionsGroup}>
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

        {/* SCREEN 3: Pending Request Details */}
        {isPending && (
          <div className={styles.twoPanelGrid}>
            {/* Request Information Panel */}
            <div className={`${glassStyles.glassPanel} ${styles.panelContent}`}>
              <h2 className={styles.panelTitle}>Request Information</h2>
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Request ID</span>
                  <span className={styles.metaValue} style={{ fontWeight: 600 }}>{request.request_id}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Document Type</span>
                  <span className={styles.metaValue}>{request.doc_type_name ?? request.doc_type_id}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Submitted Date</span>
                  <span className={styles.metaValue}>{formatDateTime(request.created_at)}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Current Status</span>
                  <span className={styles.metaValue}><StatusBadge status={request.status} /></span>
                </div>
              </div>

              <div>
                <span className={styles.metaLabel} style={{ display: 'block', marginBottom: 6 }}>Reason for Request</span>
                <div className={styles.reasonBox}>{request.reason}</div>
              </div>
            </div>

            {/* Turnaround Time Panel */}
            <div className={`${glassStyles.glassPanel} ${styles.panelContent}`}>
              <h2 className={styles.panelTitle}>Turnaround Time (TAT)</h2>
              {request.tat ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Target Resolution Date</span>
                    <div style={{ marginTop: 4 }}>
                      <TATBadge tat={request.tat} />
                    </div>
                  </div>
                  {request.tat.expected_by && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Target Calendar Date</span>
                      <span className={styles.metaValue}>{formatDate(request.tat.expected_by)}</span>
                    </div>
                  )}
                  {request.tat.note && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Staff Note</span>
                      <div className={styles.reasonBox} style={{ background: 'rgba(99, 102, 241, 0.04)' }}>
                        {request.tat.note}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <Text size="sm">No turnaround time has been assigned yet.</Text>
                  <Text size="xs" style={{ marginTop: 6 }}>
                    Student Affairs will review your request and set an expected target date shortly.
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCREEN 4: Answered and Acknowledged Request Details */}
        {isAnsweredOrAck && (
          <>
            <div className={styles.twoPanelGrid}>
              {/* Left Panel: Student Affairs Response */}
              <div className={`${glassStyles.glassPanel} ${styles.panelContent}`}>
                <h2 className={styles.panelTitle}>Student Affairs Response</h2>
                {request.answer ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div className={styles.metaGrid}>
                      {request.answer.answered_by_name && (
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Answered By</span>
                          <span className={styles.metaValue} style={{ fontWeight: 600 }}>
                            {request.answer.answered_by_name}
                          </span>
                        </div>
                      )}
                      {request.answer.answered_at && (
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Answer Timestamp</span>
                          <span className={styles.metaValue}>{formatDateTime(request.answer.answered_at)}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className={styles.metaLabel} style={{ display: 'block', marginBottom: 6 }}>Official Message</span>
                      <div className={styles.reasonBox}>{request.answer.message}</div>
                    </div>
                  </div>
                ) : (
                  <Text size="sm" tone="textMuted">No message content returned.</Text>
                )}
              </div>

              {/* Right Panel: Document from Student Affairs */}
              <div className={`${glassStyles.glassPanel} ${styles.panelContent}`}>
                <h2 className={styles.panelTitle}>Document from Student Affairs</h2>
                {request.document ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Attached Document File</span>
                      <span className={styles.metaValue} style={{ fontWeight: 600 }}>{request.document.filename}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {formatFileSize(request.document.size_bytes)} • {request.document.content_type}
                      </span>
                    </div>

                    {canDownloadDoc && (
                      <div>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={handleDownloadDoc}
                          loading={downloadingDoc}
                          data-testid="download-document-button"
                        >
                          ⬇ Download Official Document
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Text size="sm">No official document attached to this answer.</Text>
                  </div>
                )}
              </div>
            </div>

            {/* Filled-Form Round Trip Panel (Visible only when appropriate) */}
            {request.document && (
              <div className={glassStyles.glassPanel} style={{ padding: 'var(--space-5)' }}>
                <FilledFormPanel request={request} onRefresh={loadData} />
              </div>
            )}
          </>
        )}

        {/* Official Request Timeline Panel */}
        <div className={glassStyles.glassPanel} style={{ padding: 'var(--space-5)' }}>
          <RequestCommunicationPanel request={request} />
        </div>

        {/* Edit Request Modal */}
        {showEditModal && (
          <EditRequestModal
            request={request}
            onClose={() => setShowEditModal(false)}
            onSaved={async () => {
              setShowEditModal(false)
              await loadData()
            }}
          />
        )}
      </main>
    </div>
  )
}
