// CampusOS DocDesk Time and Date Utilities
// Mandate: Display and input as DD/MM/YYYY; store and transmit as ISO YYYY-MM-DD.

const IST_TZ_OFFSET_MS = 5.5 * 60 * 60 * 1000 // UTC+5:30 in milliseconds

/** Check if year is a leap year (Gregorian) */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Format a date-only (YYYY-MM-DD) or UTC ISO timestamp for display as DD/MM/YYYY.
 * Date-only values are formatted directly by string splitting without ANY timezone shifts.
 * Timestamp values (with time) are converted to IST (+5:30) with explicit zero-padding.
 */
export function formatDate(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return ''

  // Date-only string (e.g. "2026-10-31" or "2026-10-31...")
  if (typeof isoOrDate === 'string') {
    const trimmed = isoOrDate.trim()
    // Exact YYYY-MM-DD date-only
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-')
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
    }
  }

  try {
    const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
    if (isNaN(date.getTime())) return typeof isoOrDate === 'string' ? isoOrDate : ''

    // Explicitly compute IST (+5:30) UTC representation to prevent browser locale/system TZ shifts
    const istTime = new Date(date.getTime() + IST_TZ_OFFSET_MS)
    const d = String(istTime.getUTCDate()).padStart(2, '0')
    const m = String(istTime.getUTCMonth() + 1).padStart(2, '0')
    const y = String(istTime.getUTCFullYear())
    return `${d}/${m}/${y}`
  } catch {
    return typeof isoOrDate === 'string' ? isoOrDate : ''
  }
}

/** Alias for formatDate for date-only values */
export const formatDateOnly = formatDate

/**
 * Convert ISO YYYY-MM-DD to DD/MM/YYYY directly.
 */
export function formatISOToDDMMYYYY(iso: string): string {
  if (!iso) return ''
  const clean = iso.includes('T') ? iso.slice(0, 10) : iso
  const parts = clean.split('-')
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`
  }
  return iso
}

/**
 * Format a UTC ISO timestamp for display in IST as 24-hour "DD/MM/YYYY, HH:mm".
 */
export function formatDateTime(iso: string): string {
  if (!iso) return ''
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return iso

    const istTime = new Date(date.getTime() + IST_TZ_OFFSET_MS)
    const d = String(istTime.getUTCDate()).padStart(2, '0')
    const m = String(istTime.getUTCMonth() + 1).padStart(2, '0')
    const y = String(istTime.getUTCFullYear())
    const hh = String(istTime.getUTCHours()).padStart(2, '0')
    const mm = String(istTime.getUTCMinutes()).padStart(2, '0')

    return `${d}/${m}/${y}, ${hh}:${mm}`
  } catch {
    return iso
  }
}

/**
 * Parse a user-entered "DD/MM/YYYY" string into ISO "YYYY-MM-DD".
 * Performs strict calendar validation:
 * - Requires 4-digit year.
 * - Validates month between 1 and 12.
 * - Validates day against actual month length (accounting for leap years in Feb).
 * - Rejects invalid calendar dates (e.g. 31/02/2026, 00/10/2026, 10/31/2026).
 * Returns ISO "YYYY-MM-DD" or null if invalid.
 */
export function parseDDMMYYYY(text: string): string | null {
  if (!text || typeof text !== 'string') return null
  const trimmed = text.trim()
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)

  if (year < 1000 || year > 9999) return null
  if (month < 1 || month > 12) return null
  if (day < 1) return null

  const daysInMonth = [0, 31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (day > daysInMonth[month]) return null

  const yStr = String(year).padStart(4, '0')
  const mStr = String(month).padStart(2, '0')
  const dStr = String(day).padStart(2, '0')
  return `${yStr}-${mStr}-${dStr}`
}

/**
 * Get today's date in IST as ISO YYYY-MM-DD.
 */
export function todayIST(): string {
  const now = new Date()
  const istTime = new Date(now.getTime() + IST_TZ_OFFSET_MS)
  const y = istTime.getUTCFullYear()
  const m = String(istTime.getUTCMonth() + 1).padStart(2, '0')
  const d = String(istTime.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Add N days to an ISO date (or today in IST) without timezone shifts.
 * Returns ISO "YYYY-MM-DD".
 */
export function addDays(baseIsoOrDays: string | number, n?: number): string {
  let baseIso: string
  let daysToAdd: number

  if (typeof baseIsoOrDays === 'number') {
    daysToAdd = baseIsoOrDays
    baseIso = todayIST()
  } else {
    baseIso = baseIsoOrDays || todayIST()
    daysToAdd = n ?? 0
  }

  const clean = baseIso.includes('T') ? baseIso.slice(0, 10) : baseIso
  const [y, m, d] = clean.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + daysToAdd)

  const resY = date.getUTCFullYear()
  const resM = String(date.getUTCMonth() + 1).padStart(2, '0')
  const resD = String(date.getUTCDate()).padStart(2, '0')
  return `${resY}-${resM}-${resD}`
}

/** Backwards-compatible alias for addDays */
export const addDaysIST = (days: number) => addDays(todayIST(), days)

/**
 * Check if a YYYY-MM-DD date is strictly before today in IST.
 */
export function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false
  const clean = dateStr.includes('T') ? dateStr.slice(0, 10) : dateStr
  return clean < todayIST()
}

/**
 * Relative time label (e.g., "Just now", "5m ago", "2h ago", "3d ago", or "DD/MM/YYYY").
 */
export function relativeTime(iso: string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}
