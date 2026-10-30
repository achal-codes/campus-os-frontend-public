import type { RequestStatus, TATInfo } from '../types'
import { formatDateOnly, isOverdue } from '../utils/time'
import styles from './LifecycleStrip.module.css'

interface LifecycleStripProps {
  status: RequestStatus
  submittedAt?: string
  answeredAt?: string
  acknowledgedAt?: string
  tat?: TATInfo | null
}

export function LifecycleStrip({
  status,
  submittedAt,
  answeredAt,
  acknowledgedAt,
  tat,
}: LifecycleStripProps) {
  const isPending = status === 'pending'
  const isAnswered = status === 'answered'
  const isAcknowledged = status === 'acknowledged'

  const overdue = Boolean(tat?.expected_by && isOverdue(tat.expected_by) && isPending)

  return (
    <div className={styles.container} aria-label="Request lifecycle progress" data-testid="lifecycle-strip">
      <div className={styles.strip}>
        {/* Step 1: Submitted */}
        <div className={`${styles.step} ${isPending ? styles.stepActive : styles.stepCompleted}`}>
          <div className={styles.stepHeader}>
            <span>{isPending ? '●' : '✓'}</span>
            <span>Submitted</span>
          </div>
          {submittedAt && <span className={styles.stepDate}>{formatDateOnly(submittedAt)}</span>}
        </div>

        <span className={styles.arrow} aria-hidden="true">──▶</span>

        {/* Step 2: Answered */}
        <div className={`${styles.step} ${isAnswered ? styles.stepActive : isAcknowledged ? styles.stepCompleted : ''}`}>
          <div className={styles.stepHeader}>
            <span>{isAnswered ? '●' : isAcknowledged ? '✓' : '○'}</span>
            <span>Answered</span>
          </div>
          <span className={styles.stepDate}>
            {answeredAt ? formatDateOnly(answeredAt) : isAnswered || isAcknowledged ? 'Done' : '—'}
          </span>
        </div>

        <span className={styles.arrow} aria-hidden="true">──▶</span>

        {/* Step 3: Acknowledged */}
        <div className={`${styles.step} ${isAcknowledged ? styles.stepCompleted : ''}`}>
          <div className={styles.stepHeader}>
            <span>{isAcknowledged ? '✓' : '○'}</span>
            <span>Acknowledged</span>
          </div>
          <span className={styles.stepDate}>
            {acknowledgedAt ? formatDateOnly(acknowledgedAt) : isAcknowledged ? 'Done' : '—'}
          </span>
        </div>
      </div>

      {/* TAT line if set (§3.8) */}
      {tat?.expected_by && (
        <div className={styles.tatLine}>
          Expected by {formatDateOnly(tat.expected_by)}
          {tat.note ? ` · ${tat.note}` : ''}
          {overdue && <span className={styles.overdueText}> · Overdue</span>}
        </div>
      )}
    </div>
  )
}
