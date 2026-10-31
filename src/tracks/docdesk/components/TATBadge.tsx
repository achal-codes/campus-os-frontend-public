import { formatDateOnly, isOverdue } from '../utils/time'
import type { TATInfo } from '../types'

interface TATBadgeProps {
  tat?: TATInfo | null
}

export function TATBadge({ tat }: TATBadgeProps) {
  if (!tat?.expected_by) return null

  const overdue = isOverdue(tat.expected_by)

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid',
    backgroundColor: overdue ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-surface-muted)',
    color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
    borderColor: overdue ? 'rgba(239, 68, 68, 0.35)' : 'var(--color-border)',
    fontWeight: overdue ? 600 : 400,
  }

  return (
    <span style={style} data-testid="docdesk-tat-badge" title={tat.note ?? undefined}>
      <span>Expected by {formatDateOnly(tat.expected_by)}</span>
      {overdue && (
        <span
          style={{
            backgroundColor: 'var(--color-danger)',
            color: 'var(--color-on-primary)',
            padding: '1px 5px',
            borderRadius: '3px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Overdue
        </span>
      )}
    </span>
  )
}
