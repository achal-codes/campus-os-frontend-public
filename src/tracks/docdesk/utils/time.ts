const IST_TZ = 'Asia/Kolkata'

/** Format a UTC ISO timestamp for display in IST */
export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TZ,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/** Format a UTC ISO timestamp as date-only in IST */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TZ,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/** Format a date-only string (YYYY-MM-DD) or ISO timestamp for display — no timezone shift */
export function formatDateOnly(dateStr: string): string {
  try {
    const cleanDate = dateStr.includes('T') ? dateStr.slice(0, 10) : dateStr
    const parts = cleanDate.split('-').map(Number)
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return formatDate(dateStr)
    }
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(parts[0], parts[1] - 1, parts[2]))
  } catch {
    return dateStr
  }
}

/** Get today's date in IST as YYYY-MM-DD */
export function todayIST(): string {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return parts // en-CA produces YYYY-MM-DD
}

/** Add N days to today's date in IST as YYYY-MM-DD */
export function addDaysIST(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** Check if a YYYY-MM-DD date is strictly before today in IST */
export function isOverdue(dateStr: string): boolean {
  return dateStr < todayIST()
}

/** Relative time label */
export function relativeTime(iso: string): string {
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
