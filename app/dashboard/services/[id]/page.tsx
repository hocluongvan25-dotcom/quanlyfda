'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { getServiceTypeLabel, getStatusLabel, getStatusColor } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, FileUp, Calendar, Hash } from 'lucide-react'

interface Service {
  id: string
  product_name: string
  service_type: string
  product_description: string | null
  status: string
  fda_registration_number: string | null
  fda_issue_date: string | null
  fda_expiry_date: string | null
  us_agent_name: string | null
  us_agent_expiry_date: string | null
  created_at: string
  updated_at: string
}

interface PipelineStage {
  id: string
  stage_number: number
  stage_name: string
  stage_description: string | null
  status: string
  started_at: string | null
  completed_at: string | null
}

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [service, setService] = useState<Service | null>(null)
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceId, setServiceId] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { id } = await params
      setServiceId(id)

      try {
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('id', id)
          .single()

        if (serviceError) throw serviceError
        setService(serviceData)

        const { data: stagesData, error: stagesError } = await supabase
          .from('pipeline_stages')
          .select('*')
          .eq('service_id', id)
          .order('stage_number', { ascending: true })

        if (stagesError) throw stagesError
        setStages(stagesData || [])
      } catch (error) {
        console.error('Error loading service:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 mb-4">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Không tìm thấy dịch vụ</p>
        <Link href="/dashboard">
          <Button>Quay lại</Button>
        </Link>
      </div>
    )
  }

  const completedStages = stages.filter((s) => s.status === 'completed').length
  const progress = stages.length > 0 ? (completedStages / stages.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{service.product_name}</h1>
            <p className="text-muted-foreground">{getServiceTypeLabel(service.service_type)}</p>
          </div>
        </div>
        <Badge className={getStatusColor(service.status)}>{getStatusLabel(service.status)}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mã số FDA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {service.fda_registration_number || 'Chưa có'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ngày cấp FDA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {service.fda_issue_date ? new Date(service.fda_issue_date).toLocaleDateString('vi-VN') : 'Chưa có'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Hạn sử dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {service.fda_expiry_date ? new Date(service.fda_expiry_date).toLocaleDateString('vi-VN') : 'Chưa có'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList>
          <TabsTrigger value="pipeline">Quy trình xử lý</TabsTrigger>
          <TabsTrigger value="details">Chi tiết</TabsTrigger>
          <TabsTrigger value="documents">Tài liệu</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tiến độ xử lý</CardTitle>
              <CardDescription>
                {completedStages} / {stages.length} bước hoàn thành
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tiến độ tổng thể</span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>

              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          stage.status === 'completed'
                            ? 'bg-green-600 text-white'
                            : stage.status === 'in_progress'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {stage.status === 'completed' ? '✓' : index + 1}
                      </div>
                      {index < stages.length - 1 && (
                        <div
                          className={`w-0.5 h-12 mt-2 ${
                            stage.status === 'completed' ? 'bg-green-600' : 'bg-border'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-medium text-foreground">{stage.stage_name}</p>
                      <p className="text-sm text-muted-foreground">{stage.stage_description}</p>
                      {stage.started_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Bắt đầu: {new Date(stage.started_at).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                      {stage.completed_at && (
                        <p className="text-xs text-green-600">
                          Hoàn thành: {new Date(stage.completed_at).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {service.product_description && (
                <div>
                  <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{service.product_description}</p>
                </div>
              )}

              {service.us_agent_name && (
                <div>
                  <h3 className="font-semibold mb-2">US Agent</h3>
                  <p className="text-muted-foreground">{service.us_agent_name}</p>
                  {service.us_agent_expiry_date && (
                    <p className="text-sm text-muted-foreground">
                      Hết hạn: {new Date(service.us_agent_expiry_date).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Ngày tạo</h3>
                <p className="text-muted-foreground">
                  {new Date(service.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tài liệu</CardTitle>
                <CardDescription>Quản lý tài liệu cho dịch vụ này</CardDescription>
              </div>
              <Button size="sm">
                <FileUp className="mr-2 h-4 w-4" />
                Tải lên tài liệu
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có tài liệu nào</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
