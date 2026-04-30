import Link from 'next/link'
import {
  MOCK_SEARCH_SCENARIOS,
  getPatientCtaForSearchState,
  type SearchResultState,
} from '@/lib/cb-control-center/dapDisplayRules'

const STATE_CONFIG: Record<SearchResultState, { dot: string; label: string; border: string }> = {
  confirmed_available: { dot: 'bg-green-500', label: 'Path 1',  border: 'border-green-200' },
  unconfirmed_only:    { dot: 'bg-amber-400', label: 'Path 2',  border: 'border-amber-200' },
  no_results:          { dot: 'bg-gray-400',  label: 'Path 2',  border: 'border-gray-200'  },
  declined_hidden:     { dot: 'bg-red-300',   label: 'Path 2*', border: 'border-red-100'   },
}

export function SearchStateDisplay() {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          ZIP Search Result States
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Each scenario shows what the patient sees. Declined practices are hidden from all public states.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MOCK_SEARCH_SCENARIOS.map(scenario => {
          const cfg = STATE_CONFIG[scenario.state]
          const cta = getPatientCtaForSearchState(scenario.state)
          return (
            <div key={scenario.id} className={`border rounded-lg p-4 space-y-2.5 ${cfg.border}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <p className="text-xs font-semibold text-gray-800">{scenario.label}</p>
                </div>
                <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  ZIP {scenario.zip}
                </span>
              </div>

              <div className="text-xs text-gray-600 space-y-0.5">
                <p>Confirmed: <span className="font-medium">{scenario.confirmedCount}</span></p>
                <p>Unconfirmed: <span className="font-medium">{scenario.unconfirmedCount}</span></p>
                {scenario.declinedInternalCount > 0 && (
                  <p className="text-amber-600">
                    Internal (suppressed): <span className="font-medium">{scenario.declinedInternalCount}</span>
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-500 italic">{scenario.patientExperienceNote}</p>

              <Link
                href={cta.href}
                className={`block text-center text-xs font-medium px-3 py-1.5 rounded transition-colors ${
                  scenario.state === 'confirmed_available'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-900 text-white'
                }`}
              >
                {cta.label}
              </Link>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400">
        * Path 2 — declined practice suppressed. Patient experience is identical to &ldquo;no confirmed provider nearby.&rdquo;
        Decline status is never disclosed.
      </p>
    </section>
  )
}
