/**
 * FDA Renewal Utility Functions
 *
 * FDA registration must be renewed once at the end of every even-numbered year,
 * regardless of when the original registration was issued.
 *
 * Rules:
 * - Renewal window: Oct 1 – Dec 31 of every even-numbered year (2026, 2028, 2030, …)
 * - If registered in an even year (e.g. 2026), the FIRST renewal is still at end of
 *   that same year (end of 2026), then end of 2028, end of 2030, etc.
 * - If registered in an odd year (e.g. 2025), the first renewal is end of the next
 *   even year (end of 2026), then end of 2028, etc.
 *
 * "End of year" for our purposes = Dec 31 of that year.
 */

/**
 * Given a registration date (ISO string or Date), return the next FDA renewal
 * deadline as a Date (Dec 31 of the next relevant even year).
 */
export function getNextFdaRenewalDate(issueDateStr: string): Date {
  const issueDate = new Date(issueDateStr)
  const issueYear = issueDate.getFullYear()

  // The renewal always falls on Dec 31 of an even year.
  // Find the first even year that is >= issueYear.
  let renewalYear = issueYear % 2 === 0 ? issueYear : issueYear + 1

  // Dec 31 of that renewal year
  const renewalDate = new Date(renewalYear, 11, 31) // month is 0-indexed

  // If today is already past that renewal date, advance to the next even year.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (today > renewalDate) {
    renewalYear += 2
    return new Date(renewalYear, 11, 31)
  }

  return renewalDate
}

/**
 * Returns true if FDA registration fee should be waived because the US Agent
 * service is still active (expiry date is in the future).
 */
export function isFdaRenewalFree(usAgentExpiryDateStr: string | null | undefined): boolean {
  if (!usAgentExpiryDateStr) return false
  const expiryDate = new Date(usAgentExpiryDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return expiryDate >= today
}

/**
 * Return a human-readable label for how many days until the next FDA renewal.
 * e.g. "còn 45 ngày" | "hôm nay" | "đã quá hạn"
 */
export function fdaRenewalCountdown(issueDateStr: string): string {
  const nextRenewal = getNextFdaRenewalDate(issueDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((nextRenewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return 'Đã quá hạn gia hạn'
  if (diff === 0) return 'Hôm nay là hạn gia hạn'
  if (diff <= 90) return `Còn ${diff} ngày`
  return nextRenewal.toLocaleDateString('vi-VN')
}

/**
 * US Agent reminder thresholds in days before expiry.
 * Cron job checks these daily.
 */
export const US_AGENT_REMINDER_DAYS = [30, 14, 7, 3, 0] as const
