import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCompletionEvents } from '@/app/actions/statistics'
import { StatisticsView } from '@/components/dashboard/statistics-view'

export default async function StatisticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // KPI statistics are an admin-only view.
  if (profile?.role !== 'admin') redirect('/dashboard')

  const currentYear = new Date().getFullYear()
  const events = await getCompletionEvents(currentYear)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Thống kê theo tháng</h1>
        <p className="text-muted-foreground">
          Số dịch vụ FDA hoàn tất &amp; bàn giao trong từng tháng và mức độ đạt KPI
        </p>
      </div>
      <StatisticsView initialYear={currentYear} initialEvents={events} />
    </div>
  )
}
