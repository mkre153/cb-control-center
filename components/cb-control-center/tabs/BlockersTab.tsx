import type { PipelineBlocker, BlockerSeverity } from '@/lib/cb-control-center/types'

const severityClass: Record<BlockerSeverity, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-500',
}

export function BlockersTab({ blockers }: { blockers: PipelineBlocker[] }) {
  return (
    <div className="space-y-3">
      {blockers.map((b) => (
        <div key={b.id} className="border border-gray-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${severityClass[b.severity]}`}>
              {b.severity}
            </span>
            <span className="text-xs text-gray-400">Stage: {b.stage}</span>
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-3">{b.blocker}</p>
          <div className="space-y-1.5">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Why it matters:</span>{' '}
              <span className="text-gray-500">{b.whyItMatters}</span>
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Next action:</span>{' '}
              <span className="text-gray-500">{b.nextAction}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
