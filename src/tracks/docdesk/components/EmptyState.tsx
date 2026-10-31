import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  className?: string
  testId?: string
}

export function EmptyState({ title, description, action, className, testId }: EmptyStateProps) {
  return (
    <div className={`${styles.container} ${className ?? ''}`} data-testid={testId ?? 'docdesk-empty-state'}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
