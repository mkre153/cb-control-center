import type { CurrentCommand, PipelineStatus } from '@/lib/cb-control-center/types'

const statusLabel: Record<PipelineStatus, string> = {
  complete: 'Complete',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  not_started: 'Not Started',
}

const statusClass: Record<PipelineStatus, string> = {
  complete: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  not_started: 'bg-gray-100 text-gray-500',
}

export function CurrentCommandCard({ command }: { command: CurrentCommand }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm font-semibold text-gray-900">Current Command</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusClass[command.status]}`}>
          {statusLabel[command.status]}
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          Stage locked:{' '}
          <span className={command.stageLocked ? 'text-green-600 font-medium' : 'text-gray-500'}>
            {command.stageLocked ? 'Yes' : 'No'}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Current Stage</p>
            <p className="text-sm font-semibold text-gray-900">{command.stage}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Primary Blocker</p>
            <p className="text-sm text-red-700 font-medium leading-relaxed">{command.primaryBlocker}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Why This Matters</p>
            <p className="text-sm text-gray-600 leading-relaxed">{command.whyItMatters}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Wrong Next Move</p>
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed border border-amber-100">
              {command.wrongNextMove}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Correct Next Action</p>
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 leading-relaxed border border-green-100">
              {command.correctNextAction}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
        <button disabled className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-400 cursor-not-allowed opacity-60">
          Review Crawl Output
        </button>
        <button disabled className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-400 cursor-not-allowed opacity-60">
          Edit Business Truth JSON
        </button>
        <button disabled className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-400 cursor-not-allowed opacity-60">
          Mark Pricing Confirmed
        </button>
      </div>
    </div>
  )
}
