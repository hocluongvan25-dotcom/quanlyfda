import { DashboardOverview } from '@/components/dashboard/overview'
import { CreateServiceDialog } from '@/components/dashboard/create-service-dialog'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Theo dõi tiến độ đăng ký FDA và quản lý dịch vụ của bạn
          </p>
        </div>
        <CreateServiceDialog />
      </div>
      <DashboardOverview />
    </div>
  )
}
