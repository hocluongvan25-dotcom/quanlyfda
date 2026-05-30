'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PIPELINE_STAGES, type PipelineStage, type PipelineTask } from '@/lib/types'
import { createTask, updateTask } from '@/app/actions/services'
import { Plus, Loader2, Edit2 } from 'lucide-react'

interface CreateTaskDialogProps {
  serviceId: string
  currentStage: PipelineStage
  task?: PipelineTask // If provided, edit mode
  trigger?: React.ReactNode
  onTaskCreated?: (task: PipelineTask) => void
  onTaskUpdated?: (task: PipelineTask) => void
}

export function CreateTaskDialog({ 
  serviceId, 
  currentStage, 
  task, 
  trigger, 
  onTaskCreated,
  onTaskUpdated 
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isEditMode = !!task
  
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    stage: task?.stage || currentStage,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = () => {
    if (isEditMode && task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        stage: task.stage,
      })
    } else {
      setFormData({
        title: '',
        description: '',
        stage: currentStage,
      })
    }
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Vui long nhap ten cong viec'
    }
    if (!formData.stage) {
      newErrors.stage = 'Vui long chon giai doan'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      if (isEditMode && task) {
        const updatedTask = await updateTask(task.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          stage: formData.stage as PipelineStage,
        })
        onTaskUpdated?.(updatedTask)
      } else {
        const newTask = await createTask({
          service_id: serviceId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          stage: formData.stage as PipelineStage,
        })
        onTaskCreated?.(newTask)
      }
      
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error('[v0] Error saving task:', error)
      setErrors({ submit: 'Khong the luu cong viec. Vui long thu lai.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (newOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            {isEditMode ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEditMode ? 'Sua' : 'Them cong viec'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Sua cong viec' : 'Them cong viec moi'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Cap nhat thong tin cong viec trong checklist' 
              : 'Them cong viec moi vao checklist cua dich vu'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Ten cong viec *</Label>
            <Input
              id="title"
              placeholder="VD: Thu thap giay phep kinh doanh"
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }))
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }))
              }}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Pipeline Stage */}
          <div className="space-y-2">
            <Label htmlFor="stage">Giai doan *</Label>
            <Select
              value={formData.stage}
              onValueChange={(value: PipelineStage) => {
                setFormData(prev => ({ ...prev, stage: value }))
                if (errors.stage) setErrors(prev => ({ ...prev, stage: '' }))
              }}
            >
              <SelectTrigger className={errors.stage ? 'border-destructive' : ''}>
                <SelectValue placeholder="Chon giai doan" />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stage && (
              <p className="text-sm text-destructive">{errors.stage}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mo ta (tuy chon)</Label>
            <Textarea
              id="description"
              placeholder="Nhap mo ta chi tiet ve cong viec..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {errors.submit && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Huy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Dang luu...
                </>
              ) : (
                <>
                  {isEditMode ? <Edit2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {isEditMode ? 'Cap nhat' : 'Them cong viec'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
