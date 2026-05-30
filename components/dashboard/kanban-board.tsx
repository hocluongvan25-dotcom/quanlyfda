'use client'

import { useState, useEffect } from 'react'
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
  PIPELINE_STAGES, 
  getServiceTypeLabel, 
  getStageIndex,
  type Service, 
  type PipelineStage,
  type ServiceType 
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
} from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { updateServiceStage } from '@/app/actions/services'

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
    day: 'numeric'
  })
}

interface ServiceCardProps {
  service: Service
}

function ServiceCard({ service }: ServiceCardProps) {
  const stageIndex = getStageIndex(service.current_stage)
  const progress = ((stageIndex + 1) / 7) * 100

  return (
    <Link href={`/dashboard/service/${service.id}`}>
      <Card className="bg-secondary/80 border-border hover:bg-secondary transition-colors cursor-pointer group">
        <CardContent className="p-3 space-y-3">
          {/* Type Badge */}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-xs ${getServiceTypeBadgeClass(service.service_type)}`}
            >
              {getServiceIcon(service.service_type)}
              <span className="ml-1">{getServiceTypeLabel(service.service_type)}</span>
            </Badge>
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Service Name */}
          <div>
            <h4 className="font-medium text-sm text-foreground line-clamp-2">
              {service.product_name}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {service.client?.company_name || service.client?.full_name || 'N/A'}
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tiến độ</span>
              <span>{stageIndex + 1}/7</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          {/* Meta Info */}
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

          {/* FDA Code if available */}
          {service.fda_code && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-mono text-primary">{service.fda_code}</p>
            </div>
          )}

          {/* View Arrow */}
          <div className="flex justify-end">
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

interface KanbanColumnProps {
  stage: typeof PIPELINE_STAGES[0]
  services: Service[]
  index: number
}

function KanbanColumn({ stage, services, index }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
            {index + 1}
          </div>
          <h3 className="font-medium text-sm text-foreground">{stage.label}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {services.length}
        </Badge>
      </div>
      
      <div className="flex-1 space-y-3 p-2 rounded-lg bg-card/50 border border-border min-h-[500px]">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
        {services.length === 0 && (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            Không có dịch vụ
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterTypes, setFilterTypes] = useState<ServiceType[]>(['food', 'cosmetics', 'medical_device'])
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    async function fetchServices() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          client:profiles!services_client_id_fkey(*),
          assigned_staff:profiles!services_assigned_staff_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[v0] Error fetching services:', error)
      } else {
        setServices(data as Service[])
      }
      setIsLoading(false)
    }

    fetchServices()
  }, [])

  const filteredServices = services.filter(s => filterTypes.includes(s.service_type))

  const getServicesForStage = (stageValue: PipelineStage) => {
    return filteredServices.filter(s => s.current_stage === stageValue)
  }

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false)
    const { source, destination, draggableId } = result

    // If dropped outside a droppable area
    if (!destination) {
      return
    }

    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    // Get the service that was dragged
    const draggedService = services.find(s => s.id === draggableId)
    if (!draggedService) return

    // Get the destination stage
    const destinationStage = PIPELINE_STAGES.find(
      s => s.value === destination.droppableId
    )
    if (!destinationStage) return

    // Update the service stage optimistically
    setServices(prev =>
      prev.map(s =>
        s.id === draggableId
          ? { ...s, current_stage: destinationStage.value as PipelineStage }
          : s
      )
    )

    // Call the server action to update the database
    try {
      await updateServiceStage(draggableId, destinationStage.value as PipelineStage)
    } catch (error) {
      console.error('[v0] Error updating service stage:', error)
      // Revert on error
      setServices(prev =>
        prev.map(s =>
          s.id === draggableId
            ? { ...s, current_stage: draggedService.current_stage }
            : s
        )
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
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
                onCheckedChange={(checked) => {
                  setFilterTypes(prev =>
                    checked
                      ? [...prev, 'food']
                      : prev.filter(t => t !== 'food')
                  )
                }}
              >
                <Utensils className="h-4 w-4 mr-2 text-emerald-400" />
                Thực phẩm
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterTypes.includes('cosmetics')}
                onCheckedChange={(checked) => {
                  setFilterTypes(prev =>
                    checked
                      ? [...prev, 'cosmetics']
                      : prev.filter(t => t !== 'cosmetics')
                  )
                }}
              >
                <Sparkles className="h-4 w-4 mr-2 text-fuchsia-400" />
                Mỹ phẩm
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterTypes.includes('medical_device')}
                onCheckedChange={(checked) => {
                  setFilterTypes(prev =>
                    checked
                      ? [...prev, 'medical_device']
                      : prev.filter(t => t !== 'medical_device')
                  )
                }}
              >
                <Stethoscope className="h-4 w-4 mr-2 text-cyan-400" />
                Thiết bị Y tế
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground">
          {filteredServices.length} dịch vụ
        </p>
      </div>

      {/* Kanban Board */}
      <DragDropContext
        onDragEnd={handleDragEnd}
        onDragStart={() => setIsDragging(true)}
      >
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {PIPELINE_STAGES.map((stage, index) => (
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
                        <h3 className="font-medium text-sm text-foreground">{stage.label}</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getServicesForStage(stage.value).length}
                      </Badge>
                    </div>

                    <div
                      className={`flex-1 space-y-3 p-2 rounded-lg border min-h-[500px] transition-colors ${
                        snapshot.isDraggingOver
                          ? 'bg-primary/5 border-primary/30'
                          : 'bg-card/50 border-border'
                      }`}
                    >
                      {getServicesForStage(stage.value).map((service, serviceIndex) => (
                        <Draggable
                          key={service.id}
                          draggableId={service.id}
                          index={serviceIndex}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Link href={`/dashboard/service/${service.id}`}>
                                <Card
                                  className={`bg-secondary/80 border-border hover:bg-secondary transition-all cursor-grab active:cursor-grabbing ${
                                    snapshot.isDragging
                                      ? 'shadow-lg ring-2 ring-primary'
                                      : ''
                                  }`}
                                >
                                  <CardContent className="p-3 space-y-3">
                                    {/* Type Badge */}
                                    <div className="flex items-center justify-between">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${getServiceTypeBadgeClass(
                                          service.service_type
                                        )}`}
                                      >
                                        {getServiceIcon(service.service_type)}
                                        <span className="ml-1">
                                          {getServiceTypeLabel(service.service_type)}
                                        </span>
                                      </Badge>
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>

                                    {/* Service Name */}
                                    <div>
                                      <h4 className="font-medium text-sm text-foreground line-clamp-2">
                                        {service.product_name}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {service.client?.company_name ||
                                          service.client?.full_name ||
                                          'N/A'}
                                      </p>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Tiến độ</span>
                                        <span>{getStageIndex(service.current_stage) + 1}/7</span>
                                      </div>
                                      <Progress
                                        value={
                                          ((getStageIndex(service.current_stage) + 1) / 7) *
                                          100
                                        }
                                        className="h-1"
                                      />
                                    </div>

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      {service.assigned_staff && (
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          <span>
                                            {service.assigned_staff.full_name || 'Staff'}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDate(service.updated_at)}</span>
                                      </div>
                                    </div>

                                    {/* FDA Code if available */}
                                    {service.fda_code && (
                                      <div className="pt-2 border-t border-border">
                                        <p className="text-xs font-mono text-primary">
                                          {service.fda_code}
                                        </p>
                                      </div>
                                    )}

                                    {/* View Arrow */}
                                    <div className="flex justify-end">
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {getServicesForStage(stage.value).length === 0 && (
                        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                          Không có dịch vụ
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DragDropContext>
    </div>
  )
}
