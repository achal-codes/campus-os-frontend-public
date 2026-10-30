import type { RequestStatus } from '../types'
import styles from './LifecycleStrip.module.css'

interface LifecycleStripProps {
  status: RequestStatus
}

export function LifecycleStrip({ status }: LifecycleStripProps) {
  const isSubmitted = true
  const isAnswered = status === 'answered' || status === 'acknowledged'
  const isAcknowledged = status === 'acknowledged'

  return (
    <div className={styles.strip} aria-label="Request lifecycle progress" data-testid="lifecycle-strip">
      <div className={`${styles.step} ${isSubmitted ? (status === 'pending' ? styles.stepActive : styles.stepCompleted) : ''}`}>
        <span>{status === 'pending' ? '●' : '✓'}</span>
        <span>Submitted</span>
      </div>

      <span className={styles.arrow} aria-hidden="true">→</span>

      <div className={`${styles.step} ${isAnswered ? (status === 'answered' ? styles.stepActive : styles.stepCompleted) : ''}`}>
        <span>{status === 'answered' ? '●' : isAcknowledged ? '✓' : '○'}</span>
        <span>Answered</span>
      </div>

      <span className={styles.arrow} aria-hidden="true">→</span>

      <div className={`${styles.step} ${isAcknowledged ? styles.stepCompleted : ''}`}>
        <span>{isAcknowledged ? '✓' : '○'}</span>
        <span>Acknowledged</span>
      </div>
    </div>
  )
}
