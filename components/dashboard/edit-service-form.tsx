'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { updateService, getProfile } from '@/app/actions/services'
import type { Service, Profile } from '@/lib/types'
import {
  ArrowLeft,
  Loader2,
  Shield,
  User,
  FileText,
  AlertTriangle,
  Save,
  CheckCircle,
} from 'lucide-react'

// Convert a stored ISO date string into the yyyy-mm-dd format an <input type="date"> expects.
function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

interface EditServiceFormProps {
  serviceId: string
}

export function EditServiceForm({ serviceId }: EditServiceFormProps) {
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    product_name: '',
    product_description: '',
    fda_code: '',
    fda_issue_date: '',
    fda_expiry_date: '',
    us_agent_name: '',
    us_agent_expiry_date: '',
    notes: '',
  })

  const isStaffOrAdmin =
    userProfile?.role === 'admin' || userProfile?.role === 'staff'

  useEffect(() => {
    async function fetchData() {
      try {
        const profile = await getProfile()
        setUserProfile(profile)
      } catch (err) {
        console.error('[v0] Error fetching profile:', err)
      }

      const supabase = createClient()
      const { data, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single()

      if (serviceError || !data) {
        console.error('[v0] Error fetching service:', serviceError)
        setIsLoading(false)
        return
      }

      const svc = data as Service
      setService(svc)
      setFormData({
        product_name: svc.product_name ?? '',
        product_description: svc.product_description ?? '',
        fda_code: svc.fda_code ?? '',
        fda_issue_date: toDateInputValue(svc.fda_issue_date),
        fda_expiry_date: toDateInputValue(svc.fda_expiry_date),
        us_agent_name: svc.us_agent_name ?? '',
        us_agent_expiry_date: toDateInputValue(svc.us_agent_expiry_date),
        notes: svc.notes ?? '',
      })
      setIsLoading(false)
    }

    fetchData()
  }, [serviceId])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
    if (success) setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      await updateService(serviceId, {
        product_name: formData.product_name.trim(),
        product_description: formData.product_description.trim() || null,
        fda_code: formData.fda_code.trim() || null,
        fda_issue_date: formData.fda_issue_date || null,
        fda_expiry_date: formData.fda_expiry_date || null,
        us_agent_name: formData.us_agent_name.trim() || null,
        us_agent_expiry_date: formData.us_agent_expiry_date || null,
        notes: formData.notes.trim() || null,
      })

      setSuccess(true)
      router.refresh()
      // Return to the detail page after a short confirmation.
      setTimeout(() => {
        router.push(`/dashboard/service/${serviceId}`)
      }, 800)
    } catch (err) {
      console.error('[v0] Error updating service:', err)
      setError('Không thể lưu thông tin. Vui lòng thử lại.')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p>Không tìm thấy dịch vụ</p>
        <Link href="/dashboard/pipeline">
          <Button variant="link" className="mt-2">
            Quay lại Pipeline
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href={`/dashboard/service/${serviceId}`}>
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại chi tiết
        </Button>
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground text-balance">
          Cập nhật thông tin dịch vụ
        </h1>
        <p className="text-sm text-muted-foreground">
          {service.product_name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Thông tin sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product_name">Tên sản phẩm *</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => handleChange('product_name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_description">Mô tả sản phẩm</Label>
              <Textarea
                id="product_description"
                value={formData.product_description}
                onChange={(e) =>
                  handleChange('product_description', e.target.value)
                }
                rows={3}
                placeholder="Nhập mô tả chi tiết về sản phẩm (tùy chọn)"
              />
            </div>
          </CardContent>
        </Card>

        {/* FDA Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Thông tin FDA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fda_code">Mã đăng ký FDA</Label>
              <Input
                id="fda_code"
                value={formData.fda_code}
                onChange={(e) => handleChange('fda_code', e.target.value)}
                placeholder="VD: 12345678901"
                className="font-mono"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fda_issue_date">Ngày cấp</Label>
                <Input
                  id="fda_issue_date"
                  type="date"
                  value={formData.fda_issue_date}
                  onChange={(e) =>
                    handleChange('fda_issue_date', e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fda_expiry_date">Ngày hết hạn</Label>
                <Input
                  id="fda_expiry_date"
                  type="date"
                  value={formData.fda_expiry_date}
                  onChange={(e) =>
                    handleChange('fda_expiry_date', e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* US Agent Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Thông tin US Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="us_agent_name">Tên US Agent</Label>
              <Input
                id="us_agent_name"
                value={formData.us_agent_name}
                onChange={(e) => handleChange('us_agent_name', e.target.value)}
                placeholder="VD: ABC Compliance LLC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="us_agent_expiry_date">Ngày hết hạn</Label>
              <Input
                id="us_agent_expiry_date"
                type="date"
                value={formData.us_agent_expiry_date}
                onChange={(e) =>
                  handleChange('us_agent_expiry_date', e.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes (staff/admin) */}
        {isStaffOrAdmin && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Ghi chú nội bộ</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Ghi chú dành cho nhân viên (khách hàng không nhìn thấy)"
              />
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <p className="text-sm text-foreground">Đã lưu thông tin thành công</p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Link href={`/dashboard/service/${serviceId}`}>
            <Button type="button" variant="outline" disabled={isSaving}>
              Hủy
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Lưu thông tin
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
