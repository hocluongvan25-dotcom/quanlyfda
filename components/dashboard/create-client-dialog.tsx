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
import { createClientProfile } from '@/app/actions/services'
import { Plus, Loader2, UserPlus } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface CreateClientDialogProps {
  trigger?: React.ReactNode
  onClientCreated?: (client: Profile) => void
}

export function CreateClientDialog({ trigger, onClientCreated }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    company_name: '',
    phone: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }
    
    if (!formData.company_name.trim() && !formData.full_name.trim()) {
      newErrors.company_name = 'Vui lòng nhập tên công ty hoặc họ tên'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      const client = await createClientProfile({
        email: formData.email.trim(),
        full_name: formData.full_name.trim() || undefined,
        company_name: formData.company_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      })
      
      setOpen(false)
      setFormData({
        email: '',
        full_name: '',
        company_name: '',
        phone: '',
      })
      
      onClientCreated?.(client)
    } catch (error) {
      console.error('[v0] Error creating client:', error)
      setErrors({ submit: 'Không thể tạo khách hàng. Email có thể đã tồn tại.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Thêm khách hàng
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Thêm khách hàng mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin khách hàng để tạo tài khoản mới
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@company.com"
              value={formData.email}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, email: e.target.value }))
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
              }}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name">Tên công ty</Label>
            <Input
              id="company_name"
              placeholder="VD: Công ty ABC"
              value={formData.company_name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, company_name: e.target.value }))
                if (errors.company_name) setErrors(prev => ({ ...prev, company_name: '' }))
              }}
              className={errors.company_name ? 'border-destructive' : ''}
            />
            {errors.company_name && (
              <p className="text-sm text-destructive">{errors.company_name}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Họ và tên người đại diện</Label>
            <Input
              id="full_name"
              placeholder="VD: Nguyễn Văn A"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              placeholder="VD: 0901234567"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm khách hàng
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
