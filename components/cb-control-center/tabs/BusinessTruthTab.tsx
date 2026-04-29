import type { BusinessTruthRecord } from '@/lib/cb-control-center/types'

export function BusinessTruthTab({ businessTruth }: { businessTruth: BusinessTruthRecord }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <span className="text-xs font-semibold text-blue-700">Normalized Factual Record</span>
        <span className="text-xs text-blue-600">
          — This is the source of truth that feeds downstream systems. Pricing status:{' '}
          <span className="font-medium text-amber-600">{businessTruth.pricing_status}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(
          [
            ['Business Name', businessTruth.business_name],
            ['Category', businessTruth.category],
            ['Primary Customer', businessTruth.primary_customer],
            ['Primary Problem', businessTruth.primary_problem],
            ['Offer', businessTruth.offer],
            ['Decision Question', businessTruth.decision_question],
          ] as [string, string][]
        ).map(([label, value]) => (
          <div key={label} className="border border-gray-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-sm text-gray-800 leading-relaxed">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-green-100 rounded-lg p-3 bg-green-50/30">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Trust Signals</p>
          <ul className="space-y-1.5">
            {businessTruth.trust_signals.map((s, i) => (
              <li key={i} className="text-xs text-green-700 flex items-center gap-1.5">
                <span>✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-red-100 rounded-lg p-3 bg-red-50/30">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Known Gaps</p>
          <ul className="space-y-1.5">
            {businessTruth.known_gaps.map((g, i) => (
              <li key={i} className="text-xs text-red-600 flex items-center gap-1.5">
                <span>⚠</span> {g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Raw JSON</p>
        <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">
          {JSON.stringify(businessTruth, null, 2)}
        </pre>
      </div>
    </div>
  )
}
