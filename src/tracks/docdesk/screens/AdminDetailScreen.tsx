import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Alert, Button, Spinner, Stack, Text } from '@/ui'
import { downloadDocument, downloadFilledForm, getRequest } from '../api/requests'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { RequestCommunicationPanel } from '../components/RequestCommunicationPanel'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
import glass from '../theme/glass.module.css'
import type { DocRequest } from '../types'
import { formatFileSize } from '../utils/files'
import { formatDateTime } from '../utils/time'
import styles from './AdminDetailScreen.module.css'

export function AdminDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [request, setRequest] = useState<DocRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingDoc, setDownloadingDoc] = useState(false)
  const [downloadingForm, setDownloadingForm] = useState(false)

  useEffect(() => {
    async function loadData() {
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
    }
    loadData()
  }, [id])

  if (loading) {
    return (
      <DocDeskLayout activeItem="admin">
        <div style={{ padding: 'var(--space-8)', textAlign: 'center' }} data-testid="docdesk-admin-detail-screen">
          <Spinner label="Loading audit details..." />
        </div>
      </DocDeskLayout>
    )
  }

  if (error || !request) {
    return (
      <DocDeskLayout activeItem="admin">
        <div className={styles.container} data-testid="docdesk-admin-detail-screen">
          <Alert tone="danger">{error ?? 'Request not found'}</Alert>
          <div>
            <Button variant="secondary" onClick={() => navigate('/tracks/docdesk/admin')}>
              Back to Admin Overview
            </Button>
          </div>
        </div>
      </DocDeskLayout>
    )
  }

  async function handleDownloadDoc() {
    setDownloadingDoc(true)
    try {
      await downloadDocument(request!.request_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloadingDoc(false)
    }
  }

  async function handleDownloadForm() {
    setDownloadingForm(true)
    try {
      await downloadFilledForm(request!.request_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloadingForm(false)
    }
  }

  return (
    <DocDeskLayout activeItem="admin">
      <div className={styles.container} data-testid="docdesk-admin-detail-screen">
        <div>
          <Link to="/tracks/docdesk/admin" className={styles.backLink}>
            ← Back to Audit Overview
          </Link>
          <div className={styles.headerBar}>
            <Stack gap={1}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Text as="h1" size="2xl" weight="bold">
                  Audit Record: {request.doc_type_name ?? request.doc_type_id}
                </Text>
                <StatusBadge status={request.status} />
              </div>
              <Text size="xs" tone="textMuted">
                Request ID: <strong>#{request.request_id}</strong> · Status: <strong>{request.status}</strong> · Strict Read-Only Audit View
              </Text>
            </Stack>

            <span
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-bold)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              ADMIN AUDIT MODE (MUTATION DISABLED)
            </span>
          </div>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}

        {/* Metadata Panel */}
        <div className={`${glass.panel} ${glass.tintBlue}`}>
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
                <Text size="xs" tone="textMuted">Target Date (TAT)</Text>
                <div>{request.tat ? <TATBadge tat={request.tat} /> : <Text size="sm" tone="textMuted">None set</Text>}</div>
              </div>

              <div className={styles.metaItem}>
                <Text size="xs" tone="textMuted">Submitted At</Text>
                <Text size="sm">{formatDateTime(request.created_at)}</Text>
              </div>
            </div>

            <div>
              <Text size="xs" tone="textMuted">Requester Reason for Application</Text>
              <div className={styles.reasonQuote}>
                {request.reason}
              </div>
            </div>
          </Stack>
        </div>

        {/* Official Resolution on Record */}
        {request.answer && (
          <div className={`${glass.panel} ${glass.tintBlue}`}>
            <Stack gap={3}>
              <Text as="h2" size="md" weight="bold">
                Official Resolution on Record
              </Text>

              <div className={styles.reasonQuote}>
                {request.answer.message}
              </div>

              {request.answer.answered_at && (
                <Text size="xs" tone="textMuted">
                  Answered on {formatDateTime(request.answer.answered_at)}
                  {request.answer.answered_by_name ? ` by ${request.answer.answered_by_name}` : ''}
                </Text>
              )}

              {request.document && (
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
                    data-testid="admin-download-doc"
                  >
                    Download Document
                  </Button>
                </div>
              )}
            </Stack>
          </div>
        )}

        {/* Requester Submitted Filled Form */}
        {request.filled_form && (
          <div className={`${glass.panel} ${glass.tintBlue}`}>
            <Stack gap={3}>
              <Text as="h2" size="md" weight="bold">
                Requester-Submitted Filled Form
              </Text>

              <div className={styles.fileCallout}>
                <Stack gap={1}>
                  <Text size="sm" weight="bold">
                    📝 {request.filled_form.filename}
                  </Text>
                  <Text size="xs" tone="textMuted">
                    {formatFileSize(request.filled_form.size_bytes)} ({request.filled_form.content_type})
                  </Text>
                </Stack>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadForm}
                  loading={downloadingForm}
                  data-testid="admin-download-filled-form"
                >
                  Download Form
                </Button>
              </div>
            </Stack>
          </div>
        )}

        {/* Timeline */}
        <RequestCommunicationPanel request={request} />
      </div>
    </DocDeskLayout>
  )
}
