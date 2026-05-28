import { getServices } from '@/app/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Search, FileText, ArrowRight } from 'lucide-react'
import { getServiceTypeLabel, getStatusLabel, getStatusColor } from '@/lib/types'

export default async function ServicesPage() {
  const services = await getServices()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dịch vụ đăng ký</h1>
          <p className="text-muted-foreground">Quản lý các yêu cầu đăng ký FDA của bạn</p>
        </div>
        <Link href="/dashboard/services/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo yêu cầu mới
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên sản phẩm..."
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Chưa có dịch vụ nào
              </h3>
              <p className="text-muted-foreground mb-6">
                Bắt đầu bằng cách tạo yêu cầu đăng ký FDA đầu tiên của bạn
              </p>
              <Link href="/dashboard/services/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo yêu cầu đầu tiên
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{service.product_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getServiceTypeLabel(service.service_type)}
                      {service.fda_registration_number && (
                        <span className="ml-2 text-foreground font-medium">
                          FDA: {service.fda_registration_number}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {getStatusLabel(service.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {service.fda_expiry_date && (
                      <div>
                        <p className="text-muted-foreground">Hạn FDA</p>
                        <p className="font-medium text-foreground">
                          {new Date(service.fda_expiry_date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    )}
                    {service.us_agent_expiry_date && (
                      <div>
                        <p className="text-muted-foreground">Hạn US Agent</p>
                        <p className="font-medium text-foreground">
                          {new Date(service.us_agent_expiry_date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Ngày tạo</p>
                      <p className="font-medium text-foreground">
                        {new Date(service.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <Link href={`/dashboard/services/${service.id}`}>
                    <Button variant="outline" size="sm">
                      Chi tiết
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
