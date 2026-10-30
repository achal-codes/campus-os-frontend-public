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
    gap: '4px',
    fontSize: 'var(--text-xs)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    backgroundColor: overdue ? 'rgba(198, 40, 40, 0.1)' : 'var(--color-surface-muted)',
    color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
    borderColor: overdue ? 'var(--color-danger)' : 'var(--color-border)',
  }

  return (
    <span style={style} data-testid="docdesk-tat-badge" title={tat.note ?? undefined}>
      <span>📅</span>
      <span>{formatDateOnly(tat.expected_by)}</span>
      {overdue && <span style={{ fontWeight: 'var(--weight-bold)' }}>(Overdue)</span>}
    </span>
  )
}
