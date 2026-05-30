import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'
import { REMINDER_MILESTONES, daysUntil } from '@/lib/expiry'

// Daily cron that scans active services for FDA / US Agent registrations whose
// expiry is approaching and notifies the client along a fixed reminder
// schedule (lộ trình: 90, 60, 30, 14, 7, 1, 0 ngày + mốc tuỳ chỉnh của khách).
//
// Each reminder is recorded in activity_logs so it is only ever sent once per
// (service, type, expiry_date, milestone). Protected by CRON_SECRET.

export const dynamic = 'force-dynamic'

type ReminderType = 'fda' | 'us_agent'

const TYPE_LABEL: Record<ReminderType, string> = {
  fda: 'Đăng ký FDA',
  us_agent: 'US Agent',
}

const MAX_WINDOW_DAYS = Math.max(...REMINDER_MILESTONES)

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  // If no secret is configured, refuse rather than run unauthenticated.
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Pull services that have at least one expiry date set. We filter the precise
  // milestone match in JS below.
  const { data: services, error } = await supabase
    .from('services')
    .select(
      `id, product_name, client_id, fda_expiry_date, us_agent_expiry_date,
       client:profiles!services_client_id_fkey(id, email, full_name)`,
    )
    .or('fda_expiry_date.not.is.null,us_agent_expiry_date.not.is.null')

  if (error) {
    console.error('[v0] Cron: error fetching services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }

  if (!services || services.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0 })
  }

  // Load notification settings for all relevant clients so we can respect the
  // per-client custom reminder day and the email opt-out.
  const clientIds = Array.from(new Set(services.map((s) => s.client_id)))
  const { data: settingsRows } = await supabase
    .from('notification_settings')
    .select('user_id, email_renewal_reminders, reminder_days_before')
    .in('user_id', clientIds)

  const settingsMap = new Map(
    (settingsRows ?? []).map((row) => [row.user_id, row]),
  )

  // Existing reminder logs (for dedup) for these services.
  const serviceIds = services.map((s) => s.id)
  const { data: logRows } = await supabase
    .from('activity_logs')
    .select('service_id, details')
    .eq('action', 'expiry_reminder_sent')
    .in('service_id', serviceIds)

  const sentKeys = new Set(
    (logRows ?? []).map((row) => {
      const d = (row.details ?? {}) as Record<string, unknown>
      return `${row.service_id}:${d.type}:${d.expiry_date}:${d.milestone}`
    }),
  )

  let sent = 0

  for (const service of services) {
    const settings = settingsMap.get(service.client_id)
    const emailEnabled = settings?.email_renewal_reminders !== false
    const customMilestone = settings?.reminder_days_before
    const milestones = new Set<number>(REMINDER_MILESTONES)
    if (typeof customMilestone === 'number') milestones.add(customMilestone)

    const client = Array.isArray(service.client) ? service.client[0] : service.client

    const entries: { type: ReminderType; expiry: string | null }[] = [
      { type: 'fda', expiry: service.fda_expiry_date },
      { type: 'us_agent', expiry: service.us_agent_expiry_date },
    ]

    for (const { type, expiry } of entries) {
      if (!expiry) continue

      const left = daysUntil(expiry)
      // Only act within the reminder window (and not far in the past).
      if (left > MAX_WINDOW_DAYS || left < 0) continue
      if (!milestones.has(left)) continue

      const key = `${service.id}:${type}:${expiry}:${left}`
      if (sentKeys.has(key)) continue

      const label = TYPE_LABEL[type]
      const expiryLabel = formatDate(expiry)

      // 1. In-app notification for the client.
      await supabase.from('notifications').insert({
        user_id: service.client_id,
        service_id: service.id,
        title: `Sắp hết hạn ${label}: ${service.product_name}`,
        message:
          left === 0
            ? `${label} cho "${service.product_name}" hết hạn hôm nay (${expiryLabel}). Vui lòng gia hạn để tránh gián đoạn.`
            : `${label} cho "${service.product_name}" sẽ hết hạn sau ${left} ngày (${expiryLabel}).`,
        notification_type: left <= 7 ? 'error' : 'warning',
      })

      // 2. Email the client (if they have not opted out and have an email).
      if (emailEnabled && client?.email) {
        try {
          const template = emailTemplates.expiryReminder({
            productName: service.product_name,
            subjectLabel: label,
            expiryDateLabel: expiryLabel,
            daysLeft: left,
          })
          await sendEmail({
            to: client.email,
            subject: template.subject,
            html: template.html,
          })
        } catch (emailError) {
          console.error('[v0] Cron: error sending reminder email:', emailError)
          // Continue – the in-app notification still went out.
        }
      }

      // 3. Record the send so it is not repeated.
      await supabase.from('activity_logs').insert({
        service_id: service.id,
        user_id: service.client_id,
        action: 'expiry_reminder_sent',
        details: { type, expiry_date: expiry, milestone: left },
      })

      sentKeys.add(key)
      sent++
    }
  }

  return NextResponse.json({ processed: services.length, sent })
}
