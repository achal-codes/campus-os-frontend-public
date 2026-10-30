import { Stack, Text } from '@/ui'
import type { DocRequest } from '../types'
import { formatDateTime } from '../utils/time'
import styles from './RequestCommunicationPanel.module.css'

interface RequestCommunicationPanelProps {
  request: DocRequest
}

export function RequestCommunicationPanel({ request }: RequestCommunicationPanelProps) {
  return (
    <div className={styles.panel} data-testid="docdesk-communication-panel">
      <div className={styles.header}>
        <Stack gap={1}>
          <Text as="h3" size="md" weight="bold">
            Request Communication & History
          </Text>
          <Text size="xs" tone="textMuted">
            Official chronological log of requester submission and Student Affairs response.
          </Text>
        </Stack>
      </div>

      <div className={styles.timeline}>
        {/* Step 1: Initial submission */}
        <div className={styles.event} data-testid="timeline-event-submitted">
          <div className={styles.marker} />
          <div className={styles.eventCard}>
            <div className={styles.eventHeader}>
              <Text size="sm" weight="bold">
                Request Submitted by {request.requested_by_name ?? request.requested_by}
              </Text>
              <Text size="xs" tone="textMuted">
                {formatDateTime(request.created_at)}
              </Text>
            </div>
            <div className={styles.eventBody}>
              {request.reason}
            </div>
          </div>
        </div>

        {/* Step 2: Staff Answer (if answered) */}
        {request.answer ? (
          <div className={styles.event} data-testid="timeline-event-answered">
            <div className={styles.marker} style={{ backgroundColor: 'var(--color-accent)' }} />
            <div className={styles.eventCard}>
              <div className={styles.eventHeader}>
                <Text size="sm" weight="bold">
                  Student Affairs Official Response
                  {request.answer.answered_by_name ? ` (${request.answer.answered_by_name})` : ''}
                </Text>
                {request.answer.answered_at && (
                  <Text size="xs" tone="textMuted">
                    {formatDateTime(request.answer.answered_at)}
                  </Text>
                )}
              </div>
              <div className={styles.eventBody}>
                {request.answer.message}
              </div>
              {request.document && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Text size="xs" tone="primary">
                    📎 Attached official document: {request.document.filename}
                  </Text>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.event}>
            <div className={styles.marker} style={{ backgroundColor: 'var(--color-text-muted)' }} />
            <div className={styles.eventCard}>
              <Text size="sm" tone="textMuted">
                Awaiting official response from Student Affairs...
              </Text>
            </div>
          </div>
        )}

        {/* Step 3: Acknowledgement (if acknowledged) */}
        {request.status === 'acknowledged' && (
          <div className={styles.event} data-testid="timeline-event-acknowledged">
            <div className={styles.marker} style={{ backgroundColor: 'var(--color-success)' }} />
            <div className={styles.eventCard}>
              <div className={styles.eventHeader}>
                <Text size="sm" weight="bold" tone="success">
                  Request Acknowledged & Closed
                </Text>
                {request.acknowledged_at && (
                  <Text size="xs" tone="textMuted">
                    {formatDateTime(request.acknowledged_at)}
                  </Text>
                )}
              </div>
              <div className={styles.eventBody}>
                The requester confirmed receipt of the document/resolution.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.disclaimer}>
        Note: DocDesk uses an official Request & Answer lifecycle. Ongoing two-way live messaging or interactive chat is not supported by the institutional backend.
      </div>
    </div>
  )
}
