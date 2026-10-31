import { describe, expect, it } from 'vitest'
import {
  addDays,
  addDaysIST,
  formatDate,
  formatDateOnly,
  formatDateTime,
  formatISOToDDMMYYYY,
  isOverdue,
  parseDDMMYYYY,
  todayIST,
} from '../utils/time'

describe('time and date utilities (DD/MM/YYYY mandate)', () => {
  it('1. formatDate("2026-10-31") === "31/10/2026" without timezone drift', () => {
    expect(formatDate('2026-10-31')).toBe('31/10/2026')
    expect(formatDateOnly('2026-11-15')).toBe('15/11/2026')
    expect(formatISOToDDMMYYYY('2026-05-09')).toBe('09/05/2026')
  })

  it('formats UTC ISO timestamp into IST (UTC+5:30) as 24-hour DD/MM/YYYY, HH:mm', () => {
    // 2026-10-30T10:00:00Z in UTC is 15:30 in IST (+5:30)
    const iso = '2026-10-30T10:00:00Z'
    expect(formatDateTime(iso)).toBe('30/10/2026, 15:30')
    expect(formatDate(iso)).toBe('30/10/2026')
  })

  it('2. parseDDMMYYYY strict calendar validation', () => {
    // Valid calendar dates
    expect(parseDDMMYYYY('31/10/2026')).toBe('2026-10-31')
    expect(parseDDMMYYYY('01/01/2026')).toBe('2026-01-01')
    expect(parseDDMMYYYY('29/02/2024')).toBe('2024-02-29') // Leap year

    // Invalid calendar dates rejected
    expect(parseDDMMYYYY('10/31/2026')).toBeNull() // MM/DD/YYYY rejected
    expect(parseDDMMYYYY('31/02/2026')).toBeNull() // Feb 31 rejected
    expect(parseDDMMYYYY('29/02/2025')).toBeNull() // Non-leap year Feb 29 rejected
    expect(parseDDMMYYYY('00/10/2026')).toBeNull() // Day 0 rejected
    expect(parseDDMMYYYY('32/01/2026')).toBeNull() // Day 32 rejected
    expect(parseDDMMYYYY('15/13/2026')).toBeNull() // Month 13 rejected
    expect(parseDDMMYYYY('1/1/26')).toBeNull() // Short format rejected
    expect(parseDDMMYYYY('')).toBeNull() // Empty rejected
    expect(parseDDMMYYYY('letters')).toBeNull() // Non-digits rejected
    expect(parseDDMMYYYY('31-10-2026')).toBeNull() // Wrong delimiter rejected
  })

  it('adds days without timezone shifts across month and year boundaries', () => {
    expect(addDays('2026-10-31', 3)).toBe('2026-11-03')
    expect(addDays('2026-10-31', 7)).toBe('2026-11-07')
    expect(addDays('2026-10-31', 14)).toBe('2026-11-14')
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDaysIST(3)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('generates today in IST in YYYY-MM-DD format', () => {
    const today = todayIST()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('accurately identifies overdue dates against today in IST', () => {
    expect(isOverdue('2020-01-01')).toBe(true)
    expect(isOverdue('2099-12-31')).toBe(false)
  })
})
