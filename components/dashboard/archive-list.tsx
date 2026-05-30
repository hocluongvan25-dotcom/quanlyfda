'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TERMINAL_PIPELINE_STAGES,
  TERMINAL_STAGES,
  getServiceTypeLabel,
  getStageLabel,
  type Service,
  type PipelineStage,
  type ServiceType,
} from '@/lib/types'
import { getArchivedServices } from '@/app/actions/services'
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
} from 'lucide-react'

const PAGE_SIZE = 20

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function ArchiveList({ initialStage }: { initialStage?: PipelineStage }) {
  const [services, setServices] = useState<Service[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ServiceType | 'all'>('all')
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>(
    initialStage ?? 'all',
  )
  const [isLoading, setIsLoading] = useState(true)

  // Debounce the search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Reset to first page whenever filters change.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, typeFilter, stageFilter])

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const stages: PipelineStage[] =
        stageFilter === 'all' ? TERMINAL_STAGES : [stageFilter]
      const { services: data, total: count } = await getArchivedServices({
        stages,
        serviceTypes: typeFilter === 'all' ? undefined : [typeFilter],
        search: debouncedSearch,
        page,
        pageSize: PAGE_SIZE,
      })
      setServices(data)
      setTotal(count)
    } catch (error) {
      console.error('[v0] Error loading archive:', error)
    } finally {
      setIsLoading(false)
    }
  }, [stageFilter, typeFilter, debouncedSearch, page])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sản phẩm hoặc mã FDA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={stageFilter}
            onValueChange={(v) => setStageFilter(v as PipelineStage | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Giai đoạn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giai đoạn</SelectItem>
              {TERMINAL_PIPELINE_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as ServiceType | 'all')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="food">Thực phẩm</SelectItem>
              <SelectItem value="cosmetics">Mỹ phẩm</SelectItem>
              <SelectItem value="medical_device">Thiết bị Y tế</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Giai đoạn</TableHead>
              <TableHead>Mã FDA</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead className="text-right">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  Không tìm thấy dịch vụ nào
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium text-foreground max-w-[220px] truncate">
                    {service.product_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {service.client?.company_name ||
                      service.client?.full_name ||
                      'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getServiceTypeLabel(service.service_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getStageLabel(service.current_stage)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-primary">
                    {service.fda_code || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(service.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/service/${service.id}`}>
                        Xem
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total > 0 ? `Hiển thị ${from}–${to} trên ${total}` : 'Không có dữ liệu'}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            {page}/{totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
