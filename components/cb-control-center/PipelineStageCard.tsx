import type { PipelineStage, PipelineStatus } from '@/lib/cb-control-center/types'

const statusLabel: Record<PipelineStatus, string> = {
  complete: 'Complete',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  not_started: 'Not Started',
}

const statusBadge: Record<PipelineStatus, string> = {
  complete: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  not_started: 'bg-gray-100 text-gray-500',
}

const borderColor: Record<PipelineStatus, string> = {
  complete: 'border-green-200',
  in_progress: 'border-blue-200',
  blocked: 'border-red-200',
  not_started: 'border-gray-200',
}

interface PipelineStageCardProps {
  stage: PipelineStage
  isCurrent?: boolean
}

export function PipelineStageCard({ stage, isCurrent }: PipelineStageCardProps) {
  const isCurrentBlocked = isCurrent && stage.status === 'blocked'

  return (
    <div
      className={`bg-white rounded-lg border p-4 flex flex-col gap-3 ${
        isCurrentBlocked
          ? 'border-red-300 border-l-4 border-l-red-500 shadow-sm'
          : borderColor[stage.status]
      }`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-gray-900 leading-tight">{stage.name}</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {isCurrent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-900 text-white">
              Current
            </span>
          )}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${statusBadge[stage.status]}`}>
            {statusLabel[stage.status]}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">{stage.summary}</p>

      {stage.blockers.length > 0 && (
        <div className="space-y-1">
          {stage.blockers.map((b, i) => (
            <p key={i} className="text-xs text-red-600 flex items-start gap-1">
              <span className="shrink-0">⚠</span>
              <span>{b}</span>
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
        <span>{stage.artifactCount} artifact{stage.artifactCount !== 1 ? 's' : ''}</span>
        {stage.lastUpdated && <span>{stage.lastUpdated}</span>}
      </div>

      {stage.artifacts.length > 0 && (
        <div className="space-y-0.5">
          {stage.artifacts.map((a, i) => (
            <p key={i} className="text-xs text-gray-400 font-mono">↳ {a}</p>
          ))}
        </div>
      )}

      <button
        disabled
        className={`mt-auto w-full text-xs border rounded-md py-1.5 cursor-not-allowed bg-gray-50 ${
          isCurrentBlocked
            ? 'border-red-200 text-red-400'
            : 'border-gray-100 text-gray-400 opacity-60'
        }`}
      >
        {isCurrentBlocked ? 'Resolve blocker' : stage.primaryAction}
      </button>
    </div>
  )
}
