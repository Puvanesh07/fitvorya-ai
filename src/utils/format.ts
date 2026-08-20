/** Format a date string (YYYY-MM-DD) to a readable label like "Aug 20" */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Format a full ISO date to "Aug 20, 2026" */
export function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Today as YYYY-MM-DD in the user's LOCAL timezone.
 * Never use `new Date().toISOString()` for calendar dates — it returns UTC and
 * will roll over to the next day several hours before local midnight for users
 * west of UTC (all of the Americas, etc.).
 */
export function localTodayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * @deprecated Use localTodayISO() instead — this returns UTC midnight which
 * is wrong for users west of UTC. Kept for backward compat until all call
 * sites are migrated.
 */
export function todayISO(): string {
  return localTodayISO()
}

/** Format a local Date object to YYYY-MM-DD */
export function dateToISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
