import { KanbanBoard } from '@/components/dashboard/kanban-board'
import { CreateServiceDialog } from '@/components/dashboard/create-service-dialog'

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline Dịch vụ</h1>
          <p className="text-muted-foreground">
            Theo dõi và quản lý tiến độ các dịch vụ đăng ký FDA theo từng giai đoạn
          </p>
        </div>
        <CreateServiceDialog />
      </div>
      <KanbanBoard />
    </div>
  )
}
