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
    backgroundColor: overdue ? '#fee2e2' : '#f8fafc',
    color: overdue ? '#dc2626' : '#64748b',
    borderColor: overdue ? '#fca5a5' : '#e2e8f0',
    fontWeight: overdue ? 600 : 400,
  }

  return (
    <span style={style} data-testid="docdesk-tat-badge" title={tat.note ?? undefined}>
      <span>Expected by {formatDateOnly(tat.expected_by)}</span>
      {overdue && (
        <span
          style={{
            backgroundColor: '#dc2626',
            color: '#ffffff',
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
