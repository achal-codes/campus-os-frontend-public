import type { RequestStatus } from '../types'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: RequestStatus
}

const LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  answered: 'Answered',
  acknowledged: 'Acknowledged',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]}`} data-testid={`status-badge-${status}`}>
      <span className={styles.dot} aria-hidden="true" />
      {LABELS[status] ?? status}
    </span>
  )
}
