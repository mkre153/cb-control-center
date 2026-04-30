import { PROVIDER_STATUS_SPECS } from '@/lib/cb-control-center/mockData'

const STATUS_BADGE: Record<string, { className: string }> = {
  confirmed_dap_provider: { className: 'bg-green-100 text-green-800 border border-green-200' },
  not_confirmed:          { className: 'bg-gray-100 text-gray-700 border border-gray-200' },
  recruitment_requested:  { className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  pending_confirmation:   { className: 'bg-amber-100 text-amber-800 border border-amber-200' },
  declined:               { className: 'bg-red-50 text-red-700 border border-red-200' },
}

export function ProviderStatusTab() {
  return (
    <div className="space-y-5">

      {/* Gate rule summary */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Two-Gate CTA Rule</p>
          <p className="text-xs text-gray-500 mt-0.5">
            <code className="font-mono bg-gray-100 px-1 rounded">&quot;Join plan&quot;</code> CTA requires BOTH{' '}
            <code className="font-mono bg-gray-100 px-1 rounded">provider_status = confirmed_dap_provider</code> AND{' '}
            <code className="font-mono bg-gray-100 px-1 rounded">offer_terms_status = complete</code>.{' '}
            Provider confirmation alone is not sufficient. Without validated offer terms, only{' '}
            <code className="font-mono bg-gray-100 px-1 rounded">&quot;View plan details&quot;</code> is allowed.
          </p>
        </div>
        <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-green-500 shrink-0 mt-0.5 font-bold">✓</span>
            <span className="text-gray-700"><strong>Path 1:</strong> confirmed provider + validated offer → "Join plan" CTA allowed</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500 shrink-0 mt-0.5 font-bold">~</span>
            <span className="text-gray-700"><strong>Partial:</strong> confirmed provider + offer pending → "View plan details" only</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400 shrink-0 mt-0.5 font-bold">✕</span>
            <span className="text-gray-700"><strong>Path 2/3:</strong> not confirmed / declined → Template B or no template</span>
          </div>
        </div>
      </div>

      {/* Per-status behavior cards */}
      {PROVIDER_STATUS_SPECS.map((spec) => {
        const badge = STATUS_BADGE[spec.status] ?? { className: 'bg-gray-100 text-gray-600' }
        const isDeclined = spec.status === 'declined'

        return (
          <div
            key={spec.status}
            className={`border rounded-lg overflow-hidden ${isDeclined ? 'border-red-100 opacity-80' : 'border-gray-200'}`}
          >
            {/* Header */}
            <div className={`px-4 py-3 border-b flex items-center gap-3 ${isDeclined ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${badge.className}`}>
                {spec.label}
              </span>
              <code className="text-xs font-mono text-gray-400">{spec.status}</code>
              {isDeclined && (
                <span className="text-xs font-semibold text-red-600 ml-auto">Internal only — never patient-facing</span>
              )}
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Description */}
              <p className="text-sm text-gray-700 leading-relaxed">{spec.description}</p>

              {/* Key behavioral flags */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <BoolFlag label="Appears in search" value={spec.appearsInSearch} />
                <BoolFlag label="Can claim DAP available" value={spec.canLabelAsOfferingDAP} />
                <div className="bg-gray-50 border border-gray-100 rounded px-2.5 py-1.5">
                  <p className="text-xs text-gray-400 mb-0.5">CTA allowed</p>
                  <p className="text-xs font-medium text-gray-700 leading-tight">
                    {spec.ctaAllowed ?? <span className="text-red-500">None — internal only</span>}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded px-2.5 py-1.5">
                  <p className="text-xs text-gray-400 mb-0.5">UI treatment</p>
                  <p className="text-xs font-medium text-gray-700 leading-tight">{spec.uiTreatment}</p>
                </div>
              </div>

              {/* Claims */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1.5">Allowed Claims</p>
                  <ul className="space-y-1">
                    {spec.allowedClaims.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1.5">Forbidden Claims</p>
                  <ul className="space-y-1">
                    {spec.forbiddenClaims.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next action + area scenario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded px-3 py-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">DAP Next Action</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{spec.dapNextAction}</p>
                </div>
                <div className={`rounded px-3 py-2.5 border ${isDeclined ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDeclined ? 'text-red-400' : 'text-blue-500'}`}>
                    If only this status in area → patient sees
                  </p>
                  <p className={`text-xs leading-relaxed font-medium ${isDeclined ? 'text-red-700' : 'text-blue-800'}`}>
                    {spec.ifOnlyStatusInArea}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BoolFlag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`rounded px-2.5 py-1.5 border ${value ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-xs font-semibold ${value ? 'text-green-700' : 'text-gray-500'}`}>
        {value ? 'Yes' : 'No'}
      </p>
    </div>
  )
}
