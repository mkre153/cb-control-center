import {
  CB_SEOAEO_PAGE_CONTRACTS,
  DAP_REQUIRED_TRUTH_RULES,
  getAllPageTypes,
  type CBSeoAeoPageType,
} from '@/lib/cb-control-center/cbSeoAeoPageGeneration'
import type { NeilLlmFormattingUsage } from '@/lib/cb-control-center/cbSeoAeoLlmFormatting'

const USAGE_COLORS: Record<NeilLlmFormattingUsage, string> = {
  none:        'bg-gray-100 text-gray-400',
  light:       'bg-blue-100 text-blue-700',
  medium:      'bg-yellow-100 text-yellow-700',
  strong:      'bg-orange-100 text-orange-700',
  very_strong: 'bg-red-100 text-red-700',
  full:        'bg-purple-100 text-purple-700',
}

function UsagePill({ usage }: { usage: NeilLlmFormattingUsage }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${USAGE_COLORS[usage]}`}>
      {usage}
    </span>
  )
}

function SectionList({ items, variant }: { items: readonly string[]; variant: 'required' | 'optional' }) {
  if (items.length === 0) return <span className="text-gray-400 text-xs italic">none</span>
  const color = variant === 'required' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
  return (
    <div className="flex flex-wrap gap-1">
      {items.map(s => (
        <span key={s} className={`text-xs px-1.5 py-0.5 rounded font-mono ${color}`}>{s}</span>
      ))}
    </div>
  )
}

function ForbiddenList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-0.5">
      {items.map(item => (
        <li key={item} className="text-xs text-red-600 flex gap-1.5 items-start">
          <span className="shrink-0 mt-0.5">✕</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// All 8 page types: homepage, guide, comparison, faq, city_page, practice_page, blog_article, decision_education
const ALL_PAGE_TYPES: CBSeoAeoPageType[] = [
  'homepage',
  'guide',
  'comparison',
  'faq',
  'city_page',
  'practice_page',
  'blog_article',
  'decision_education',
]

export default function PageGenerationContractPreview() {
  return (
    <div
      className="min-h-screen bg-gray-50 py-10 px-6"
      data-preview-page="page-generation-contract"
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="text-xs font-mono text-gray-400 mb-1">CBSeoAeo / Page Generation Contract</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CBSeoAeo Page Generation Contract</h1>
        <p className="text-gray-500 text-sm max-w-3xl">
          Defines how CB Control Center generates SEO/AEO-ready pages for DAP.
          Contract-only — no generation logic, no AI calls, no content writing.
          BrandScript controls strategy. Neil formatting controls structure only.
        </p>
      </div>

      {/* Safety flags summary */}
      <div className="max-w-6xl mx-auto mb-10" data-section="safety-flags-summary">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Locked Safety Flags (all page types)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'BrandScript controls strategy', value: true },
            { label: 'Decision Lock controls offer', value: true },
            { label: 'DAP truth rules required', value: true },
            { label: 'Neil formatting: structure only', value: true },
            { label: 'Neil can override strategy', value: false },
            { label: 'Generic article mode allowed', value: false },
            { label: 'Unsupported savings claims', value: false },
            { label: 'Insurance replacement claims', value: false },
          ].map(flag => (
            <div
              key={flag.label}
              className={`rounded-lg border px-3 py-2 text-sm flex items-start gap-2 ${
                flag.value
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              <span className="shrink-0 font-bold">{flag.value ? '✓' : '✕'}</span>
              <span className="text-xs">{flag.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DAP truth rules */}
      <div className="max-w-6xl mx-auto mb-10" data-section="dap-truth-rules">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">DAP Required Truth Rules (all page types)</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {DAP_REQUIRED_TRUTH_RULES.map(rule => (
            <div key={rule} className="text-sm text-gray-700 flex gap-2">
              <span className="text-green-500 shrink-0">✓</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Page type summary table */}
      <div className="max-w-6xl mx-auto mb-10" data-section="page-type-summary">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Page Type Summary</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium w-40">Page Type</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium w-56">Primary Framework</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium w-28">Neil Usage</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Conversion Role</th>
              </tr>
            </thead>
            <tbody>
              {ALL_PAGE_TYPES.map(pt => {
                const c = CB_SEOAEO_PAGE_CONTRACTS[pt]
                return (
                  <tr key={pt} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-700">{pt}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.primaryFramework}</td>
                    <td className="px-4 py-3"><UsagePill usage={c.neilLlmFormattingUsage} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.conversionRole}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-page-type detail cards */}
      <div className="max-w-6xl mx-auto space-y-8" data-section="page-contracts">
        {ALL_PAGE_TYPES.map(pt => {
          const c = CB_SEOAEO_PAGE_CONTRACTS[pt]
          return (
            <div key={pt} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Card header */}
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center gap-3">
                <span className="font-mono font-bold text-gray-800">{pt}</span>
                <UsagePill usage={c.neilLlmFormattingUsage} />
                <span className="text-xs text-gray-400">{c.primaryFramework}</span>
              </div>

              <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left */}
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Strategic Purpose</div>
                    <p className="text-sm text-gray-700">{c.strategicPurpose}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Conversion Role</div>
                    <p className="text-sm text-gray-600">{c.conversionRole}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Required Sections</div>
                    <SectionList items={c.requiredSections} variant="required" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Optional Sections</div>
                    <SectionList items={c.optionalSections} variant="optional" />
                  </div>
                </div>

                {/* Right */}
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Forbidden Lead Patterns</div>
                    <ForbiddenList items={c.forbiddenLeadPatterns} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Forbidden Claims</div>
                    <ForbiddenList items={c.forbiddenClaims} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
