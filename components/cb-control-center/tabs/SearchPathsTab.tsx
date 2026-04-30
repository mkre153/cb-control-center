import { SEARCH_PATH_RULES } from '@/lib/cb-control-center/mockData'
import type { SearchPath } from '@/lib/cb-control-center/types'

const PATH_COLORS: Record<SearchPath, {
  border: string; header: string; badge: string; badgeText: string
  ctaClass: string; mockBg: string
}> = {
  'confirmed-available': {
    border: 'border-green-200',
    header: 'bg-green-50',
    badge: 'bg-green-100 text-green-700',
    badgeText: 'Path 1',
    ctaClass: 'bg-green-600 text-white',
    mockBg: 'bg-green-50 border-green-100',
  },
  'no-confirmed-nearby': {
    border: 'border-amber-200',
    header: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
    badgeText: 'Path 2',
    ctaClass: 'bg-amber-600 text-white',
    mockBg: 'bg-amber-50 border-amber-100',
  },
  'specific-dentist-request': {
    border: 'border-blue-200',
    header: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    badgeText: 'Path 3',
    ctaClass: 'bg-blue-600 text-white',
    mockBg: 'bg-blue-50 border-blue-100',
  },
}

export function SearchPathsTab() {
  return (
    <div className="space-y-6">

      {/* Decision tree */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Search Decision Tree</p>
          <p className="text-xs text-gray-500 mt-0.5">
            The primary question is no longer &ldquo;Should I join now?&rdquo; — it is &ldquo;Is there a DAP dentist near me?&rdquo;
          </p>
        </div>

        <div className="px-4 py-4 space-y-2">
          {/* Decision node */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
              ?
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Patient searches ZIP or area</p>
              <p className="text-xs text-gray-500">System checks: does any practice near this ZIP have <code className="font-mono bg-gray-100 px-1 rounded">provider_status = &quot;confirmed_dap_provider&quot;</code>?</p>
            </div>
          </div>

          <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-2 pt-1">
            {/* Yes branch */}
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 shrink-0 mt-0.5">YES</span>
              <div>
                <p className="text-sm font-medium text-green-800">≥1 confirmed DAP provider found</p>
                <p className="text-xs text-gray-500">→ Path 1: Show confirmed practice(s) only. No unconfirmed practices in results.</p>
              </div>
            </div>

            {/* No branch — splits further */}
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 shrink-0 mt-0.5">NO</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">0 confirmed DAP providers found</p>
                <p className="text-xs text-gray-500 mb-2">→ Path 2: Tell patient honestly. Offer demand capture. Do not show unconfirmed practices as results.</p>

                <div className="ml-4 pl-4 border-l-2 border-amber-200 space-y-2 pt-1">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 shrink-0 mt-0.5">+</span>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Patient names a specific dentist</p>
                      <p className="text-xs text-gray-500">→ Path 3: Accept request, set <code className="font-mono bg-gray-100 px-1 rounded">recruitment_requested</code>, confirm we&apos;ll reach out. No guarantees.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core rule callout */}
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs font-semibold text-red-700 mb-1">Hard Rule — Cannot Be Bypassed</p>
          <p className="text-xs text-red-600">
            The 2,000+ San Diego County practices in the database are <strong>not DAP providers</strong>.
            They must never appear in search results in a way that implies DAP availability.
            Only <code className="font-mono bg-red-100 px-1 rounded">confirmed_dap_provider</code> practices may be shown as DAP results.
          </p>
        </div>
      </div>

      {/* 3 path cards */}
      <div className="space-y-4">
        {SEARCH_PATH_RULES.map((path) => {
          const colors = PATH_COLORS[path.id]
          return (
            <div key={path.id} className={`border rounded-lg overflow-hidden ${colors.border}`}>
              <div className={`px-4 py-3 border-b ${colors.border} ${colors.header} flex items-start justify-between gap-4`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${colors.badge}`}>
                      {colors.badgeText}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{path.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 italic">&ldquo;{path.patientQuestion}&rdquo;</p>
                </div>
              </div>

              <div className="px-4 py-4 space-y-4">

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Trigger Condition</p>
                  <code className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 block">
                    {path.trigger}
                  </code>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">System Behavior</p>
                  <ul className="space-y-1">
                    {path.systemBehavior.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-gray-400 shrink-0 mt-0.5">·</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1.5">Allowed Claims</p>
                    <ul className="space-y-1">
                      {path.allowedClaims.map((c, i) => (
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
                      {path.forbiddenClaims.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="text-red-500 shrink-0 mt-0.5">✕</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-semibold ${colors.ctaClass}`}>
                    {path.primaryCTA}
                  </span>
                  <code className="text-xs font-mono text-gray-400">{path.ctaDestination}</code>
                </div>

                <div className={`p-3 border rounded-lg ${colors.mockBg}`}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mock Result</p>
                  <p className="text-xs text-gray-700">{path.mockResultSummary}</p>
                </div>

              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
