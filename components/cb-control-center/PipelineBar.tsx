'use client'

import type { PipelineStage } from '@/lib/cb-control-center/types'

interface PipelineBarProps {
  stages: PipelineStage[]
  currentStageIndex: number
  viewingStageIndex: number | null
  onNavigateTo: (index: number) => void
}

export function PipelineBar({ stages, currentStageIndex, viewingStageIndex, onNavigateTo }: PipelineBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-6 px-6 py-2.5">
      <div className="flex items-center gap-1 overflow-x-auto">
        {stages.map((stage, i) => {
          const isCurrent = i === currentStageIndex
          const isViewing = viewingStageIndex !== null && i === viewingStageIndex
          const isCompletedPrior = i < currentStageIndex
          const isFutureLocked = i > currentStageIndex

          const icon = isCompletedPrior
            ? '✓'
            : isCurrent && stage.status === 'blocked'
            ? '⚠'
            : isCurrent && stage.status === 'in_progress'
            ? '→'
            : isCurrent && stage.status === 'complete'
            ? '✓'
            : '○'

          const label = `${i + 1}. ${stage.name}`

          if (isCompletedPrior) {
            const pillClass = [
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-colors',
              isViewing
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold ring-1 ring-blue-200'
                : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300',
            ].join(' ')

            return (
              <div key={stage.id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onNavigateTo(i)}
                  className={pillClass}
                  aria-label={`Review ${stage.name}`}
                >
                  <span className="shrink-0">{icon}</span>
                  <span>{label}</span>
                </button>
                <span className="text-gray-300 text-xs shrink-0">→</span>
              </div>
            )
          }

          if (isCurrent) {
            const pillClass = [
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border font-semibold',
              stage.status === 'blocked'
                ? 'bg-red-50 border-red-400 text-red-700 ring-1 ring-red-200'
                : 'bg-gray-900 border-gray-900 text-white',
            ].join(' ')

            return (
              <div key={stage.id} className="flex items-center gap-1 shrink-0">
                <div className={pillClass} aria-current="step">
                  <span className="shrink-0">{icon}</span>
                  <span>{label}</span>
                </div>
                {i < stages.length - 1 && (
                  <span className="text-gray-300 text-xs shrink-0">→</span>
                )}
              </div>
            )
          }

          // future locked
          return (
            <div key={stage.id} className="flex items-center gap-1 shrink-0">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border bg-gray-50 border-gray-100 text-gray-400 opacity-60"
                title="Locked — complete earlier stages first"
                aria-disabled="true"
              >
                <span className="shrink-0">{icon}</span>
                <span>{label}</span>
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
