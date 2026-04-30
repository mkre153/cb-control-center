import type { PipelineStatus } from '@/lib/cb-control-center/types'

interface CommandHeaderProps {
  businessName: string
  category: string
  stage: string
  status: PipelineStatus
  readiness: number
  primaryBlocker: string
  correctNextAction: string
  allBlockersResolved: boolean
  nextStateLabel?: string
  onAdvance?: () => void
}

const statusCfg: Record<PipelineStatus, { pill: string; dot: string; label: string }> = {
  complete:    { pill: 'bg-green-900/60 text-green-300',  dot: 'bg-green-400',  label: 'Complete' },
  in_progress: { pill: 'bg-blue-900/60 text-blue-300',    dot: 'bg-blue-400',   label: 'In Progress' },
  blocked:     { pill: 'bg-red-900/60 text-red-300',      dot: 'bg-red-400',    label: 'Blocked' },
  not_started: { pill: 'bg-gray-700 text-gray-400',       dot: 'bg-gray-500',   label: 'Not Started' },
}

export function CommandHeader({
  businessName,
  category,
  stage,
  status,
  readiness,
  primaryBlocker,
  correctNextAction,
  allBlockersResolved,
  nextStateLabel,
  onAdvance,
}: CommandHeaderProps) {
  const cfg = statusCfg[allBlockersResolved ? 'complete' : status]
  const pillLabel = allBlockersResolved ? 'Ready to Advance' : cfg.label

  return (
    <div className="bg-gray-900 text-white rounded-lg px-6 py-5 space-y-4">
      {/* Breadcrumb */}
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
        CB Control Center
        <span className="mx-1.5 text-gray-700">·</span>
        {businessName}
        {category && <span className="text-gray-600"> — {category}</span>}
      </p>

      {/* Status + readiness row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
              {pillLabel} at {stage}
            </span>
            <span className="text-xs text-gray-400 font-medium">{readiness}% ready</span>
          </div>

          {allBlockersResolved ? (
            <p className="text-sm text-green-300 leading-relaxed">
              All blockers resolved.{nextStateLabel ? ` Ready to advance to ${nextStateLabel}.` : ' Pipeline can proceed.'}
            </p>
          ) : (
            <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">{primaryBlocker}</p>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="w-28">
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all ${allBlockersResolved ? 'bg-green-400' : 'bg-blue-400'}`}
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Next action + CTA */}
      <div className="flex items-start justify-between gap-4 pt-3 border-t border-gray-800">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Next Action</p>
          <p className="text-sm text-gray-400 leading-relaxed">{correctNextAction}</p>
        </div>

        <div className="shrink-0">
          {allBlockersResolved && onAdvance ? (
            <button
              onClick={onAdvance}
              className="px-4 py-2 text-sm font-semibold bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors"
            >
              Advance → {nextStateLabel}
            </button>
          ) : (
            <a
              href="#blockers-workspace"
              className="inline-block px-4 py-2 text-sm font-semibold bg-white text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            >
              Resolve Blockers
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
