'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getStatusLabel, getStatusColor } from '@/lib/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileUp, Calendar, Hash, CheckCircle2, Play, Clock, AlertCircle } from 'lucide-react'
import { getRegistrationDetail, completeStage, updateFDAResult, getActivityLog } from '@/app/actions'

interface PipelineStage {
  id: string
  stage_number: number
  stage_name: string
  stage_description: string | null
  status: string
  started_at: string | null
  completed_at: string | null
  notes: string | null
}

interface Registration {
  id: string
  facility_name: string
  product_description: string | null
  current_stage: number
  fda_registration_number: string | null
  fda_issue_date: string | null
  fda_expiry_date: string | null
  us_agent_name: string | null
  us_agent_email: string | null
  us_agent_phone: string | null
  us_agent_expiry_date: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  registration_types: {
    id: string
    code: string
    name: string
  } | null
  registration_statuses: {
    id: string
    code: string
    name: string
    color: string
  } | null
  companies: {
    id: string
    name: string
  } | null
  pipeline_stages: PipelineStage[]
}

interface ActivityLog {
  id: string
  action: string
  description: string
  created_at: string
  profiles: {
    full_name: string | null
    email: string | null
  } | null
}

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showFDADialog, setShowFDADialog] = useState(false)
  const [currentStageToComplete, setCurrentStageToComplete] = useState<number | null>(null)
  const [stageNotes, setStageNotes] = useState('')
  const [fdaData, setFdaData] = useState({
    fda_registration_number: '',
    fda_issue_date: '',
    fda_expiry_date: '',
    us_agent_name: '',
    us_agent_email: '',
    us_agent_phone: '',
    us_agent_expiry_date: '',
  })

  const loadData = async () => {
    try {
      const { id } = await params
      const data = await getRegistrationDetail(id)
      setRegistration(data)
      
      const logs = await getActivityLog(id)
      setActivityLogs(logs)
    } catch (error) {
      console.error('Error loading registration:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [params])

  const handleCompleteStage = async () => {
    if (!registration || currentStageToComplete === null) return
    
    setCompleting(true)
    try {
      await completeStage(registration.id, currentStageToComplete, stageNotes)
      setShowCompleteDialog(false)
      setStageNotes('')
      setCurrentStageToComplete(null)
      await loadData() // Reload data
    } catch (error) {
      console.error('Error completing stage:', error)
      alert('Có lỗi xảy ra khi hoàn thành bước')
    } finally {
      setCompleting(false)
    }
  }

  const handleUpdateFDA = async () => {
    if (!registration) return
    
    setCompleting(true)
    try {
      await updateFDAResult(registration.id, fdaData)
      setShowFDADialog(false)
      await loadData()
    } catch (error) {
      console.error('Error updating FDA result:', error)
      alert('Có lỗi xảy ra khi cập nhật kết quả FDA')
    } finally {
      setCompleting(false)
    }
  }

  const openCompleteDialog = (stageNumber: number) => {
    setCurrentStageToComplete(stageNumber)
    setShowCompleteDialog(true)
  }

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

  if (!registration) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">Không tìm thấy dịch vụ</p>
        <Link href="/dashboard/services">
          <Button>Quay lại</Button>
        </Link>
      </div>
    )
  }

  const stages = registration.pipeline_stages || []
  const completedStages = stages.filter((s) => s.status === 'completed').length
  const progress = stages.length > 0 ? (completedStages / stages.length) * 100 : 0
  const currentInProgressStage = stages.find(s => s.status === 'in_progress')
  const isLastStage = currentInProgressStage?.stage_number === stages.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/services">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{registration.facility_name}</h1>
            <p className="text-muted-foreground">
              {registration.registration_types?.name || registration.registration_types?.code}
              {registration.companies?.name && ` • ${registration.companies.name}`}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(registration.registration_statuses?.code || '')}>
          {registration.registration_statuses?.name || getStatusLabel(registration.registration_statuses?.code || '')}
        </Badge>
      </div>

      {/* FDA Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mã số FDA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {registration.fda_registration_number || 'Chưa có'}
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
                {registration.fda_issue_date 
                  ? new Date(registration.fda_issue_date).toLocaleDateString('vi-VN') 
                  : 'Chưa có'}
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
                {registration.fda_expiry_date 
                  ? new Date(registration.fda_expiry_date).toLocaleDateString('vi-VN') 
                  : 'Chưa có'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList>
          <TabsTrigger value="pipeline">Quy trình xử lý</TabsTrigger>
          <TabsTrigger value="details">Chi tiết</TabsTrigger>
          <TabsTrigger value="documents">Tài liệu</TabsTrigger>
          <TabsTrigger value="activity">Lịch sử</TabsTrigger>
        </TabsList>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tiến độ xử lý</CardTitle>
                <CardDescription>
                  {completedStages} / {stages.length} bước hoàn thành
                </CardDescription>
              </div>
              {isLastStage && !registration.fda_registration_number && (
                <Button onClick={() => setShowFDADialog(true)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Nhập kết quả FDA
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tiến độ tổng thể</span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Pipeline Stages */}
              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0"
                  >
                    {/* Stage Indicator */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                          stage.status === 'completed'
                            ? 'bg-green-600 text-white'
                            : stage.status === 'in_progress'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {stage.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : stage.status === 'in_progress' ? (
                          <Play className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>
                      {index < stages.length - 1 && (
                        <div
                          className={`w-0.5 h-16 mt-2 ${
                            stage.status === 'completed' ? 'bg-green-600' : 'bg-border'
                          }`}
                        />
                      )}
                    </div>

                    {/* Stage Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{stage.stage_name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{stage.stage_description}</p>
                        </div>
                        
                        {/* Action Button */}
                        {stage.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            onClick={() => openCompleteDialog(stage.stage_number)}
                          >
                            Hoàn thành bước này
                          </Button>
                        )}
                      </div>

                      {/* Stage Meta */}
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        {stage.started_at && (
                          <span className="text-muted-foreground">
                            Bắt đầu: {new Date(stage.started_at).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {stage.completed_at && (
                          <span className="text-green-600">
                            Hoàn thành: {new Date(stage.completed_at).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>

                      {/* Stage Notes */}
                      {stage.notes && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <span className="font-medium">Ghi chú:</span> {stage.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {stages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có quy trình xử lý</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {registration.product_description && (
                <div>
                  <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {registration.product_description}
                  </p>
                </div>
              )}

              {registration.us_agent_name && (
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3">Thông tin US Agent</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tên:</span>
                      <p className="font-medium">{registration.us_agent_name}</p>
                    </div>
                    {registration.us_agent_email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{registration.us_agent_email}</p>
                      </div>
                    )}
                    {registration.us_agent_phone && (
                      <div>
                        <span className="text-muted-foreground">Điện thoại:</span>
                        <p className="font-medium">{registration.us_agent_phone}</p>
                      </div>
                    )}
                    {registration.us_agent_expiry_date && (
                      <div>
                        <span className="text-muted-foreground">Hết hạn:</span>
                        <p className="font-medium">
                          {new Date(registration.us_agent_expiry_date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Ngày tạo</h3>
                  <p className="text-muted-foreground">
                    {new Date(registration.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cập nhật lần cuối</h3>
                  <p className="text-muted-foreground">
                    {new Date(registration.updated_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
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

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử hoạt động</CardTitle>
              <CardDescription>Theo dõi các thay đổi và cập nhật</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length > 0 ? (
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="font-medium">{log.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.profiles?.full_name || log.profiles?.email || 'Hệ thống'} • {' '}
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có hoạt động nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complete Stage Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành bước</DialogTitle>
            <DialogDescription>
              Xác nhận hoàn thành bước này và chuyển sang bước tiếp theo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="notes"
                placeholder="Nhập ghi chú cho bước này..."
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCompleteStage} disabled={completing}>
              {completing ? 'Đang xử lý...' : 'Hoàn thành'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FDA Result Dialog */}
      <Dialog open={showFDADialog} onOpenChange={setShowFDADialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nhập kết quả FDA</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin đăng ký FDA sau khi nhận được kết quả
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fda_number">Mã số FDA *</Label>
              <Input
                id="fda_number"
                placeholder="VD: 12345678901"
                value={fdaData.fda_registration_number}
                onChange={(e) => setFdaData({ ...fdaData, fda_registration_number: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fda_issue_date">Ngày cấp *</Label>
                <Input
                  id="fda_issue_date"
                  type="date"
                  value={fdaData.fda_issue_date}
                  onChange={(e) => setFdaData({ ...fdaData, fda_issue_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="fda_expiry_date">Ngày hết hạn</Label>
                <Input
                  id="fda_expiry_date"
                  type="date"
                  value={fdaData.fda_expiry_date}
                  onChange={(e) => setFdaData({ ...fdaData, fda_expiry_date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Thông tin US Agent (tùy chọn)</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="us_agent_name">Tên US Agent</Label>
                  <Input
                    id="us_agent_name"
                    placeholder="Tên đại lý tại Mỹ"
                    value={fdaData.us_agent_name}
                    onChange={(e) => setFdaData({ ...fdaData, us_agent_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="us_agent_email">Email</Label>
                    <Input
                      id="us_agent_email"
                      type="email"
                      value={fdaData.us_agent_email}
                      onChange={(e) => setFdaData({ ...fdaData, us_agent_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="us_agent_phone">Điện thoại</Label>
                    <Input
                      id="us_agent_phone"
                      value={fdaData.us_agent_phone}
                      onChange={(e) => setFdaData({ ...fdaData, us_agent_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFDADialog(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleUpdateFDA} 
              disabled={completing || !fdaData.fda_registration_number || !fdaData.fda_issue_date}
            >
              {completing ? 'Đang lưu...' : 'Lưu kết quả'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
