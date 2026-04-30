'use client'

import type { EnrichedBlocker, BlockerSeverity } from '@/lib/cb-control-center/types'

const severityConfig: Record<BlockerSeverity, { label: string; badge: string; border: string }> = {
  high:   { label: 'High',   badge: 'bg-red-100 text-red-700',     border: 'border-l-red-500' },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-400' },
  low:    { label: 'Low',    badge: 'bg-gray-100 text-gray-500',   border: 'border-l-gray-300' },
}

interface BlockerTaskListProps {
  blockers: EnrichedBlocker[]
  onResolveBlocker?: (id: string, type: 'confirm' | 'defer') => void
}

export function BlockerTaskList({ blockers, onResolveBlocker }: BlockerTaskListProps) {
  const openCount = blockers.filter(b => b.resolutionStatus === 'open').length
  const allResolved = openCount === 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Required Actions</p>
        {allResolved ? (
          <span className="text-xs font-semibold text-green-600">All resolved ✓</span>
        ) : (
          <span className="text-xs font-medium text-red-600">{openCount} open</span>
        )}
      </div>

      {blockers.length === 0 && (
        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          <p className="text-sm text-green-700">No blockers for this stage.</p>
        </div>
      )}

      {blockers.map((b) => {
        const cfg = severityConfig[b.severity]
        const resolved = b.resolutionStatus === 'resolved'

        return (
          <div
            key={b.id}
            className={`bg-white border border-l-4 rounded-lg overflow-hidden transition-opacity ${
              resolved
                ? 'border-l-green-400 border-gray-100 opacity-60'
                : `${cfg.border} border-gray-200`
            }`}
          >
            {/* Header row */}
            <div className="px-4 py-3 flex items-start gap-3">
              <span className={`mt-0.5 shrink-0 w-4 h-4 border-2 rounded flex items-center justify-center ${
                resolved ? 'border-green-400 bg-green-50 text-green-600' : 'border-gray-300'
              }`}>
                {resolved && <span className="text-[9px] leading-none font-bold">✓</span>}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${resolved ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {b.title}
                </p>
                {!resolved && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.description}</p>
                )}
              </div>
              {!resolved && (
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded font-medium ${cfg.badge}`}>
                  {cfg.label}
                </span>
              )}
            </div>

            {/* Details + actions */}
            {!resolved && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                {b.requiredEvidence.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Required Evidence</p>
                    <ul className="space-y-1">
                      {b.requiredEvidence.map((e, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="mt-0.5 w-3 h-3 shrink-0 border border-gray-300 rounded inline-block" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {b.downstreamUnlockImpact.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Unlocks</p>
                    <div className="flex flex-wrap gap-1">
                      {b.downstreamUnlockImpact.map((impact, i) => (
                        <span key={i} className="text-xs text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded">
                          → {impact}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {b.resolutionOptions.map((opt) => {
                    const type = opt.type as 'confirm' | 'defer'
                    const isConfirm = type === 'confirm'
                    const canResolve = !!onResolveBlocker
                    return (
                      <button
                        key={opt.type}
                        disabled={!canResolve}
                        onClick={() => onResolveBlocker?.(b.id, type)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                          isConfirm
                            ? canResolve
                              ? 'border-green-400 text-green-700 bg-green-50 hover:bg-green-100 cursor-pointer'
                              : 'border-green-200 text-green-600 opacity-50 cursor-not-allowed'
                            : canResolve
                            ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 cursor-pointer'
                            : 'border-amber-200 text-amber-600 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                  {!onResolveBlocker && (
                    <p className="text-xs text-gray-400 self-center">Actions disabled in this simulation state.</p>
                  )}
                </div>
              </div>
            )}

            {resolved && (
              <div className="px-4 pb-3">
                <p className="text-xs text-green-600">Resolved in mock mode — schema fields updated.</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
