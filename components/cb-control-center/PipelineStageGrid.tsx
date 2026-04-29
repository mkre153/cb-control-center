import type { PipelineStage } from '@/lib/cb-control-center/types'
import { PipelineStageCard } from './PipelineStageCard'

interface PipelineStageGridProps {
  stages: PipelineStage[]
  currentStageName: string
}

export function PipelineStageGrid({ stages, currentStageName }: PipelineStageGridProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pipeline Stages</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {stages.map((stage) => (
          <PipelineStageCard
            key={stage.id}
            stage={stage}
            isCurrent={stage.name === currentStageName}
          />
        ))}
      </div>
    </div>
  )
}
