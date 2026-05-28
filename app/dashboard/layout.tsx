import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, roles(name, display_name)')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader user={user} profile={profile} />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
