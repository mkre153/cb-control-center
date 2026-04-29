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

interface PipelineStageCardProps {
  stage: PipelineStage
  isCurrent?: boolean
}

export function PipelineStageCard({ stage, isCurrent }: PipelineStageCardProps) {
  const isCurrentBlocked = isCurrent && stage.status === 'blocked'
  const isCurrentActive = isCurrent && stage.status === 'in_progress'
  const isLocked = stage.locked && stage.status === 'not_started'

  const borderClass = isCurrentBlocked
    ? 'border-red-300 border-l-4 border-l-red-500 shadow-sm'
    : isCurrentActive
    ? 'border-blue-300 border-l-4 border-l-blue-500 shadow-sm'
    : isLocked
    ? 'border-gray-100 bg-gray-50/50'
    : stage.status === 'complete'
    ? 'border-green-200'
    : stage.status === 'in_progress'
    ? 'border-blue-200'
    : stage.status === 'blocked'
    ? 'border-red-200'
    : 'border-gray-200'

  return (
    <div className={`bg-white rounded-lg border p-4 flex flex-col gap-3 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className={`text-sm font-semibold leading-tight ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
          {stage.name}
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {isCurrent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-900 text-white">
              Current
            </span>
          )}
          {isLocked ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400">
              Locked
            </span>
          ) : (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${statusBadge[stage.status]}`}>
              {statusLabel[stage.status]}
            </span>
          )}
        </div>
      </div>

      <p className={`text-xs leading-relaxed ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
        {stage.summary}
      </p>

      {stage.blockers.length > 0 && !isLocked && (
        <div className="space-y-1">
          {stage.blockers.map((b, i) => (
            <p key={i} className="text-xs text-red-600 flex items-start gap-1">
              <span className="shrink-0">⚠</span>
              <span>{b}</span>
            </p>
          ))}
        </div>
      )}

      {isLocked && (
        <p className="text-xs text-gray-400 italic">Waiting for prerequisite stages to complete.</p>
      )}

      <div className={`flex items-center justify-between text-xs pt-1 border-t border-gray-50 ${isLocked ? 'text-gray-300' : 'text-gray-400'}`}>
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
        className={`mt-auto w-full text-xs border rounded-md py-1.5 cursor-not-allowed ${
          isCurrentBlocked
            ? 'border-red-200 text-red-400 bg-gray-50'
            : isCurrentActive
            ? 'border-blue-200 text-blue-400 bg-blue-50/30'
            : isLocked
            ? 'border-gray-100 text-gray-300 bg-gray-50'
            : 'border-gray-100 text-gray-400 bg-gray-50 opacity-60'
        }`}
      >
        {isCurrentBlocked ? 'Resolve blocker' : isLocked ? 'Locked' : stage.primaryAction}
      </button>
    </div>
  )
}
