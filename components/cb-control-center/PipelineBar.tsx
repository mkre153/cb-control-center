import type { PipelineStage, PipelineStatus } from '@/lib/cb-control-center/types'

const statusIcon: Record<PipelineStatus, string> = {
  complete:    '✓',
  in_progress: '→',
  blocked:     '⚠',
  not_started: '○',
}

function stageStyle(stage: PipelineStage, isCurrent: boolean): string {
  const isLocked = stage.locked && stage.status === 'not_started'
  if (isCurrent && stage.status === 'blocked') {
    return 'bg-red-50 border-red-400 text-red-700 font-semibold ring-1 ring-red-200'
  }
  if (isCurrent) {
    return 'bg-gray-900 border-gray-900 text-white font-semibold'
  }
  if (stage.status === 'complete') return 'bg-green-50 border-green-200 text-green-700'
  if (stage.status === 'in_progress') return 'bg-blue-50 border-blue-200 text-blue-700'
  if (stage.status === 'blocked') return 'bg-red-50 border-red-200 text-red-600'
  if (isLocked) return 'bg-gray-50 border-gray-100 text-gray-400'
  return 'bg-white border-gray-200 text-gray-500'
}

interface PipelineBarProps {
  stages: PipelineStage[]
  currentStageName: string
}

export function PipelineBar({ stages, currentStageName }: PipelineBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-6 px-6 py-2.5">
      <div className="flex items-center gap-1 overflow-x-auto">
        {stages.map((stage, i) => {
          const isCurrent = stage.name === currentStageName
          return (
            <div key={stage.id} className="flex items-center gap-1 shrink-0">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${stageStyle(stage, isCurrent)}`}>
                <span className="shrink-0">{statusIcon[stage.status]}</span>
                <span>{i + 1}. {stage.name}</span>
              </div>
              {i < stages.length - 1 && (
                <span className="text-gray-300 text-xs shrink-0">→</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
