// Shared helpers for FDA / US Agent expiry handling.
//
// Registrations are valid for 12 months, so once a US Agent is confirmed or an
// FDA code is issued we derive the expiry date automatically. The reminder
// milestones below define the "lộ trình" used by the daily cron job to notify
// clients as an expiry approaches.

// Default reminder milestones (in days before expiry). The cron runs daily and
// fires a reminder when the remaining days exactly matches one of these.
export const REMINDER_MILESTONES = [90, 60, 30, 14, 7, 1, 0] as const

// How long a registration / US Agent assignment is valid, in months.
export const REGISTRATION_VALIDITY_MONTHS = 12

// Add `months` to a date and return an ISO date string (YYYY-MM-DD). Uses UTC
// so the result is stable regardless of the server timezone. Handles month
// overflow (e.g. Jan 31 + 1 month -> Feb 28/29).
export function addMonths(date: Date | string, months: number): string {
  const base = typeof date === 'string' ? new Date(date) : new Date(date.getTime())
  const day = base.getUTCDate()
  const result = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, 1),
  )
  // Clamp the day to the last valid day of the target month.
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate()
  result.setUTCDate(Math.min(day, lastDay))
  return result.toISOString().slice(0, 10)
}

// Today's date as an ISO date string (YYYY-MM-DD), in UTC.
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// Whole days from today until `expiry`. Negative means already expired.
export function daysUntil(expiry: string | Date): number {
  const expiryDate = typeof expiry === 'string' ? new Date(expiry) : expiry
  const startOfToday = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  )
  const startOfExpiry = Date.UTC(
    expiryDate.getUTCFullYear(),
    expiryDate.getUTCMonth(),
    expiryDate.getUTCDate(),
  )
  return Math.round((startOfExpiry - startOfToday) / (1000 * 60 * 60 * 24))
}
