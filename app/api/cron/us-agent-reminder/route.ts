/**
 * Cron endpoint: POST /api/cron/us-agent-reminder
 *
 * Should be called once daily (e.g. via Vercel Cron or an external scheduler).
 * Queries all active services that have a us_agent_expiry_date, then sends
 * reminder emails to the client at the following thresholds before expiry:
 *   30 days | 14 days | 7 days | 3 days | 0 days (expiry day)
 *
 * Protected by CRON_SECRET environment variable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/email'
import { US_AGENT_REMINDER_DAYS } from '@/lib/fda-utils'

export async function GET(request: NextRequest) {
  // Verify the cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch all services with a US Agent expiry date that have a linked client email
  const { data: services, error } = await supabase
    .from('services')
    .select(`
      id,
      product_name,
      us_agent_name,
      us_agent_expiry_date,
      client:profiles!services_client_id_fkey(
        email,
        full_name
      )
    `)
    .not('us_agent_expiry_date', 'is', null)
    .not('us_agent_name', 'is', null)

  if (error) {
    console.error('[v0] cron/us-agent-reminder: DB error', error)
    return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const results: Array<{
    serviceId: string
    productName: string
    daysLeft: number
    sent: boolean
    reason?: string
  }> = []

  for (const service of services ?? []) {
    const clientEmail = (service.client as { email: string; full_name: string | null } | null)?.email
    const clientName = (service.client as { email: string; full_name: string | null } | null)?.full_name

    if (!clientEmail || !service.us_agent_expiry_date || !service.us_agent_name) continue

    const expiryDate = new Date(service.us_agent_expiry_date)
    expiryDate.setHours(0, 0, 0, 0)

    const diffMs = expiryDate.getTime() - today.getTime()
    const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24))

    // Only send on specific threshold days; skip if already past expiry
    if (!US_AGENT_REMINDER_DAYS.includes(daysLeft as typeof US_AGENT_REMINDER_DAYS[number])) {
      continue
    }

    try {
      const template = emailTemplates.usAgentRenewalReminder({
        productName: service.product_name,
        clientName: clientName,
        usAgentName: service.us_agent_name,
        expiryDate: service.us_agent_expiry_date,
        daysLeft,
      })

      await sendEmail({
        to: clientEmail,
        subject: template.subject,
        html: template.html,
      })

      // Log the reminder in activity_logs for audit trail
      await supabase.from('activity_logs').insert({
        service_id: service.id,
        user_id: null, // system-generated
        action: 'us_agent_reminder_sent',
        details: {
          days_left: daysLeft,
          client_email: clientEmail,
          expiry_date: service.us_agent_expiry_date,
        },
      })

      results.push({ serviceId: service.id, productName: service.product_name, daysLeft, sent: true })
    } catch (emailErr) {
      console.error('[v0] cron/us-agent-reminder: failed to send email for service', service.id, emailErr)
      results.push({
        serviceId: service.id,
        productName: service.product_name,
        daysLeft,
        sent: false,
        reason: emailErr instanceof Error ? emailErr.message : 'Unknown error',
      })
    }
  }

  console.log('[v0] cron/us-agent-reminder: processed', results.length, 'reminder(s)')

  return NextResponse.json({
    success: true,
    date: today.toISOString().split('T')[0],
    processed: results.length,
    results,
  })
}
