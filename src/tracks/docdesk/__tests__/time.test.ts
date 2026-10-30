import { describe, expect, it } from 'vitest'
import { formatDate, formatDateOnly, formatDateTime, isOverdue, todayIST } from '../utils/time'

describe('time and IST formatting utilities', () => {
  it('formats UTC ISO timestamps for IST correctly', () => {
    // 2026-10-30T10:00:00Z is 15:30 in IST (+5:30)
    const iso = '2026-10-30T10:00:00Z'
    const formatted = formatDateTime(iso)
    expect(formatted).toContain('30')
    expect(formatted).toContain('Oct')
    expect(formatted).toContain('2026')
    expect(formatted).toContain('3:30')
  })

  it('formats date-only strings without timezone shift', () => {
    expect(formatDateOnly('2026-11-15')).toContain('15')
    expect(formatDateOnly('2026-11-15')).toContain('Nov')
    expect(formatDateOnly('2026-11-15')).toContain('2026')
  })

  it('generates today in IST in YYYY-MM-DD format', () => {
    const today = todayIST()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('accurately identifies overdue dates against today in IST', () => {
    expect(isOverdue('2020-01-01')).toBe(true)
    expect(isOverdue('2099-12-31')).toBe(false)
  })

  it('formats date string reliably', () => {
    const res = formatDate('2026-10-30T00:00:00Z')
    expect(res).toBeTruthy()
  })
})
