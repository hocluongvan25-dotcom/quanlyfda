import { getDashboardStats, getServices, getNotifications, getUserRole } from '@/app/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus,
  ArrowRight,
  Bell,
  ShieldCheck
} from 'lucide-react'
import { getServiceTypeLabel, getStatusLabel, getStatusColor } from '@/lib/types'

export default async function DashboardPage() {
  const [stats, services, notifications, userRole] = await Promise.all([
    getDashboardStats(),
    getServices(),
    getNotifications(),
    getUserRole(),
  ])

  const recentServices = services.slice(0, 5)
  const unreadNotifications = notifications.filter((n: any) => !n.is_read).slice(0, 5)
  const canCreateRegistration = userRole?.canCreateRegistration || false

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tổng quan</h1>
          <p className="text-muted-foreground">Xem tổng quan về các dịch vụ đăng ký FDA của bạn</p>
        </div>
        {canCreateRegistration && (
          <Link href="/dashboard/services/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo yêu cầu mới
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng dịch vụ
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalServices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang xử lý
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.inProgressServices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hoàn thành
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.completedServices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sắp hết hạn
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.expiringServices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Dịch vụ gần đây</CardTitle>
              <CardDescription>Các yêu cầu đăng ký FDA mới nhất</CardDescription>
            </div>
            <Link href="/dashboard/services">
              <Button variant="ghost" size="sm">
                Xem tất cả
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentServices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {canCreateRegistration ? 'Chưa có dịch vụ nào' : 'Chưa có hồ sơ nào được gán cho bạn'}
                </p>
                {canCreateRegistration && (
                  <Link href="/dashboard/services/new">
                    <Button variant="outline" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Tạo yêu cầu đầu tiên
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentServices.map((service) => (
                  <Link
                    key={service.id}
                    href={`/dashboard/services/${service.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {service.product_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getServiceTypeLabel(service.service_type)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {getStatusLabel(service.status)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Thông báo</CardTitle>
              <CardDescription>Cập nhật mới nhất từ hệ thống</CardDescription>
            </div>
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="sm">
                Xem tất cả
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {unreadNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Không có thông báo mới</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notification.notification_type === 'warning' ? 'bg-yellow-500' :
                      notification.notification_type === 'success' ? 'bg-green-500' :
                      notification.notification_type === 'renewal_reminder' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Only show for admin/staff */}
      {canCreateRegistration && (
        <Card>
          <CardHeader>
            <CardTitle>Hành động nhanh</CardTitle>
            <CardDescription>Các thao tác thường dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/dashboard/services/new?type=food">
                <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-medium text-foreground">Đăng ký thực phẩm</h3>
                  <p className="text-sm text-muted-foreground">Food Facility Registration</p>
                </div>
              </Link>
              <Link href="/dashboard/services/new?type=cosmetic">
                <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-medium text-foreground">Đăng ký mỹ phẩm</h3>
                  <p className="text-sm text-muted-foreground">VCRP Registration</p>
                </div>
              </Link>
              <Link href="/dashboard/services/new?type=medical_device">
                <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-medium text-foreground">Thiết bị y tế</h3>
                  <p className="text-sm text-muted-foreground">Medical Device Registration</p>
                </div>
              </Link>
              <Link href="/dashboard/documents">
                <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-medium text-foreground">Quản lý tài liệu</h3>
                  <p className="text-sm text-muted-foreground">Xem và tải tài liệu</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
