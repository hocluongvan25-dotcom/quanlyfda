import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArchiveList } from '@/components/dashboard/archive-list'
import { TERMINAL_STAGES, type PipelineStage } from '@/lib/types'

export default async function PipelineArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>
}) {
  const { stage } = await searchParams
  const initialStage =
    stage && TERMINAL_STAGES.includes(stage as PipelineStage)
      ? (stage as PipelineStage)
      : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dịch vụ đã hoàn tất
          </h1>
          <p className="text-muted-foreground">
            Tra cứu các dịch vụ đã hoàn tất, bàn giao và đang gia hạn
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/pipeline">
            <ArrowLeft className="h-4 w-4" />
            Về Pipeline
          </Link>
        </Button>
      </div>

      <ArchiveList initialStage={initialStage} />
    </div>
  )
}
