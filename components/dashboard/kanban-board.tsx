'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  ACTIVE_PIPELINE_STAGES,
  TERMINAL_PIPELINE_STAGES,
  getServiceTypeLabel,
  getStageIndex,
  type Service,
  type PipelineStage,
  type ServiceType,
} from '@/lib/types'
import {
  Utensils,
  Sparkles,
  Stethoscope,
  GripVertical,
  User,
  Calendar,
  ChevronRight,
  Filter,
  Loader2,
  CheckCircle2,
  Archive,
} from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getPipelineServices,
  getStageCount,
  updateServiceStage,
} from '@/app/actions/services'

const PAGE_SIZE = 15

function getServiceIcon(type: string) {
  switch (type) {
    case 'food':
      return <Utensils className="h-3.5 w-3.5" />
    case 'cosmetics':
      return <Sparkles className="h-3.5 w-3.5" />
    case 'medical_device':
      return <Stethoscope className="h-3.5 w-3.5" />
    default:
      return null
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
    month: 'short',
    day: 'numeric',
  })
}

// Visual card body, reused inside the Draggable wrapper.
function ServiceCardBody({ service, dragging }: { service: Service; dragging?: boolean }) {
  const stageIndex = getStageIndex(service.current_stage)
  return (
    <Card
      className={`bg-secondary/80 border-border hover:bg-secondary transition-all cursor-grab active:cursor-grabbing ${
        dragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`text-xs ${getServiceTypeBadgeClass(service.service_type)}`}
          >
            {getServiceIcon(service.service_type)}
            <span className="ml-1">{getServiceTypeLabel(service.service_type)}</span>
          </Badge>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div>
          <h4 className="font-medium text-sm text-foreground line-clamp-2">
            {service.product_name}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {service.client?.company_name || service.client?.full_name || 'N/A'}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tiến độ</span>
            <span>{stageIndex + 1}/7</span>
          </div>
          <Progress value={((stageIndex + 1) / 7) * 100} className="h-1" />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {service.assigned_staff && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{service.assigned_staff.full_name || 'Staff'}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(service.updated_at)}</span>
          </div>
        </div>

        {service.fda_code && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-mono text-primary">{service.fda_code}</p>
          </div>
        )}

        <div className="flex justify-end">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

interface ColumnState {
  items: Service[]
  total: number
  loadingMore: boolean
}

type ColumnsMap = Record<string, ColumnState>

const ALL_TYPES: ServiceType[] = ['food', 'cosmetics', 'medical_device']

export function KanbanBoard() {
  const [columns, setColumns] = useState<ColumnsMap>({})
  const [terminalCounts, setTerminalCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [filterTypes, setFilterTypes] = useState<ServiceType[]>(ALL_TYPES)

  // (Re)load all columns whenever the type filter changes.
  const loadBoard = useCallback(async (types: ServiceType[]) => {
    setIsLoading(true)
    try {
      const [activeResults, terminalResults] = await Promise.all([
        Promise.all(
          ACTIVE_PIPELINE_STAGES.map((stage) =>
            getPipelineServices({ stage: stage.value, serviceTypes: types, limit: PAGE_SIZE }),
          ),
        ),
        Promise.all(
          TERMINAL_PIPELINE_STAGES.map((stage) => getStageCount(stage.value, types)),
        ),
      ])

      const nextColumns: ColumnsMap = {}
      ACTIVE_PIPELINE_STAGES.forEach((stage, i) => {
        nextColumns[stage.value] = {
          items: activeResults[i].services,
          total: activeResults[i].total,
          loadingMore: false,
        }
      })
      setColumns(nextColumns)

      const nextTerminal: Record<string, number> = {}
      TERMINAL_PIPELINE_STAGES.forEach((stage, i) => {
        nextTerminal[stage.value] = terminalResults[i]
      })
      setTerminalCounts(nextTerminal)
    } catch (error) {
      console.error('[v0] Error loading kanban board:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBoard(filterTypes)
  }, [filterTypes, loadBoard])

  const handleLoadMore = async (stage: PipelineStage) => {
    const column = columns[stage]
    if (!column) return
    setColumns((prev) => ({ ...prev, [stage]: { ...prev[stage], loadingMore: true } }))
    try {
      const { services } = await getPipelineServices({
        stage,
        serviceTypes: filterTypes,
        limit: PAGE_SIZE,
        offset: column.items.length,
      })
      setColumns((prev) => ({
        ...prev,
        [stage]: {
          ...prev[stage],
          items: [...prev[stage].items, ...services],
          loadingMore: false,
        },
      }))
    } catch (error) {
      console.error('[v0] Error loading more services:', error)
      setColumns((prev) => ({ ...prev, [stage]: { ...prev[stage], loadingMore: false } }))
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    const fromStage = source.droppableId as PipelineStage
    const toStage = destination.droppableId as PipelineStage
    if (fromStage === toStage) return

    const sourceCol = columns[fromStage]
    const dragged = sourceCol?.items.find((s) => s.id === draggableId)
    if (!dragged) return

    const isTerminalDest = TERMINAL_PIPELINE_STAGES.some((s) => s.value === toStage)

    // Optimistic update.
    setColumns((prev) => {
      const next = { ...prev }
      // Remove from source.
      next[fromStage] = {
        ...prev[fromStage],
        items: prev[fromStage].items.filter((s) => s.id !== draggableId),
        total: Math.max(0, prev[fromStage].total - 1),
      }
      // Add to destination if it's an active column.
      if (!isTerminalDest && prev[toStage]) {
        const moved = { ...dragged, current_stage: toStage }
        const items = [...prev[toStage].items]
        items.splice(destination.index, 0, moved)
        next[toStage] = {
          ...prev[toStage],
          items,
          total: prev[toStage].total + 1,
        }
      }
      return next
    })

    if (isTerminalDest) {
      setTerminalCounts((prev) => ({ ...prev, [toStage]: (prev[toStage] ?? 0) + 1 }))
    }

    try {
      await updateServiceStage(draggableId, toStage)
    } catch (error) {
      console.error('[v0] Error updating service stage:', error)
      // Revert by reloading the board for consistency.
      loadBoard(filterTypes)
    }
  }

  const toggleType = (type: ServiceType, checked: boolean) => {
    setFilterTypes((prev) =>
      checked ? [...prev, type] : prev.filter((t) => t !== type),
    )
  }

  const totalActive = ACTIVE_PIPELINE_STAGES.reduce(
    (sum, s) => sum + (columns[s.value]?.total ?? 0),
    0,
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Lọc theo loại
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuCheckboxItem
                checked={filterTypes.includes('food')}
                onCheckedChange={(c) => toggleType('food', c)}
              >
                <Utensils className="h-4 w-4 mr-2 text-emerald-400" />
                Thực phẩm
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterTypes.includes('cosmetics')}
                onCheckedChange={(c) => toggleType('cosmetics', c)}
              >
                <Sparkles className="h-4 w-4 mr-2 text-fuchsia-400" />
                Mỹ phẩm
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterTypes.includes('medical_device')}
                onCheckedChange={(c) => toggleType('medical_device', c)}
              >
                <Stethoscope className="h-4 w-4 mr-2 text-cyan-400" />
                Thiết bị Y tế
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/dashboard/pipeline/archive">
              <Archive className="h-4 w-4" />
              Dịch vụ đã hoàn tất
            </Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {totalActive} dịch vụ đang xử lý
        </p>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {/* Active stage columns (paginated) */}
            {ACTIVE_PIPELINE_STAGES.map((stage, index) => {
              const column = columns[stage.value]
              const items = column?.items ?? []
              const total = column?.total ?? 0
              const hasMore = items.length < total

              return (
                <Droppable key={stage.value} droppableId={stage.value}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-col min-w-[300px] max-w-[300px]"
                    >
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                            {index + 1}
                          </div>
                          <h3 className="font-medium text-sm text-foreground">
                            {stage.label}
                          </h3>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {total}
                        </Badge>
                      </div>

                      <div
                        className={`flex-1 space-y-3 p-2 rounded-lg border min-h-[500px] transition-colors ${
                          snapshot.isDraggingOver
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-card/50 border-border'
                        }`}
                      >
                        {items.map((service, serviceIndex) => (
                          <Draggable
                            key={service.id}
                            draggableId={service.id}
                            index={serviceIndex}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                              >
                                <Link href={`/dashboard/service/${service.id}`}>
                                  <ServiceCardBody
                                    service={service}
                                    dragging={dragSnapshot.isDragging}
                                  />
                                </Link>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {items.length === 0 && (
                          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                            Không có dịch vụ
                          </div>
                        )}
                        {provided.placeholder}

                        {hasMore && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-muted-foreground"
                            disabled={column?.loadingMore}
                            onClick={() => handleLoadMore(stage.value)}
                          >
                            {column?.loadingMore ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              `Xem thêm (${total - items.length})`
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              )
            })}

            {/* Terminal stages: compact drop zones linking to the archive */}
            {TERMINAL_PIPELINE_STAGES.map((stage, i) => {
              const count = terminalCounts[stage.value] ?? 0
              return (
                <Droppable key={stage.value} droppableId={stage.value}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-col min-w-[260px] max-w-[260px]"
                    >
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                            {ACTIVE_PIPELINE_STAGES.length + i + 1}
                          </div>
                          <h3 className="font-medium text-sm text-foreground">
                            {stage.label}
                          </h3>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>

                      <div
                        className={`flex-1 flex flex-col items-center justify-center gap-3 p-4 rounded-lg border border-dashed min-h-[500px] text-center transition-colors ${
                          snapshot.isDraggingOver
                            ? 'bg-primary/5 border-primary/40'
                            : 'bg-card/30 border-border'
                        }`}
                      >
                        <CheckCircle2 className="h-8 w-8 text-primary/60" />
                        <div>
                          <p className="text-2xl font-bold text-foreground">{count}</p>
                          <p className="text-xs text-muted-foreground">dịch vụ</p>
                        </div>
                        <p className="text-xs text-muted-foreground px-2">
                          Kéo thẻ vào đây để chuyển sang giai đoạn này.
                        </p>
                        <Button asChild variant="outline" size="sm" className="gap-1">
                          <Link
                            href={`/dashboard/pipeline/archive?stage=${stage.value}`}
                          >
                            Xem tất cả
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        {/* Keep DnD placeholder available but visually hidden */}
                        <div className="hidden">{provided.placeholder}</div>
                      </div>
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DragDropContext>
    </div>
  )
}
