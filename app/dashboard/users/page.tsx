import { UsersManagement } from '@/components/dashboard/users-management'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý Người dùng</h1>
        <p className="text-muted-foreground">
          Quản lý tài khoản khách hàng và nhân viên, phân quyền truy cập hệ thống
        </p>
      </div>
      <UsersManagement />
    </div>
  )
}
