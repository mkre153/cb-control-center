import type { BusinessRecord } from '@/lib/cb-control-center/types'

export function BusinessSummaryCard({ business }: { business: BusinessRecord }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Business</p>
        <select className="text-sm border border-gray-200 rounded-md px-2.5 py-1 bg-white text-gray-700 outline-none">
          <option value="dap">{business.name}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Business</p>
          <p className="text-sm font-medium text-gray-900">{business.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Website</p>
          <p className="text-sm text-gray-600 truncate">{business.websiteUrl}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Category</p>
          <p className="text-sm text-gray-700">{business.category}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Pipeline Status</p>
          <p className="text-sm text-gray-700">{business.pipelineStatus}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Overall Readiness</span>
          <span className="text-xs font-semibold text-gray-700">{business.overallReadiness}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full"
            style={{ width: `${business.overallReadiness}%` }}
          />
        </div>
      </div>
    </div>
  )
}
