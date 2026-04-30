import type { LaunchCapability } from '@/lib/cb-control-center/launchReadiness'

interface LaunchReadinessPanelProps {
  capabilities: LaunchCapability[]
}

export function LaunchReadinessPanel({ capabilities }: LaunchReadinessPanelProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Launch Readiness</p>
      <div className="divide-y divide-gray-50">
        {capabilities.map((cap) => (
          <div key={cap.question} className="flex items-baseline justify-between py-1.5 gap-4">
            <span className="text-sm text-gray-700 min-w-0">{cap.question}</span>
            <span className={`text-xs font-medium shrink-0 text-right ${
              cap.status === 'yes'     ? 'text-green-700' :
              cap.status === 'partial' ? 'text-amber-700' :
                                         'text-red-600'
            }`}>
              {cap.status === 'yes'
                ? 'Yes'
                : cap.status === 'partial'
                ? `Yes, with constraints${cap.reason ? ` — ${cap.reason}` : ''}`
                : `No${cap.reason ? ` — ${cap.reason}` : ''}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
