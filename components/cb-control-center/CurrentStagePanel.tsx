import type { CurrentCommand } from '@/lib/cb-control-center/types'

interface CurrentStagePanelProps {
  command: CurrentCommand
}

export function CurrentStagePanel({ command }: CurrentStagePanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-5">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Current Stage</p>
        <p className="text-xl font-bold text-gray-900">{command.stage}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Why It Matters</p>
        <p className="text-sm text-gray-600 leading-relaxed">{command.whyItMatters}</p>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Allowed Now</p>
        <p className="text-sm text-green-800 leading-relaxed">{command.correctNextAction}</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Forbidden Now</p>
        <p className="text-sm text-amber-800 leading-relaxed">{command.wrongNextMove}</p>
      </div>
    </div>
  )
}
