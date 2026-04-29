import type { InitialInput, InputStatus } from '@/lib/cb-control-center/types'

const statusLabel: Record<InputStatus, string> = {
  accepted: 'Accepted / Ready for Crawl',
  needs_review: 'Needs Review',
  rejected: 'Rejected',
}

const statusClass: Record<InputStatus, string> = {
  accepted: 'bg-green-100 text-green-700',
  needs_review: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
}

export function InitialInputCard({ input }: { input: InitialInput }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Initial Input</p>
          <p className="text-xs text-gray-400 mt-0.5">Operator-provided starting point for this pipeline run</p>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusClass[input.inputStatus]}`}>
          {statusLabel[input.inputStatus]}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Business Name</p>
          <p className="text-sm font-medium text-gray-900">{input.businessName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Source Website</p>
          <a
            href={input.sourceWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline truncate block"
          >
            {input.sourceWebsite}
          </a>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Business Type</p>
          <p className="text-sm text-gray-700">{input.businessType}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Pipeline Goal</p>
          <p className="text-sm text-gray-700 leading-relaxed">{input.pipelineGoal}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Seed Customer Decision</p>
          <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{input.seedCustomerDecision}&rdquo;</p>
        </div>
      </div>
    </div>
  )
}
