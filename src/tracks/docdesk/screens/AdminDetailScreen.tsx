import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Alert, Button, Card, Spinner, Stack, Text } from '@/ui'
import { downloadDocument, downloadFilledForm, getRequest } from '../api/requests'
import { DocDeskNav } from '../components/DocDeskNav'
import { RequestCommunicationPanel } from '../components/RequestCommunicationPanel'
import { StatusBadge } from '../components/StatusBadge'
import { TATBadge } from '../components/TATBadge'
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
      <Stack gap={6} data-testid="docdesk-admin-detail-screen">
        <DocDeskNav />
        <Stack gap={4} style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
          <Spinner label="Loading audit details..." />
        </Stack>
      </Stack>
    )
  }

  if (error || !request) {
    return (
      <Stack gap={6} data-testid="docdesk-admin-detail-screen">
        <DocDeskNav />
        <Alert tone="danger">{error ?? 'Request not found'}</Alert>
        <Button variant="secondary" onClick={() => navigate('/tracks/docdesk/admin')}>
          Back to Admin Overview
        </Button>
      </Stack>
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
    <Stack gap={6} data-testid="docdesk-admin-detail-screen">
      <DocDeskNav />

      <div className={styles.headerBar}>
        <Stack gap={1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Text as="h1" size="xl" weight="bold">
              Audit Record: {request.doc_type_name ?? request.doc_type_id}
            </Text>
            <StatusBadge status={request.status} />
          </div>
          <Text size="xs" tone="textMuted">
            ID: #{request.request_id} • Status: {request.status} • Strict Read-Only Audit View
          </Text>
        </Stack>

        <Button variant="secondary" size="sm" onClick={() => navigate('/tracks/docdesk/admin')}>
          Back to Audit Overview
        </Button>
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <Card>
        <Stack gap={4}>
          <Text as="h2" size="md" weight="bold">
            Requester Profile & Request Metadata
          </Text>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <Text size="xs" tone="textMuted">Requester Name</Text>
              <Text size="sm" weight="bold">
                {request.requested_by_name ?? request.requested_by}
              </Text>
            </div>

            <div className={styles.metaItem}>
              <Text size="xs" tone="textMuted">Email ID</Text>
              <Text size="sm">{request.requested_by}</Text>
            </div>

            <div className={styles.metaItem}>
              <Text size="xs" tone="textMuted">Role</Text>
              <Text size="sm">{request.requested_by_role ?? 'student'}</Text>
            </div>

            {request.requested_by_dept && (
              <div className={styles.metaItem}>
                <Text size="xs" tone="textMuted">Department</Text>
                <Text size="sm">{request.requested_by_dept}</Text>
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

          <div style={{ marginTop: 'var(--space-2)' }}>
            <Text size="xs" tone="textMuted">Reason for Request</Text>
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

      {/* Answer Record */}
      {request.answer && (
        <Card>
          <Stack gap={3}>
            <Text as="h2" size="md" weight="bold">
              Official Resolution on Record
            </Text>

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
                  data-testid="admin-download-doc"
                >
                  Download Document
                </Button>
              </div>
            )}
          </Stack>
        </Card>
      )}

      {/* Requester Filled Form (if uploaded) */}
      {request.filled_form && (
        <Card>
          <Stack gap={3}>
            <Text as="h2" size="md" weight="bold">
              Requester-Submitted Filled Form
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
        </Card>
      )}

      <RequestCommunicationPanel request={request} />
    </Stack>
  )
}
