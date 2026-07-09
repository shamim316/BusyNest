const DAY_MS = 86_400_000

/** Today as a YYYY-MM-DD string in the user's local timezone. */
export function todayStr(): string {
  return toDateStr(new Date())
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse a YYYY-MM-DD string as a local date at midnight. */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / DAY_MS)
}

export function formatDate(s: string | null, opts?: { withYear?: boolean }): string {
  if (!s) return ''
  const d = parseDate(s)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(opts?.withYear || !sameYear ? { year: 'numeric' } : {}),
  })
}

export function formatDateLong(s: string): string {
  return parseDate(s).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Human-friendly due label: Today, Tomorrow, 3d overdue, Mar 14 … */
export function dueLabel(s: string | null): { text: string; tone: 'overdue' | 'today' | 'soon' | 'normal' } | null {
  if (!s) return null
  const today = todayStr()
  const d = diffDays(today, s)
  if (d < 0) return { text: `${-d}d overdue`, tone: 'overdue' }
  if (d === 0) return { text: 'Today', tone: 'today' }
  if (d === 1) return { text: 'Tomorrow', tone: 'soon' }
  if (d <= 7) return { text: formatDate(s), tone: 'soon' }
  return { text: formatDate(s), tone: 'normal' }
}
