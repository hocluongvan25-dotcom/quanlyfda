'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Trash2 } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
}

export function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      const supabase = createClient()
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setNotifications(data || [])
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
  }

  if (notifications.length === 0) {
    return (
      <Empty
        icon="Bell"
        title="Không có thông báo nào"
        description="Bạn sẽ nhận được thông báo về tiến độ và gia hạn"
      />
    )
  }

  const getNotificationBadge = (type: string) => {
    const typeMap: Record<string, { variant: any; label: string }> = {
      info: { variant: 'default', label: 'Thông tin' },
      warning: { variant: 'destructive', label: 'Cảnh báo' },
      success: { variant: 'default', label: 'Thành công' },
      renewal_reminder: { variant: 'secondary', label: 'Nhắc nhở gia hạn' },
    }
    const config = typeMap[type] || typeMap['info']
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  return (
    <div className="space-y-4">
      {notifications.map((notif) => (
        <Card
          key={notif.id}
          className={`${!notif.is_read ? 'border-primary/50 bg-primary/5' : ''} hover:shadow-md transition-shadow`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">{notif.title}</CardTitle>
                  {getNotificationBadge(notif.notification_type)}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{notif.message}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {new Date(notif.created_at).toLocaleDateString('vi-VN')} lúc{' '}
                {new Date(notif.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="flex gap-2">
                {!notif.is_read && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsRead(notif.id)}
                  >
                    Đánh dấu đã đọc
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNotification(notif.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
