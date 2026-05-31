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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Loader2, AlertTriangle, Shield, Upload, FileText, X, Sparkles } from 'lucide-react'
import {
  PIPELINE_STAGES,
  DOCUMENT_CATEGORIES,
  detectDocumentCategory,
  type PipelineStage,
  type DocumentCategory,
} from '@/lib/types'
import { updateServiceStage } from '@/app/actions/services'
import { Textarea } from '@/components/ui/textarea'

interface FdaInfo {
  fda_code: string
  fda_issue_date: string
  fda_expiry_date: string
  fda_duns_code: string
  fda_fei_code: string
}

interface UsAgentInfo {
  us_agent_name: string
  us_agent_start_date: string
  us_agent_expiry_date: string
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

// Duration options for US Agent
const US_AGENT_DURATIONS = [
  { value: '1', label: '1 năm' },
  { value: '2', label: '2 năm' },
  { value: '3', label: '3 năm' },
  { value: '4', label: '4 năm' },
  { value: '5', label: '5 năm' },
  { value: '10', label: '10 năm' },
]

function todayISOString() {
  return new Date().toISOString().split('T')[0]
}

function addYearsToDate(dateStr: string, years: number): string {
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().split('T')[0]
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

  // Pending documents to upload after the stage is updated
  const [pendingFiles, setPendingFiles] = useState<
    { file: File; category: DocumentCategory }[]
  >([])
  const [uploadStatus, setUploadStatus] = useState('')

  // FDA state — issue date defaults to today
  const [fdaInfo, setFdaInfo] = useState<FdaInfo>({
    fda_code: '',
    fda_issue_date: todayISOString(),
    fda_expiry_date: '',
    fda_duns_code: '',
    fda_fei_code: '',
  })

  // US Agent state — start date defaults to today, duration drives expiry
  const [usAgentName, setUsAgentName] = useState('')
  const [usAgentStartDate] = useState(todayISOString())        // auto, display only
  const [usAgentDuration, setUsAgentDuration] = useState('')   // years as string

  const currentStageLabel = PIPELINE_STAGES.find(s => s.value === currentStage)?.label || currentStage
  const targetStageLabel  = PIPELINE_STAGES.find(s => s.value === targetStage)?.label  || targetStage
  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.value === currentStage)
  const targetStageIndex  = PIPELINE_STAGES.findIndex(s => s.value === targetStage)

  const isJumpingStages  = Math.abs(targetStageIndex - currentStageIndex) > 1
  const isMovingBackward = targetStageIndex < currentStageIndex

  const requiresFdaInfo     = targetStage === 'completion_handover'
  const requiresUsAgentInfo = targetStage === 'us_agent_confirmation'

