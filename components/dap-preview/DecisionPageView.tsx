import Link from 'next/link'
import { REQUEST_FLOW_ROUTE, DIRECTORY_ROUTE } from '@/lib/dap/registry/dapDisplayRules'
import type { DapDecisionPageCmsRecord } from '@/lib/dap/site/dapCmsTypes'

interface DecisionPageViewProps {
  record: DapDecisionPageCmsRecord
}

export function DecisionPageView({ record }: DecisionPageViewProps) {
  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href={DIRECTORY_ROUTE} className="hover:text-gray-600">Directory</Link>
        <span>›</span>
        <span>Patient guide</span>
      </div>

      {/* Hero — decision question */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-8 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient decision guide</p>
        <h1 className="text-xl font-bold text-gray-900 leading-snug">{record.decisionQuestion}</h1>
        <p className="text-xs text-gray-400">For: {record.audience}</p>
      </div>

      {/* Safe answer — patient-facing content */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-6 space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Answer</p>
        <p className="text-sm text-gray-700 leading-relaxed">{record.safeAnswer}</p>
      </div>

      {/* Required facts — proven, attributable claims only */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-5 space-y-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">How we know this</p>
        <ul className="space-y-2">
          {record.requiredFacts.map((fact, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="mt-2 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              {fact}
            </li>
          ))}
        </ul>
      </div>

      {/* Related cities — only shown when the record has city context */}
      {record.relatedCitySlugs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Find DAP by city</p>
          <div className="flex flex-wrap gap-2">
            {record.relatedCitySlugs.map(slug => (
              <Link
                key={slug}
                href={`/preview/dap/${slug}`}
                className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors capitalize"
              >
                {slug.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA section */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-6 space-y-4">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Find DAP near you</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={REQUEST_FLOW_ROUTE}
            className="flex-1 text-center px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Request a DAP dentist near you
          </Link>
          {record.secondaryCta && (
            <Link
              href={record.secondaryCta.href}
              className="flex-1 text-center px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {record.secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
