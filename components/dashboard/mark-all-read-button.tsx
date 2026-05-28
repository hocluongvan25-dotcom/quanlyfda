'use client'

import { Button } from '@/components/ui/button'
import { CheckCheck } from 'lucide-react'
import { markAllNotificationsAsRead } from '@/app/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MarkAllReadButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await markAllNotificationsAsRead()
      router.refresh()
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isLoading}>
      <CheckCheck className="mr-2 h-4 w-4" />
      {isLoading ? 'Đang xử lý...' : 'Đánh dấu đã đọc tất cả'}
    </Button>
  )
}
