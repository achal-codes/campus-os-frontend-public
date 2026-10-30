import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Spinner, Text } from '@/ui'
import { acknowledgeRequest, downloadDocument, getRequest, withdrawRequest } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { EditRequestModal } from '../components/EditRequestModal'
import { FilledFormPanel } from '../components/FilledFormPanel'
import { LifecycleStrip } from '../components/LifecycleStrip'
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
  const [copied, setCopied] = useState(false)

  function handleCopyId() {
    if (!request) return
    navigator.clipboard.writeText(request.request_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
      <DocDeskLayout>
        <div style={{ padding: '48px', textAlign: 'center' }} data-testid="docdesk-request-detail-screen">
          <Spinner label="Loading request details..." />
        </div>
      </DocDeskLayout>
    )
  }

  if (error || !request) {
    return (
      <DocDeskLayout>
        <div style={{ padding: '24px' }} data-testid="docdesk-request-detail-screen">
          <Alert tone="danger">{error ?? 'Request not found'}</Alert>
          <div style={{ marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => navigate('/tracks/docdesk/my-requests')}>
              Back to My Requests
            </Button>
          </div>
        </div>
      </DocDeskLayout>
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
    if (!window.confirm('Withdraw this request? This cannot be undone.')) {
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
    if (!window.confirm("Acknowledge receipt? You won't be able to upload or change anything after this.")) {
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
    <DocDeskLayout>
      <div className={styles.container} data-testid="docdesk-request-detail-screen">
        {/* Header Bar with Breadcrumb and Title (§4.2 / §4.3) */}
        <div className={`${glassStyles.glassPanel} ${styles.headerBar}`}>
          <div className={styles.titleArea}>
            <div className={styles.breadcrumb}>
              <Link to="/tracks/docdesk/my-requests" className={styles.breadcrumbLink}>
                My Requests
              </Link>
              <span>/</span>
              <span>{request.request_id}</span>
            </div>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>Request details</h1>
              <StatusBadge status={request.status} />
              <button
                type="button"
                className={styles.copyBtn}
                onClick={handleCopyId}
                title="Copy Request ID"
                aria-label="Copy Request ID"
              >
                {request.request_id} {copied ? '(Copied)' : '(Copy)'}
              </button>
            </div>
            <p className={styles.subtitle}>
              Document: <strong>{request.doc_type_name ?? request.doc_type_id}</strong> • Submitted {formatDateTime(request.created_at)}
            </p>
          </div>

          <div className={styles.actionsGroup}>
            {canAcknowledge && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAcknowledge}
                loading={acknowledging}
                data-testid="acknowledge-request-button"
              >
                Acknowledge
              </Button>
            )}
          </div>
        </div>

        {/* 3-Step Progress Map (§3.8) */}
        <LifecycleStrip
          status={request.status}
          submittedAt={request.created_at}
          answeredAt={request.answer?.answered_at}
          tat={request.tat}
        />

        {error && <Alert tone="danger">{error}</Alert>}

        {/* SCREEN 3: Pending Request Details */}
        {isPending && (
          <>
            <div className={styles.twoPanelGrid}>
              {/* Overline 1: REQUEST INFORMATION */}
              <div className={`${glassStyles.glassPanel} ${styles.panelContent}`}>
                <div className={styles.overline}>REQUEST INFORMATION</div>
                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Request ID</span>
                    <span className={styles.metaValue} style={{ fontWeight: 600 }}>{request.request_id}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Document type</span>
                    <span className={styles.metaValue}>{request.doc_type_name ?? request.doc_type_id}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Submitted on</span>
                    <span className={styles.metaValue}>{formatDateTime(request.created_at)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Status</span>
                    <span className={styles.metaValue}><StatusBadge status={request.status} /></span>
                  </div>
                </div>

                <div>
                  <span className={styles.metaLabel} style={{ display: 'block', marginBottom: 6 }}>Reason</span>
                  <div className={styles.reasonBox}>{request.reason}</div>
                </div>
              </div>

              {/* Overline 2: TURNAROUND TIME (IF SET) */}
              <div className={`${glassStyles.glassPanel} ${styles.panelContent}`}>
                <div className={styles.overline}>TURNAROUND TIME (IF SET)</div>
                {request.tat ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Expected by</span>
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={styles.metaValue} style={{ fontWeight: 600 }}>
                          {formatDate(request.tat.expected_by)}
                        </span>
                        <TATBadge tat={request.tat} />
                      </div>
                    </div>
                    {request.tat.note && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Staff note</span>
                        <div className={styles.reasonBox} style={{ background: '#f8fafc' }}>
                          {request.tat.note}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                    <Text size="sm">No turnaround time has been assigned yet.</Text>
                    <Text size="xs" style={{ marginTop: 6, fontStyle: 'italic' }}>
                      TAT is optional and is set by Student Affairs while the request is pending.
                    </Text>
                  </div>
                )}
              </div>
            </div>

            {/* Overline 3: AVAILABLE REQUESTER ACTIONS */}
            <div className={`${glassStyles.glassPanel} ${styles.panelContent}`}>
              <div className={styles.overline}>AVAILABLE REQUESTER ACTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className={styles.actionRow}>
                  <p className={styles.actionDesc}>Edit request: change document type and/or reason.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    disabled={!canEdit}
                    data-testid="edit-request-button"
                  >
                    Edit Request
                  </Button>
                </div>

                <div className={styles.actionRow}>
                  <p className={styles.actionDesc}>Withdraw request: remove your pending request.</p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleWithdraw}
                    loading={withdrawing}
                    disabled={!canWithdraw}
                    data-testid="withdraw-request-button"
                  >
                    Withdraw
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SCREEN 4: Answered and Acknowledged Request Details */}
        {isAnsweredOrAck && (
          <>
            {/* Request Summary Card */}
            <div className={`${glassStyles.glassPanel} ${styles.summaryCard}`}>
              <div className={styles.overline}>REQUEST SUMMARY</div>
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Request ID</span>
                  <span className={styles.metaValue} style={{ fontWeight: 600 }}>{request.request_id}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Document type</span>
                  <span className={styles.metaValue}>{request.doc_type_name ?? request.doc_type_id}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Submitted date</span>
                  <span className={styles.metaValue}>{formatDateTime(request.created_at)}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Expected by</span>
                  <span className={styles.metaValue}>
                    {request.tat?.expected_by ? formatDate(request.tat.expected_by) : 'Not assigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.twoPanelGrid}>
              {/* Left Panel: STUDENT AFFAIRS RESPONSE */}
              <div className={`${glassStyles.glassPanel} ${styles.panelContent}`}>
                <div className={styles.overline}>STUDENT AFFAIRS RESPONSE</div>
                {request.answer ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className={styles.metaGrid}>
                      {request.answer.answered_by_name && (
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Answered by:</span>
                          <span className={styles.metaValue} style={{ fontWeight: 600 }}>
                            {request.answer.answered_by_name}
                          </span>
                        </div>
                      )}
                      {request.answer.answered_at && (
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Answered at:</span>
                          <span className={styles.metaValue}>{formatDateTime(request.answer.answered_at)}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className={styles.metaLabel} style={{ display: 'block', marginBottom: 6 }}>Message:</span>
                      <div className={styles.reasonBox}>{request.answer.message}</div>
                    </div>
                  </div>
                ) : (
                  <Text size="sm" tone="textMuted">No message content returned.</Text>
                )}
              </div>

              {/* Right Panel: DOCUMENT FROM STAFF */}
              <div className={`${glassStyles.glassPanel} ${styles.panelContent}`}>
                <div className={styles.overline}>DOCUMENT FROM STAFF</div>
                {request.document ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Document file</span>
                      <span className={styles.metaValue} style={{ fontWeight: 600 }}>{request.document.filename}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
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
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                    <Text size="sm">No official document attached to this answer.</Text>
                  </div>
                )}
              </div>
            </div>

            {/* Filled-Form Round Trip Panel (§4.3 — only if staff attached a document) */}
            {request.document && (
              <div className={glassStyles.glassPanel} style={{ padding: '20px' }}>
                <FilledFormPanel
                  request={request}
                  isOwner={request.requested_by === user?.email}
                  isStudentAffairs={isStudentAffairs}
                  role={user?.role ?? 'student'}
                  onUpdated={loadData}
                />
              </div>
            )}

            {/* Acknowledged status helper message (§4.4) */}
            {request.status === 'acknowledged' && (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '12px' }}>
                This request is closed.
              </div>
            )}
          </>
        )}

        {/* Official Request Timeline Panel */}
        <div className={glassStyles.glassPanel} style={{ padding: '20px' }}>
          <RequestCommunicationPanel request={request} />
        </div>

        {/* Edit Request Modal */}
        {showEditModal && (
          <EditRequestModal
            request={request}
            onClose={() => setShowEditModal(false)}
            onSuccess={async () => {
              setShowEditModal(false)
              await loadData()
            }}
          />
        )}
      </div>
    </DocDeskLayout>
  )
}
