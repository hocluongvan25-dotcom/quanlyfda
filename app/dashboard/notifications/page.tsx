import { getNotifications } from '@/app/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Info, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { MarkAllReadButton } from '@/components/dashboard/mark-all-read-button'

export default async function NotificationsPage() {
  const notifications = await getNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'renewal_reminder':
        return <Clock className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `Bạn có ${unreadCount} thông báo chưa đọc` 
              : 'Tất cả thông báo đã được đọc'}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Tất cả thông báo</CardTitle>
          <CardDescription>Cập nhật từ hệ thống và dịch vụ của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Không có thông báo
              </h3>
              <p className="text-muted-foreground">
                Bạn sẽ nhận được thông báo khi có cập nhật mới
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    notification.is_read
                      ? 'border-border bg-background'
                      : 'border-primary/20 bg-primary/5'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {notification.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
