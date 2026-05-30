'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Loader2, AlertTriangle, Shield } from 'lucide-react'
import { PIPELINE_STAGES, type PipelineStage } from '@/lib/types'
import { updateServiceStage } from '@/app/actions/services'
import { Textarea } from '@/components/ui/textarea'

interface FdaInfo {
  fda_code: string
  fda_issue_date: string
  fda_expiry_date: string
}

interface StageTransitionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceId: string
  currentStage: PipelineStage
  targetStage: PipelineStage
  productName: string
  onSuccess?: () => void
}

export function StageTransitionDialog({
  open,
  onOpenChange,
  serviceId,
  currentStage,
  targetStage,
  productName,
  onSuccess,
}: StageTransitionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [fdaInfo, setFdaInfo] = useState<FdaInfo>({
    fda_code: '',
    fda_issue_date: '',
    fda_expiry_date: '',
  })

  const currentStageLabel = PIPELINE_STAGES.find(s => s.value === currentStage)?.label || currentStage
  const targetStageLabel = PIPELINE_STAGES.find(s => s.value === targetStage)?.label || targetStage
  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.value === currentStage)
  const targetStageIndex = PIPELINE_STAGES.findIndex(s => s.value === targetStage)

  // Check if jumping stages (skipping one or more)
  const isJumpingStages = Math.abs(targetStageIndex - currentStageIndex) > 1
  const isMovingBackward = targetStageIndex < currentStageIndex

  // Check if transitioning to completion_handover stage - requires FDA info
  const requiresFdaInfo = targetStage === 'completion_handover'

  const validateForm = (): string | null => {
    if (!note.trim()) {
      return 'Vui lòng nhập ghi chú trước khi chuyển giai đoạn'
    }
    
    if (requiresFdaInfo) {
      if (!fdaInfo.fda_code.trim()) {
        return 'Vui lòng nhập mã đăng ký FDA'
      }
      if (!fdaInfo.fda_issue_date) {
        return 'Vui lòng nhập ngày cấp FDA'
      }
      if (!fdaInfo.fda_expiry_date) {
        return 'Vui lòng nhập ngày hết hạn FDA'
      }
      // Validate dates
      const issueDate = new Date(fdaInfo.fda_issue_date)
      const expiryDate = new Date(fdaInfo.fda_expiry_date)
      if (expiryDate <= issueDate) {
        return 'Ngày hết hạn phải sau ngày cấp'
      }
    }
    
    return null
  }

  const handleConfirm = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await updateServiceStage(
        serviceId, 
        targetStage, 
        note.trim(),
        requiresFdaInfo ? fdaInfo : undefined
      )
      // Reset form
      setNote('')
      setFdaInfo({ fda_code: '', fda_issue_date: '', fda_expiry_date: '' })
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[v0] Error updating stage:', err)
      setError(err instanceof Error ? err.message : 'Không thể cập nhật giai đoạn')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = note.trim() && (!requiresFdaInfo || (
    fdaInfo.fda_code.trim() && 
    fdaInfo.fda_issue_date && 
    fdaInfo.fda_expiry_date
  ))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xác nhận chuyển giai đoạn</DialogTitle>
          <DialogDescription>
            Bạn sắp thay đổi trạng thái của dịch vụ {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current and Target Stages */}
          <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Giai đoạn hiện tại</p>
              <p className="font-medium text-foreground">{currentStageLabel}</p>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Giai đoạn mới</p>
              <p className="font-medium text-foreground">{targetStageLabel}</p>
            </div>
          </div>

          {/* FDA Info Fields - Only show when transitioning to completion_handover */}
          {requiresFdaInfo && (
            <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Thông tin FDA</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Mã đăng ký FDA <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="VD: FDA-2024-001234"
                  value={fdaInfo.fda_code}
                  onChange={(e) => setFdaInfo(prev => ({ ...prev, fda_code: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Ngày cấp <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={fdaInfo.fda_issue_date}
                    onChange={(e) => setFdaInfo(prev => ({ ...prev, fda_issue_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Ngày hết hạn <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={fdaInfo.fda_expiry_date}
                    onChange={(e) => setFdaInfo(prev => ({ ...prev, fda_expiry_date: e.target.value }))}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Thông tin FDA sẽ được lưu vào hồ sơ dịch vụ và gửi cho khách hàng
              </p>
            </div>
          )}

          {/* Note field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Ghi chú <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Nhập ghi chú cho khách hàng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Ghi chú này sẽ được gửi trong email thông báo tới khách hàng
            </p>
          </div>

          {/* Warnings */}
          {isJumpingStages && (
            <Alert className="bg-warning/10 border-warning/30">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm text-warning">
                Bạn đang bỏ qua các giai đoạn trung gian. Công việc trong các giai đoạn này sẽ không được hoàn thành.
              </AlertDescription>
            </Alert>
          )}

          {isMovingBackward && (
            <Alert className="bg-warning/10 border-warning/30">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm text-warning">
                Bạn đang di chuyển ngược lại các giai đoạn. Hãy chắc chắn đây là hành động cần thiết.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !isFormValid}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang cập nhật...
              </>
            ) : (
              'Xác nhận chuyển'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
