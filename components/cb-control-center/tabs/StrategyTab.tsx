import type { StrategyRecord } from '@/lib/cb-control-center/types'

export function StrategyTab({ strategy }: { strategy: StrategyRecord }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5">StoryBrand Status</p>
          <p className="text-sm font-medium text-gray-700">{strategy.storybrandStatus}</p>
        </div>
        <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
          <p className="text-xs text-gray-400 mb-0.5">Decision Lock Status</p>
          <p className="text-sm font-medium text-amber-600">{strategy.decisionStatus}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(
          [
            ['Decision Question', strategy.currentDecisionQuestion],
            ['Positioning Angle', strategy.positioningAngle],
            ['Homepage Goal', strategy.homepageGoal],
            ['Next Strategy Action', strategy.nextStrategyAction],
          ] as [string, string][]
        ).map(([label, value]) => (
          <div key={label} className="border border-gray-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-sm text-gray-800 leading-relaxed">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
