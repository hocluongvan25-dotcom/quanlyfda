'use server'

import { createClient } from '@/lib/supabase/server'
import type { ServiceType } from '@/lib/types'

// A single "service completed" event, derived from the activity log entry that
// moved a service into the `completion_handover` stage. This is the source of
// truth for monthly KPI counting (a service counts toward the month in which it
// was handed over / completed).
export interface CompletionEvent {
  service_id: string
  completed_at: string
  // Year/month are pre-computed on the server (UTC) so the client groups the
  // exact same way the server de-duplicated, avoiding timezone drift.
  year: number
  month: number // 1-12
  service_type: ServiceType
  product_name: string
  staff_name: string | null
}

// Fetch every completion event from December of the previous year through the
// end of the requested year. The extra December lets the client compare January
// against the immediately preceding month.
export async function getCompletionEvents(year: number): Promise<CompletionEvent[]> {
  const supabase = await createClient()

  // Admin-only data.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return []

  const start = `${year - 1}-12-01T00:00:00.000Z`
  const end = `${year + 1}-01-01T00:00:00.000Z`

  const { data, error } = await supabase
    .from('activity_logs')
    .select(
      `
      service_id,
      created_at,
      details,
      service:services!activity_logs_service_id_fkey(
        service_type,
        product_name,
        assigned_staff:profiles!services_assigned_staff_id_fkey(full_name, email)
      )
    `,
    )
    .eq('action', 'stage_updated')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[v0] Error fetching completion events:', error)
    return []
  }

  // Keep only logs that moved a service into "completion_handover", and count a
  // given service at most once per calendar month (a service can re-enter a
  // stage, but it should not inflate the KPI tally).
  const seen = new Set<string>()
  const events: CompletionEvent[] = []

  for (const row of data ?? []) {
    const details = row.details as Record<string, unknown> | null
    if (!details || details.new_stage !== 'completion_handover') continue

    const d = new Date(row.created_at)
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    const key = `${row.service_id}-${y}-${m}`
    if (seen.has(key)) continue
    seen.add(key)

    const svc = row.service as
      | {
          service_type?: ServiceType
          product_name?: string
          assigned_staff?: { full_name?: string | null; email?: string | null } | null
        }
      | null

    events.push({
      service_id: row.service_id,
      completed_at: row.created_at,
      year: y,
      month: m,
      service_type: (svc?.service_type ?? 'food') as ServiceType,
      product_name: svc?.product_name ?? 'N/A',
      staff_name: svc?.assigned_staff?.full_name ?? svc?.assigned_staff?.email ?? null,
    })
  }

  return events
}
