import type { EnrichedBlocker, BlockerSeverity } from '@/lib/cb-control-center/types'

const severityConfig: Record<BlockerSeverity, { label: string; className: string; borderClass: string }> = {
  high:   { label: 'High',   className: 'bg-red-100 text-red-700',     borderClass: 'border-l-red-500' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700', borderClass: 'border-l-amber-400' },
  low:    { label: 'Low',    className: 'bg-gray-100 text-gray-500',   borderClass: 'border-l-gray-300' },
}

export function BlockersTab({ blockers }: { blockers: EnrichedBlocker[] }) {
  const openCount = blockers.filter(b => b.resolutionStatus === 'open').length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
        <span className="text-xs font-semibold text-red-700">{openCount} open blocker{openCount !== 1 ? 's' : ''}</span>
        <span className="text-xs text-red-600">— All blockers must be resolved or deferred before Business Truth JSON can be finalized.</span>
      </div>

      {blockers.map((b) => {
        const cfg = severityConfig[b.severity]
        return (
          <div key={b.id} className={`border border-l-4 ${cfg.borderClass} border-gray-100 rounded-lg overflow-hidden`}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${cfg.className}`}>
                  {cfg.label}
                </span>
                <p className="text-sm font-semibold text-gray-800">{b.title}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                b.resolutionStatus === 'open' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
              }`}>
                {b.resolutionStatus === 'open' ? 'Open' : 'Resolved'}
              </span>
            </div>

            <div className="px-4 py-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Related Section</p>
                  <p className="text-sm text-gray-700">{b.relatedSection}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Affected Fields</p>
                  <div className="flex flex-wrap gap-1">
                    {b.affectedFields.map((f) => (
                      <span key={f} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{f}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{b.description}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Why It Matters</p>
                <p className="text-sm text-gray-600 leading-relaxed">{b.whyItMatters}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Required Evidence</p>
                <ul className="space-y-1">
                  {b.requiredEvidence.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 w-4 h-4 shrink-0 border border-gray-300 rounded inline-flex items-center justify-center" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Gate Condition</p>
                <p className="text-sm text-gray-700 leading-relaxed">{b.gateCondition}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Downstream Unlock Impact</p>
                <ul className="space-y-1">
                  {b.downstreamUnlockImpact.map((impact, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="text-green-500">→</span>
                      {impact}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Resolution Options</p>
                <div className="flex flex-wrap gap-2">
                  {b.resolutionOptions.map((opt) => (
                    <button
                      key={opt.type}
                      disabled
                      className={`px-3 py-1.5 text-sm font-medium rounded-md border opacity-50 cursor-not-allowed ${
                        opt.type === 'confirm'
                          ? 'border-green-300 text-green-700 bg-green-50'
                          : opt.type === 'defer'
                          ? 'border-amber-300 text-amber-700 bg-amber-50'
                          : 'border-red-300 text-red-700 bg-red-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Actions disabled in mock mode.</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
