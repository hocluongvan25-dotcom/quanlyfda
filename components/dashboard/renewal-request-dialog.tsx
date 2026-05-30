'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface RenewalRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceId: string
  productName: string
}

export function RenewalRequestDialog({
  open,
  onOpenChange,
  serviceId,
  productName
}: RenewalRequestDialogProps) {
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do yêu cầu gia hạn')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Create a notification for admins
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          service_id: serviceId,
          title: `Yêu cầu gia hạn: ${productName}`,
          message: reason,
          notification_type: 'warning',
        })

      if (notifError) throw notifError

      // Also create an activity log
      await supabase
        .from('activity_logs')
        .insert({
          service_id: serviceId,
          user_id: user?.id,
          action: 'renewal_requested',
          details: { reason }
        })

      setReason('')
      onOpenChange(false)
    } catch (err) {
      console.error('[v0] Renewal request error:', err)
      setError('Đã xảy ra lỗi khi gửi yêu cầu gia hạn')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yêu cầu gia hạn hợp đồng</DialogTitle>
          <DialogDescription>
            Nhập lý do bạn muốn gia hạn dịch vụ <span className="font-semibold">{productName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex gap-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <Textarea
            placeholder="Ví dụ: Sản phẩm vẫn đang được bán tại thị trường, cần gia hạn hợp đồng để tiếp tục kinh doanh..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[120px]"
            disabled={isLoading}
          />

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !reason.trim()}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
