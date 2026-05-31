'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Users,
  Utensils,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import {
  SERVICE_TYPES,
  getServiceTypeLabel,
  type ServiceType,
} from '@/lib/types'
import { getCompletionEvents, type CompletionEvent } from '@/app/actions/statistics'

const MONTH_LABELS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
]

const MONTH_SHORT = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

const TYPE_COLOR: Record<ServiceType, string> = {
  food: 'var(--chart-2)',
  cosmetics: 'var(--chart-1)',
  medical_device: 'var(--chart-3)',
}

const DEFAULT_KPI = 10

function typeIcon(type: ServiceType) {
  switch (type) {
    case 'food':
      return <Utensils className="h-4 w-4" />
    case 'cosmetics':
      return <Sparkles className="h-4 w-4" />
    case 'medical_device':
      return <Stethoscope className="h-4 w-4" />
  }
}

function kpiStorageKey(year: number, month: number) {
  return `fda-kpi-target-${year}-${month}`
}

interface StatisticsViewProps {
  initialYear: number
  initialEvents: CompletionEvent[]
}

export function StatisticsView({ initialYear, initialEvents }: StatisticsViewProps) {
  const now = new Date()
  const [year, setYear] = useState(initialYear)
  const [events, setEvents] = useState<CompletionEvent[]>(initialEvents)
  const [selectedMonth, setSelectedMonth] = useState(
    initialYear === now.getFullYear() ? now.getMonth() + 1 : 12,
  )
  const [kpiTarget, setKpiTarget] = useState<number>(DEFAULT_KPI)
  const [isPending, startTransition] = useTransition()

  // Load the saved KPI target whenever the selected month/year changes.
  useEffect(() => {
    const saved = localStorage.getItem(kpiStorageKey(year, selectedMonth))
    setKpiTarget(saved !== null ? Number(saved) : DEFAULT_KPI)
  }, [year, selectedMonth])

  function handleTargetChange(value: number) {
    const safe = Number.isFinite(value) && value >= 0 ? value : 0
    setKpiTarget(safe)
    localStorage.setItem(kpiStorageKey(year, selectedMonth), String(safe))
  }

  function handleYearChange(value: string) {
    const newYear = Number(value)
    setYear(newYear)
    startTransition(async () => {
      const data = await getCompletionEvents(newYear)
      setEvents(data)
    })
  }

  // Year options: a small window around the current year.
  const yearOptions = useMemo(() => {
    const base = now.getFullYear()
    return [base + 1, base, base - 1, base - 2, base - 3]
  }, [now])

  // Counts for each month of the selected year (index 0 = January).
  const monthlyCounts = useMemo(() => {
    const counts = new Array(12).fill(0)
    for (const e of events) {
      if (e.year === year) counts[e.month - 1] += 1
    }
    return counts
  }, [events, year])

  const monthEvents = useMemo(
    () => events.filter((e) => e.year === year && e.month === selectedMonth),
    [events, year, selectedMonth],
  )

  const monthTotal = monthEvents.length

  // Previous month total (rolls back to December of the prior year for January).
  const prevTotal = useMemo(() => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
    const prevYear = selectedMonth === 1 ? year - 1 : year
    return events.filter((e) => e.year === prevYear && e.month === prevMonth).length
  }, [events, year, selectedMonth])

  const diff = monthTotal - prevTotal
  const diffPct = prevTotal > 0 ? Math.round((diff / prevTotal) * 100) : null

  const kpiMet = monthTotal >= kpiTarget && kpiTarget > 0
  const kpiPct = kpiTarget > 0 ? Math.min(100, Math.round((monthTotal / kpiTarget) * 100)) : 0

  // Breakdown by service type for the selected month.
  const byType = useMemo(() => {
    return SERVICE_TYPES.map((t) => ({
      type: t.value,
      label: t.label,
      count: monthEvents.filter((e) => e.service_type === t.value).length,
      fill: TYPE_COLOR[t.value],
    }))
  }, [monthEvents])

  // Breakdown by assigned staff for the selected month.
  const byStaff = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of monthEvents) {
      const name = e.staff_name ?? 'Chưa phân công'
      map.set(name, (map.get(name) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [monthEvents])

  const yearTotal = monthlyCounts.reduce((a, b) => a + b, 0)

  const monthlyChartData = monthlyCounts.map((count, i) => ({
    month: MONTH_SHORT[i],
    count,
    active: i + 1 === selectedMonth,
  }))

  const barConfig: ChartConfig = {
    count: { label: 'Hoàn tất', color: 'var(--chart-1)' },
  }

  const typeConfig: ChartConfig = {
    count: { label: 'Dịch vụ' },
    food: { label: 'Thực phẩm', color: TYPE_COLOR.food },
    cosmetics: { label: 'Mỹ phẩm', color: TYPE_COLOR.cosmetics },
    medical_device: { label: 'Thiết bị Y tế', color: TYPE_COLOR.medical_device },
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-end md:justify-between">
          <div className="grid grid-cols-2 gap-4 md:flex md:items-end">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Năm</Label>
              <Select value={String(year)} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Năm {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tháng</Label>
              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => setSelectedMonth(Number(v))}
              >
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_LABELS.map((label, i) => (
                    <SelectItem key={label} value={String(i + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kpi-target" className="text-xs text-muted-foreground">
              Chỉ tiêu KPI (dịch vụ / tháng)
            </Label>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <Input
                id="kpi-target"
                type="number"
                min={0}
                value={kpiTarget}
                onChange={(e) => handleTargetChange(Number(e.target.value))}
                className="w-28"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI status */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className={`border lg:col-span-2 ${
            kpiMet ? 'border-success/40 bg-success/5' : 'border-warning/40 bg-warning/5'
          }`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">
                  {MONTH_LABELS[selectedMonth - 1]} / {year}
                </CardTitle>
                <CardDescription>
                  Dịch vụ hoàn tất &amp; bàn giao trong tháng
                </CardDescription>
              </div>
              {kpiMet ? (
                <Badge className="bg-success/20 text-success border-success/30 gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đạt KPI
                </Badge>
              ) : (
                <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Chưa đạt
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-foreground">{monthTotal}</span>
              <span className="mb-1 text-muted-foreground">/ {kpiTarget} mục tiêu</span>
            </div>
            <Progress value={kpiPct} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{kpiPct}% chỉ tiêu</span>
              {monthTotal < kpiTarget ? (
                <span className="text-warning">Còn thiếu {kpiTarget - monthTotal} dịch vụ</span>
              ) : (
                <span className="text-success">Vượt {monthTotal - kpiTarget} dịch vụ</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              So với tháng trước
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {diff > 0 ? (
                <TrendingUp className="h-6 w-6 text-success" />
              ) : diff < 0 ? (
                <TrendingDown className="h-6 w-6 text-destructive" />
              ) : (
                <Minus className="h-6 w-6 text-muted-foreground" />
              )}
              <span
                className={`text-2xl font-bold ${
                  diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {diff > 0 ? '+' : ''}
                {diff}
              </span>
              {diffPct !== null && (
                <span className="text-sm text-muted-foreground">({diffPct > 0 ? '+' : ''}{diffPct}%)</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tháng trước: {prevTotal} dịch vụ
            </p>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Tổng cả năm {year}</p>
              <p className="text-xl font-bold text-foreground">{yearTotal} dịch vụ</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" />
            Dịch vụ hoàn thành theo tháng — {year}
          </CardTitle>
          <CardDescription>
            Đường ngang thể hiện chỉ tiêu KPI ({kpiTarget} dịch vụ). Cột sáng là tháng đang chọn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground">
              Đang tải dữ liệu...
            </div>
          ) : (
            <ChartContainer config={barConfig} className="h-[280px] w-full">
              <BarChart data={monthlyChartData} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {kpiTarget > 0 && (
                  <ReferenceLine
                    y={kpiTarget}
                    stroke="var(--warning)"
                    strokeDasharray="4 4"
                    label={{ value: 'KPI', position: 'right', fill: 'var(--warning)', fontSize: 11 }}
                  />
                )}
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {monthlyChartData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.active ? 'var(--chart-1)' : 'var(--muted-foreground)'}
                      fillOpacity={d.active ? 1 : 0.35}
                      cursor="pointer"
                      onClick={() => setSelectedMonth(i + 1)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By type */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Phân loại theo dịch vụ</CardTitle>
            <CardDescription>{MONTH_LABELS[selectedMonth - 1]} / {year}</CardDescription>
          </CardHeader>
          <CardContent>
            {monthTotal === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground">
                Không có dịch vụ hoàn thành trong tháng này
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ChartContainer config={typeConfig} className="h-[200px] w-full sm:w-1/2">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                    <Pie
                      data={byType.filter((d) => d.count > 0)}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={50}
                      strokeWidth={2}
                    >
                      {byType
                        .filter((d) => d.count > 0)
                        .map((d) => (
                          <Cell key={d.type} fill={d.fill} />
                        ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="w-full space-y-2 sm:w-1/2">
                  {byType.map((d) => (
                    <div
                      key={d.type}
                      className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        <span
                          className="inline-block h-3 w-3 rounded-sm"
                          style={{ backgroundColor: d.fill }}
                        />
                        {typeIcon(d.type)}
                        {d.label}
                      </span>
                      <span className="font-semibold text-foreground">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By staff */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Theo nhân viên phụ trách
            </CardTitle>
            <CardDescription>{MONTH_LABELS[selectedMonth - 1]} / {year}</CardDescription>
          </CardHeader>
          <CardContent>
            {byStaff.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground">
                Không có dữ liệu
              </div>
            ) : (
              <div className="space-y-3">
                {byStaff.map((s) => {
                  const pct = monthTotal > 0 ? (s.count / monthTotal) * 100 : 0
                  return (
                    <div key={s.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{s.name}</span>
                        <span className="font-semibold text-foreground">{s.count}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed services list */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Danh sách dịch vụ hoàn thành — {MONTH_LABELS[selectedMonth - 1]} / {year}
          </CardTitle>
          <CardDescription>{monthTotal} dịch vụ</CardDescription>
        </CardHeader>
        <CardContent>
          {monthEvents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Chưa có dịch vụ nào hoàn thành trong tháng này
            </div>
          ) : (
            <div className="divide-y divide-border">
              {monthEvents.map((e, i) => (
                <div key={`${e.service_id}-${i}`} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{typeIcon(e.service_type)}</span>
                    <div>
                      <p className="font-medium text-foreground">{e.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getServiceTypeLabel(e.service_type)} · {e.staff_name ?? 'Chưa phân công'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.completed_at).toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
