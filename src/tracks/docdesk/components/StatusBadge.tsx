import type { RequestStatus } from '../types'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let label = 'Pending'
  let styleClass = styles.pending

  switch (status) {
    case 'answered':
      label = 'Answered'
      styleClass = styles.answered
      break
    case 'acknowledged':
      label = 'Acknowledged'
      styleClass = styles.acknowledged
      break
    case 'pending':
    default:
      label = 'Pending'
      styleClass = styles.pending
      break
  }

  return (
    <span
      className={`${styles.badge} ${styleClass} ${className ?? ''}`}
      data-testid={`status-badge-${status}`}
      data-status={status}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
