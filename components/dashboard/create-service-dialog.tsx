'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { SERVICE_TYPES, type ServiceType, type Profile } from '@/lib/types'
import { createService, getClients } from '@/app/actions/services'
import { Plus, Loader2, Utensils, Sparkles, Stethoscope, Building2, UserPlus } from 'lucide-react'
import { CreateClientDialog } from './create-client-dialog'

function getServiceIcon(type: ServiceType) {
  switch (type) {
    case 'food':
      return <Utensils className="h-4 w-4" />
    case 'cosmetics':
      return <Sparkles className="h-4 w-4" />
    case 'medical_device':
      return <Stethoscope className="h-4 w-4" />
  }
}

interface CreateServiceDialogProps {
  trigger?: React.ReactNode
}

export function CreateServiceDialog({ trigger }: CreateServiceDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Profile[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  
  const [formData, setFormData] = useState({
    client_id: '',
    service_type: '' as ServiceType | '',
    product_name: '',
    product_description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const refreshClients = () => {
    setLoadingClients(true)
    getClients()
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoadingClients(false))
  }

  useEffect(() => {
    if (open) {
      refreshClients()
    }
  }, [open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.client_id) {
      newErrors.client_id = 'Vui lòng chọn khách hàng'
    }
    if (!formData.service_type) {
      newErrors.service_type = 'Vui lòng chọn loại dịch vụ'
    }
    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Vui lòng nhập tên sản phẩm'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      const service = await createService({
        client_id: formData.client_id,
        service_type: formData.service_type as ServiceType,
        product_name: formData.product_name.trim(),
        product_description: formData.product_description.trim() || undefined,
      })
      
      setOpen(false)
      setFormData({
        client_id: '',
        service_type: '',
        product_name: '',
        product_description: '',
      })
      
      // Navigate to the new service
      router.push(`/dashboard/service/${service.id}`)
      router.refresh()
    } catch (error) {
      console.error('[v0] Error creating service:', error)
      setErrors({ submit: 'Không thể tạo dịch vụ. Vui lòng thử lại.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo dịch vụ mới
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo dịch vụ đăng ký FDA mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin để tạo dịch vụ đăng ký FDA mới cho khách hàng
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="client">Khách hàng *</Label>
              <CreateClientDialog
                trigger={
                  <Button variant="ghost" size="sm" className="h-auto p-1 text-primary hover:text-primary/80">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Thêm mới
                  </Button>
                }
                onClientCreated={(newClient) => {
                  setClients(prev => [...prev, newClient])
                  setFormData(prev => ({ ...prev, client_id: newClient.id }))
                }}
              />
            </div>
            {loadingClients ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải danh sách khách hàng...
              </div>
            ) : clients.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 bg-secondary rounded-lg">
                <Building2 className="h-4 w-4 inline-block mr-2" />
                Chưa có khách hàng nào. Nhấn &quot;Thêm mới&quot; để tạo khách hàng.
              </div>
            ) : (
              <Select
                value={formData.client_id}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, client_id: value }))
                  if (errors.client_id) setErrors(prev => ({ ...prev, client_id: '' }))
                }}
              >
                <SelectTrigger className={errors.client_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{client.company_name || client.full_name || client.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.client_id && (
              <p className="text-sm text-destructive">{errors.client_id}</p>
            )}
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="service_type">Loại dịch vụ *</Label>
            <Select
              value={formData.service_type}
              onValueChange={(value: ServiceType) => {
                setFormData(prev => ({ ...prev, service_type: value }))
                if (errors.service_type) setErrors(prev => ({ ...prev, service_type: '' }))
              }}
            >
              <SelectTrigger className={errors.service_type ? 'border-destructive' : ''}>
                <SelectValue placeholder="Chọn loại dịch vụ" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {getServiceIcon(type.value)}
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_type && (
              <p className="text-sm text-destructive">{errors.service_type}</p>
            )}
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="product_name">Tên sản phẩm *</Label>
            <Input
              id="product_name"
              placeholder="VD: Nước ép trái cây ABC"
              value={formData.product_name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, product_name: e.target.value }))
                if (errors.product_name) setErrors(prev => ({ ...prev, product_name: '' }))
              }}
              className={errors.product_name ? 'border-destructive' : ''}
            />
            {errors.product_name && (
              <p className="text-sm text-destructive">{errors.product_name}</p>
            )}
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <Label htmlFor="product_description">Mô tả sản phẩm</Label>
            <Textarea
              id="product_description"
              placeholder="Nhập mô tả chi tiết về sản phẩm (tùy chọn)"
              value={formData.product_description}
              onChange={(e) => setFormData(prev => ({ ...prev, product_description: e.target.value }))}
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
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading || clients.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo dịch vụ
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
