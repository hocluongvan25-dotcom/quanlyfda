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
import { Loader2, AlertTriangle } from 'lucide-react'
import { PIPELINE_STAGES, type PipelineStage } from '@/lib/types'
import { updateServiceStage } from '@/app/actions/services'

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

  const currentStageLabel = PIPELINE_STAGES.find(s => s.value === currentStage)?.label || currentStage
  const targetStageLabel = PIPELINE_STAGES.find(s => s.value === targetStage)?.label || targetStage
  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.value === currentStage)
  const targetStageIndex = PIPELINE_STAGES.findIndex(s => s.value === targetStage)

  // Check if jumping stages (skipping one or more)
  const isJumpingStages = Math.abs(targetStageIndex - currentStageIndex) > 1
  const isMovingBackward = targetStageIndex < currentStageIndex

  const handleConfirm = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await updateServiceStage(serviceId, targetStage)
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('[v0] Error updating stage:', err)
      setError(err instanceof Error ? err.message : 'Không thể cập nhật giai đoạn')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
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

          <p className="text-sm text-muted-foreground">
            Email thông báo sẽ được gửi cho khách hàng về sự thay đổi này.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
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
