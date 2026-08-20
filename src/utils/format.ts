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

/** Today as YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
