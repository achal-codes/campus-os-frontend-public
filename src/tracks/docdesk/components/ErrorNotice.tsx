import styles from './ErrorNotice.module.css'

interface ErrorNoticeProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorNotice({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  className,
}: ErrorNoticeProps) {
  return (
    <div role="alert" className={`${styles.alert} ${className ?? ''}`} data-testid="docdesk-error-notice">
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={styles.retryBtn} data-testid="docdesk-retry-button">
          {retryLabel}
        </button>
      )}
    </div>
  )
}

