'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import Link from 'next/link'
import { Eye, Trash2 } from 'lucide-react'

interface Service {
  id: string
  product_name: string
  service_type: string
  status: string
  fda_registration_number: string | null
  fda_expiry_date: string | null
  created_at: string
}

export function ServicesList() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      const supabase = createClient()
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setServices(data || [])
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
  }

  if (services.length === 0) {
    return (
      <Empty
        icon="Package"
        title="Không có dịch vụ nào"
        description="Bắt đầu bằng cách tạo một dịch vụ đăng ký FDA mới"
        action={
          <Link href="/dashboard/services/new">
            <Button>Tạo dịch vụ mới</Button>
          </Link>
        }
      />
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Chờ xử lý' },
      in_progress: { variant: 'default', label: 'Đang xử lý' },
      completed: { variant: 'default', label: 'Hoàn tất' },
      expired: { variant: 'destructive', label: 'Hết hạn' },
    }
    const config = statusMap[status] || statusMap['pending']
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  const getServiceTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      food: 'Thực phẩm',
      cosmetic: 'Mỹ phẩm',
      medical_device: 'Thiết bị y tế',
    }
    return typeMap[type] || type
  }

  return (
    <div className="grid gap-4">
      {services.map((service) => (
        <Card key={service.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{service.product_name}</CardTitle>
                <CardDescription>{getServiceTypeLabel(service.service_type)}</CardDescription>
              </div>
              {getStatusBadge(service.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {service.fda_registration_number && (
                <div>
                  <p className="text-xs text-muted-foreground">Mã số FDA</p>
                  <p className="font-medium text-sm">{service.fda_registration_number}</p>
                </div>
              )}
              {service.fda_expiry_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Ngày hết hạn</p>
                  <p className="font-medium text-sm">{service.fda_expiry_date}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Tạo lúc</p>
                <p className="font-medium text-sm">
                  {new Date(service.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/services/${service.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Chi tiết
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