  // Derived expiry date for US Agent
  const usAgentExpiryDate = usAgentDuration
    ? addYearsToDate(usAgentStartDate, parseInt(usAgentDuration))
    : ''

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const newFiles = Array.from(fileList).map((file) => ({
      file,
      category: detectDocumentCategory(file.name),
    }))
    setPendingFiles((prev) => [...prev, ...newFiles])
  }

  const handleRemoveFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleChangeCategory = (index: number, category: DocumentCategory) => {
    setPendingFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, category } : item)),
    )
  }

  const uploadPendingFiles = async () => {
    for (let i = 0; i < pendingFiles.length; i++) {
      const { file, category } = pendingFiles[i]
      setUploadStatus(`Đang tải lên ${i + 1}/${pendingFiles.length}: ${file.name}`)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('serviceId', serviceId)
      formData.append('documentType', category === 'fda_certificate' ? 'result' : 'required')
      formData.append('category', category)
      formData.append('stage', targetStage)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Không thể tải lên ${file.name}`)
      }
    }
    setUploadStatus('')
  }

  const validateForm = (): string | null => {
    if (requiresFdaInfo) {
      if (!fdaInfo.fda_code.trim())    return 'Vui lòng nhập mã đăng ký FDA'
      if (!fdaInfo.fda_issue_date)     return 'Vui lòng nhập ngày cấp FDA'
      if (!fdaInfo.fda_expiry_date)    return 'Vui lòng nhập ngày hết hạn FDA'
      if (new Date(fdaInfo.fda_expiry_date) <= new Date(fdaInfo.fda_issue_date))
        return 'Ngày hết hạn phải sau ngày cấp'
    }
    if (requiresUsAgentInfo) {
      if (!usAgentName.trim())  return 'Vui lòng nhập tên US Agent'
      if (!usAgentDuration)     return 'Vui lòng chọn thời hạn US Agent'
    }
    return null
  }

  const isFormValid =
    (!requiresFdaInfo || (
      fdaInfo.fda_code.trim() &&
      fdaInfo.fda_issue_date &&
      fdaInfo.fda_expiry_date
    )) &&
    (!requiresUsAgentInfo || (
      usAgentName.trim() &&
      usAgentDuration !== ''
    ))

  const handleConfirm = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const usAgentInfo: UsAgentInfo | undefined = requiresUsAgentInfo
        ? {
            us_agent_name:        usAgentName.trim(),
            us_agent_start_date:  usAgentStartDate,
            us_agent_expiry_date: usAgentExpiryDate,
          }
        : undefined

      await updateServiceStage(
        serviceId,
        targetStage,
        note.trim() || undefined,
        requiresFdaInfo ? fdaInfo : undefined,
        usAgentInfo,
      )

      // Upload any pending documents after the stage is updated
      if (pendingFiles.length > 0) {
        await uploadPendingFiles()
      }

      // Reset form
      setNote('')
      setFdaInfo({ fda_code: '', fda_issue_date: todayISOString(), fda_expiry_date: '', fda_duns_code: '', fda_fei_code: '' })
      setUsAgentName('')
      setUsAgentDuration('')
      setPendingFiles([])
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xác nhận chuyển giai đoạn</DialogTitle>
          <DialogDescription>
            Bạn sắp thay đổi trạng thái của dịch vụ {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current → Target stage */}
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

          {/* ── FDA INFO ── */}
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
                  <label className="text-sm font-medium">Mã DUNS</label>
                  <Input
                    placeholder="VD: 12-345-6789"
                    value={fdaInfo.fda_duns_code}
                    onChange={(e) => setFdaInfo(prev => ({ ...prev, fda_duns_code: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mã FEI</label>
                  <Input
                    placeholder="VD: 1234567"
                    value={fdaInfo.fda_fei_code}
                    onChange={(e) => setFdaInfo(prev => ({ ...prev, fda_fei_code: e.target.value }))}
                  />
                </div>
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

          {/* ── DOCUMENT UPLOAD (when completing) ── */}
          {requiresFdaInfo && (
            <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-primary">
                <Upload className="h-4 w-4" />
                <span className="text-sm font-medium">Tài liệu bàn giao</span>
              </div>

              <label
                htmlFor="stage-doc-upload"
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background/50 px-4 py-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-secondary/30"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-foreground">Chọn file để tải lên</span>
                <span className="text-xs text-muted-foreground">
                  Chứng nhận FDA, Form 3537, tài khoản đăng nhập... (có thể chọn nhiều file)
                </span>
                <input
                  id="stage-doc-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleAddFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>

              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  {pendingFiles.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg bg-background/50 border border-border p-2"
                    >
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{item.file.name}</p>
                        <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
                          <Sparkles className="h-3 w-3" />
                          <span>Tự động nhận dạng</span>
                        </div>
                      </div>
                      <Select
                        value={item.category}
                        onValueChange={(value) =>
                          handleChangeCategory(index, value as DocumentCategory)
                        }
                      >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="text-xs">
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Tài liệu sẽ được tải lên và lưu vào hồ sơ dịch vụ sau khi xác nhận chuyển giai đoạn.
              </p>
            </div>
          )}

          {/* ── US AGENT INFO ── */}
          {requiresUsAgentInfo && (
            <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Thông tin US Agent</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tên US Agent <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="VD: ABC US Agent LLC"
                  value={usAgentName}
                  onChange={(e) => setUsAgentName(e.target.value)}
                />
              </div>

              {/* Start date auto, duration dropdown, expiry auto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngày bắt đầu</label>
                  <Input
                    type="date"
                    value={usAgentStartDate}
                    readOnly
                    className="bg-secondary/50 text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Tự động điền hôm nay</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Thời hạn <span className="text-destructive">*</span>
                  </label>
                  <Select value={usAgentDuration} onValueChange={setUsAgentDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thời hạn" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_AGENT_DURATIONS.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Computed expiry preview */}
              {usAgentExpiryDate && (
                <div className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Ngày hết hạn:</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(usAgentExpiryDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Thời hạn US Agent sẽ được ghi nhận và khách hàng sẽ nhận email nhắc gia hạn trước khi hết hạn
              </p>
            </div>
          )}

          {/* ── NOTE ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ghi chú</label>
            <Textarea
              placeholder="Nhập ghi chú cho khách hàng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={3}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !isFormValid}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {uploadStatus || 'Đang cập nhật...'}
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
