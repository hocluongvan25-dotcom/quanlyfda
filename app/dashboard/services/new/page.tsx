'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, FileText, Users, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { createService } from '@/app/actions'
import type { ServiceType } from '@/lib/types'

const serviceTypes = [
  {
    value: 'food' as ServiceType,
    label: 'Thực phẩm',
    description: 'Food Facility Registration',
    icon: FileText,
  },
  {
    value: 'cosmetic' as ServiceType,
    label: 'Mỹ phẩm',
    description: 'VCRP Registration',
    icon: Users,
  },
  {
    value: 'medical_device' as ServiceType,
    label: 'Thiết bị y tế',
    description: 'Medical Device Registration',
    icon: ShieldCheck,
  },
]

export default function NewServicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') as ServiceType | null

  const [serviceType, setServiceType] = useState<ServiceType>(defaultType || 'food')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const service = await createService({
        service_type: serviceType,
        product_name: productName,
        product_description: productDescription || undefined,
      })
      router.push(`/dashboard/services/${service.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tạo yêu cầu mới</h1>
          <p className="text-muted-foreground">Điền thông tin để tạo yêu cầu đăng ký FDA</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Service Type Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Loại dịch vụ</CardTitle>
              <CardDescription>Chọn loại sản phẩm bạn muốn đăng ký FDA</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={serviceType}
                onValueChange={(value) => setServiceType(value as ServiceType)}
                className="grid gap-4 sm:grid-cols-3"
              >
                {serviceTypes.map((type) => (
                  <Label
                    key={type.value}
                    htmlFor={type.value}
                    className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      serviceType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                    <type.icon className={`h-8 w-8 ${
                      serviceType === type.value ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div className="text-center">
                      <p className="font-medium text-foreground">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin dịch vụ</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Sau khi tạo yêu cầu, bạn có thể:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Theo dõi tiến độ xử lý</li>
                <li>Tải lên tài liệu cần thiết</li>
                <li>Nhận thông báo cập nhật</li>
                <li>Tải về kết quả đăng ký</li>
              </ul>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Thông tin sản phẩm</CardTitle>
              <CardDescription>Nhập thông tin chi tiết về sản phẩm của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="productName">Tên sản phẩm *</Label>
                <Input
                  id="productName"
                  placeholder="Nhập tên sản phẩm hoặc cơ sở sản xuất"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productDescription">Mô tả sản phẩm</Label>
                <Textarea
                  id="productDescription"
                  placeholder="Mô tả chi tiết về sản phẩm (không bắt buộc)"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <Link href="/dashboard/services">
                  <Button type="button" variant="outline">
                    Hủy
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading || !productName.trim()}>
                  {isLoading ? 'Đang tạo...' : 'Tạo yêu cầu'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
