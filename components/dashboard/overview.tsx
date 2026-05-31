import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getServices, getDashboardStats, getNotifications, getExpiringServices } from '@/app/actions/services'
import { getStageLabel, getServiceTypeLabel, PIPELINE_STAGES, type Service } from '@/lib/types'
import {
  FileCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Utensils,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function getServiceIcon(type: string) {
  switch (type) {
    case 'food':
      return <Utensils className="h-4 w-4" />
    case 'cosmetics':
      return <Sparkles className="h-4 w-4" />
    case 'medical_device':
      return <Stethoscope className="h-4 w-4" />
    default:
      return <FileCheck className="h-4 w-4" />
  }
}

function getServiceTypeBadgeClass(type: string) {
  switch (type) {
    case 'food':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'cosmetics':
      return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30'
    case 'medical_device':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getDaysUntilExpiry(dateStr: string): number {
  const expiryDate = new Date(dateStr)
  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getExpiryStatus(days: number): 'expired' | 'critical' | 'warning' | 'normal' {
  if (days <= 0) return 'expired'
  if (days <= 30) return 'critical'
  if (days <= 90) return 'warning'
  return 'normal'
}

function getStageOrder(stage: string): number {
  const index = PIPELINE_STAGES.findIndex(s => s.value === stage)
  return index >= 0 ? index + 1 : 1
}

export async function DashboardOverview() {
  const [stats, services, notifications, expiringServices] = await Promise.all([
    getDashboardStats(),
    getServices(),
    getNotifications(),
    getExpiringServices(90)
  ])

  const inProgressServices = services.filter(
    s => s.current_stage !== 'completion_handover' && s.current_stage !== 'renewal_support'
  )

  const completedServices = services
    .filter(
      s => s.current_stage === 'completion_handover' || s.current_stage === 'renewal_support'
    )
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/pipeline" className="block">
          <Card className="bg-card border-border transition-colors hover:border-primary/50 hover:bg-secondary/30 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng dịch vụ
              </CardTitle>
              <FileCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalServices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {inProgressServices.length} đang xử lý
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/pipeline/archive" className="block">
          <Card className="bg-card border-border transition-colors hover:border-primary/50 hover:bg-secondary/30 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hoàn thành
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.completedServices}</div>
              <Progress 
                value={stats.totalServices > 0 ? (stats.completedServices / stats.totalServices) * 100 : 0} 
                className="mt-2 h-1" 
              />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/pipeline/archive?stage=renewal_support" className="block">
          <Card className="bg-card border-border transition-colors hover:border-primary/50 hover:bg-secondary/30 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sắp hết hạn
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.expiringCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Trong 30 ngày tới
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/notifications" className="block">
          <Card className="bg-card border-border transition-colors hover:border-primary/50 hover:bg-secondary/30 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Thông báo mới
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.unreadNotifications}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Cần xem xét
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Services List */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Services */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Dịch vụ đang xử lý</CardTitle>
              <Link href="/dashboard/service">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Xem tất cả <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {inProgressServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Chưa có dịch vụ nào đang xử lý</p>
                </div>
              ) : (
                inProgressServices.slice(0, 4).map((service) => {
                  const stageOrder = getStageOrder(service.current_stage)
                  const progress = (stageOrder / 7) * 100

                  return (
                    <Link
                      key={service.id}
                      href={`/dashboard/service/${service.id}`}
                      className="block"
                    >
                      <div className="flex items-start justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getServiceTypeBadgeClass(service.service_type)}
                            >
                              {getServiceIcon(service.service_type)}
                              <span className="ml-1">{getServiceTypeLabel(service.service_type)}</span>
                            </Badge>
                          </div>
                          <h4 className="font-medium text-foreground">{service.product_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {service.client?.company_name || service.client?.full_name || 'N/A'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Giai đoạn {stageOrder}/7:</span>
                            <span className="text-primary">{getStageLabel(service.current_stage)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-1 flex-1" />
                            <span className="text-xs text-muted-foreground">
                              {stageOrder}/7
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Expiry Alerts */}
        <div>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Cảnh báo hết hạn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {expiringServices.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Không có cảnh báo hết hạn
                </div>
              ) : (
                expiringServices.map((service) => {
                  const fdaDays = service.fda_expiry_date ? getDaysUntilExpiry(service.fda_expiry_date) : null
                  const agentDays = service.us_agent_expiry_date ? getDaysUntilExpiry(service.us_agent_expiry_date) : null

                  return (
                    <div key={service.id}>
                      {fdaDays !== null && fdaDays <= 90 && (
                        <div
                          className={`p-3 rounded-lg border mb-2 ${
                            getExpiryStatus(fdaDays) === 'expired'
                              ? 'bg-destructive/10 border-destructive/30'
                              : getExpiryStatus(fdaDays) === 'critical'
                              ? 'bg-destructive/10 border-destructive/30'
                              : 'bg-warning/10 border-warning/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm text-foreground">{service.product_name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Mã FDA: {service.fda_code || 'N/A'}
                              </p>
                            </div>
                            <Badge
                              variant={fdaDays <= 30 ? 'destructive' : 'secondary'}
                              className={fdaDays > 30 ? 'bg-warning text-warning-foreground' : ''}
                            >
                              {fdaDays <= 0 ? 'Đã hết hạn' : `${fdaDays} ngày`}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Hết hạn: {formatDate(service.fda_expiry_date)}
                          </p>
                        </div>
                      )}

                      {agentDays !== null && agentDays <= 90 && (
                        <div
                          className={`p-3 rounded-lg border ${
                            getExpiryStatus(agentDays) === 'expired'
                              ? 'bg-destructive/10 border-destructive/30'
                              : getExpiryStatus(agentDays) === 'critical'
                              ? 'bg-destructive/10 border-destructive/30'
                              : 'bg-warning/10 border-warning/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm text-foreground">US Agent: {service.us_agent_name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {service.product_name}
                              </p>
                            </div>
                            <Badge
                              variant={agentDays <= 30 ? 'destructive' : 'secondary'}
                              className={agentDays > 30 ? 'bg-warning text-warning-foreground' : ''}
                            >
                              {agentDays <= 0 ? 'Đã hết hạn' : `${agentDays} ngày`}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Hết hạn: {formatDate(service.us_agent_expiry_date)}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completed Services */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Dịch vụ hoàn thành gần đây
          </CardTitle>
          <Link href="/dashboard/pipeline/archive">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Xem tất cả <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {completedServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có dịch vụ nào hoàn thành</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedServices.slice(0, 4).map((service) => (
                <Link
                  key={service.id}
                  href={`/dashboard/service/${service.id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors h-full">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={getServiceTypeBadgeClass(service.service_type)}
                        >
                          {getServiceIcon(service.service_type)}
                          <span className="ml-1">{getServiceTypeLabel(service.service_type)}</span>
                        </Badge>
                        <Badge className="bg-success/20 text-success border-success/30">
                          {getStageLabel(service.current_stage)}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-foreground truncate">{service.product_name}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {service.client?.company_name || service.client?.full_name || 'N/A'}
                      </p>
                      {service.fda_code && (
                        <p className="text-xs text-muted-foreground">
                          Mã FDA: <span className="font-mono text-primary">{service.fda_code}</span>
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Thông báo gần đây</CardTitle>
          <Link href="/dashboard/notifications">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Xem tất cả <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    notification.is_read ? 'bg-secondary/30' : 'bg-secondary'
                  }`}
                >
                  <div
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      notification.notification_type === 'warning'
                        ? 'bg-warning'
                        : notification.notification_type === 'success'
                        ? 'bg-success'
                        : notification.notification_type === 'error'
                        ? 'bg-destructive'
                        : 'bg-info'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{notification.title}</p>
                      {!notification.is_read && (
                        <Badge variant="secondary" className="text-xs">Mới</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
