'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Shield, User } from 'lucide-react'
import { updateService } from '@/app/actions/services'
import type { Service } from '@/lib/types'

interface ServiceInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceId: string
  productName: string
  service: Service
  onSuccess: (updated: Partial<Service>) => void
}

// Trim a possible ISO timestamp down to yyyy-mm-dd for <input type="date">
function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

export function ServiceInfoDialog({
  open,
  onOpenChange,
  serviceId,
  productName,
  service,
  onSuccess,
}: ServiceInfoDialogProps) {
  const [fdaCode, setFdaCode] = useState('')
  const [fdaIssueDate, setFdaIssueDate] = useState('')
  const [fdaExpiryDate, setFdaExpiryDate] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentExpiryDate, setAgentExpiryDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form to current service values each time the dialog opens
  useEffect(() => {
    if (open) {
      setFdaCode(service.fda_code ?? '')
      setFdaIssueDate(toDateInputValue(service.fda_issue_date))
      setFdaExpiryDate(toDateInputValue(service.fda_expiry_date))
      setAgentName(service.us_agent_name ?? '')
      setAgentExpiryDate(toDateInputValue(service.us_agent_expiry_date))
      setError('')
    }
  }, [open, service])

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload: Partial<Service> = {
        fda_code: fdaCode.trim() || null,
        fda_issue_date: fdaIssueDate || null,
        fda_expiry_date: fdaExpiryDate || null,
        us_agent_name: agentName.trim() || null,
        us_agent_expiry_date: agentExpiryDate || null,
      }

      await updateService(serviceId, payload)
      onSuccess(payload)
      onOpenChange(false)
    } catch (err) {
      console.error('[v0] Update FDA registration error:', err)
      setError('Đã xảy ra lỗi khi lưu thông tin. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng ký FDA</DialogTitle>
          <DialogDescription>
            Nhập mã đăng ký FDA và thông tin US Agent cho{' '}
            <span className="font-semibold">{productName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="flex gap-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* FDA section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4 text-primary" />
              Thông tin FDA
            </div>
            <div className="space-y-2">
              <Label htmlFor="fda-code">Mã đăng ký FDA</Label>
              <Input
                id="fda-code"
                placeholder="Ví dụ: 12345678901"
                value={fdaCode}
                onChange={(e) => setFdaCode(e.target.value)}
                disabled={isLoading}
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fda-issue">Ngày cấp</Label>
                <Input
                  id="fda-issue"
                  type="date"
                  value={fdaIssueDate}
                  onChange={(e) => setFdaIssueDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fda-expiry">Ngày hết hạn</Label>
                <Input
                  id="fda-expiry"
                  type="date"
                  value={fdaExpiryDate}
                  onChange={(e) => setFdaExpiryDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* US Agent section */}
          <div className="space-y-4 border-t border-border pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4 text-primary" />
              Thông tin US Agent
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-name">Tên US Agent</Label>
              <Input
                id="agent-name"
                placeholder="Ví dụ: ABC Regulatory Services LLC"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-expiry">Ngày hết hạn</Label>
              <Input
                id="agent-expiry"
                type="date"
                value={agentExpiryDate}
                onChange={(e) => setAgentExpiryDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
