'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UploadDocumentDialogProps {
  serviceId: string
  serviceName?: string
  trigger?: React.ReactNode
  onUploadComplete?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function UploadDocumentDialog({ 
  serviceId, 
  serviceName,
  trigger,
  onUploadComplete,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: UploadDocumentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<string>('required')
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File quá lớn. Kích thước tối đa là 10MB.')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file để tải lên')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('serviceId', serviceId)
      formData.append('documentType', documentType)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadSuccess(true)
      
      // Reset after success
      setTimeout(() => {
        setOpen(false)
        setSelectedFile(null)
        setUploadSuccess(false)
        setDocumentType('required')
        router.refresh()
        onUploadComplete?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải lên')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Tải lên
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tải lên tài liệu</DialogTitle>
          <DialogDescription>
            {serviceName ? `Tải lên tài liệu cho dịch vụ: ${serviceName}` : 'Chọn file và loại tài liệu để tải lên'}
          </DialogDescription>
        </DialogHeader>

        {uploadSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-success mb-4" />
            <p className="text-lg font-medium text-foreground">Tải lên thành công!</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                selectedFile 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
              
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-10 w-10 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nhấn để chọn file hoặc kéo thả vào đây
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (tối đa 10MB)
                  </p>
                </>
              )}
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Loại tài liệu</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Tài liệu yêu cầu</SelectItem>
                  <SelectItem value="result">Tài liệu kết quả</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        {!uploadSuccess && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
              Hủy
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Tải lên
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
