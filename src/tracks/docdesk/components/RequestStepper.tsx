import type { DocRequest } from '../types'
import { formatDate, formatDateOnly, isOverdue } from '../utils/time'
import styles from './RequestStepper.module.css'

interface RequestStepperProps {
  request: DocRequest
}

export function RequestStepper({ request }: RequestStepperProps) {
  const isSubmittedDone = request.status === 'answered' || request.status === 'acknowledged'
  const isSubmittedCurrent = request.status === 'pending'

  const isAnsweredDone = request.status === 'acknowledged'
  const isAnsweredCurrent = request.status === 'answered'

  const isAckDone = request.status === 'acknowledged'

  // Completion percentage for connector line
  let fillPercent = '0%'
  if (request.status === 'answered') fillPercent = '50%'
  if (request.status === 'acknowledged') fillPercent = '100%'

  const hasTAT = Boolean(request.tat?.expected_by)
  const overdue = Boolean(hasTAT && request.status === 'pending' && isOverdue(request.tat!.expected_by))

  return (
    <div className={styles.card} data-testid="request-stepper">
      <div className={styles.stepper}>
        <div className={styles.connector} aria-hidden="true">
          <div className={styles.connectorFill} style={{ width: fillPercent }} />
        </div>

        {/* Step 1: Submitted */}
        <div className={styles.step}>
          <div
            className={[
              styles.indicator,
              isSubmittedDone ? styles.doneIndicator : styles.currentIndicator,
            ].join(' ')}
          >
            {isSubmittedDone ? <span className={styles.doneDot} /> : <span className={styles.currentDot} />}
          </div>
          <div className={[styles.label, isSubmittedCurrent ? styles.activeLabel : ''].join(' ')}>
            Submitted
          </div>
          <div className={styles.date}>
            {formatDate(request.created_at)}
          </div>
        </div>

        {/* Step 2: Answered */}
        <div className={styles.step}>
          <div
            className={[
              styles.indicator,
              isAnsweredDone
                ? styles.doneIndicator
                : isAnsweredCurrent
                  ? styles.currentIndicator
                  : styles.todoIndicator,
            ].join(' ')}
          >
            {isAnsweredDone ? (
              <span className={styles.doneDot} />
            ) : isAnsweredCurrent ? (
              <span className={styles.currentDot} />
            ) : null}
          </div>
          <div
            className={[
              styles.label,
              isAnsweredCurrent ? styles.activeLabel : isAnsweredDone ? '' : styles.mutedLabel,
            ].join(' ')}
          >
            Answered
          </div>
          <div className={styles.date}>
            {request.answer?.answered_at ? formatDate(request.answer.answered_at) : isSubmittedDone ? 'Completed' : '—'}
          </div>
        </div>

        {/* Step 3: Acknowledged */}
        <div className={styles.step}>
          <div
            className={[
              styles.indicator,
              isAckDone ? styles.doneIndicator : styles.todoIndicator,
            ].join(' ')}
          >
            {isAckDone ? <span className={styles.doneDot} /> : null}
          </div>
          <div
            className={[
              styles.label,
              isAckDone ? styles.activeLabel : styles.mutedLabel,
            ].join(' ')}
          >
            Acknowledged
          </div>
          <div className={styles.date}>
            {isAckDone ? formatDate(request.updated_at) : '—'}
          </div>
        </div>
      </div>

      {hasTAT && (
        <div className={styles.tatLine}>
          <span>Turnaround Target:</span>
          <span className={styles.tatText}>
            Expected by {formatDateOnly(request.tat!.expected_by)}
            {request.tat!.note ? ` · ${request.tat!.note}` : ''}
          </span>
          {overdue && <span className={styles.overdueBadge}>Overdue</span>}
        </div>
      )}
    </div>
  )
}

