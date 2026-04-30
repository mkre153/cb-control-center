import {
  buildAllDapPageBriefs,
  type DapPageBrief,
} from '@/lib/cb-control-center/dapPageBriefBuilder'
import { DAP_REQUIRED_TRUTH_RULES } from '@/lib/cb-control-center/cbSeoAeoPageGeneration'
import type { NeilLlmFormattingUsage } from '@/lib/cb-control-center/cbSeoAeoLlmFormatting'

// All 8 page types: homepage, guide, comparison, faq, city_page, practice_page, blog_article, decision_education
const ALL_BRIEFS: DapPageBrief[] = buildAllDapPageBriefs()

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

function SectionPill({ label, variant }: { label: string; variant: 'required' | 'optional' }) {
  const cls = variant === 'required'
    ? 'bg-green-50 text-green-700'
    : 'bg-gray-100 text-gray-500'
  return <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${cls}`}>{label}</span>
}

function ForbiddenItem({ text }: { text: string }) {
  return (
    <li className="text-xs text-red-600 flex gap-1.5 items-start">
      <span className="shrink-0 mt-0.5">✕</span>
      <span>{text}</span>
    </li>
  )
}

function WireframeStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-2 items-start text-xs text-gray-700">
      <span className="shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold">{n}</span>
      <span className="pt-0.5">{text}</span>
    </div>
  )
}

export default function DapPageBriefsPreview() {
  return (
    <div
      className="min-h-screen bg-gray-50 py-10 px-6"
      data-dap-page-briefs-preview
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="text-xs font-mono text-gray-400 mb-1">DAP Preview / Page Brief Builder</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">DAP Page Brief Builder</h1>
        <p className="text-gray-500 text-sm max-w-3xl">
          Read-only reference. Each brief is derived from the Phase 18C page-generation contract.
          No content has been written yet. No briefs may weaken a contract, remove truth rules,
          or relax safety flags.
        </p>
      </div>

      {/* Safety flags summary */}
      <div className="max-w-6xl mx-auto mb-10" data-page-brief-safety-flags>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Safety Flags (locked on all briefs)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            ['BrandScript controls strategy', true],
            ['Decision Lock controls offer', true],
            ['DAP truth rules required', true],
            ['Neil formatting: structure only', true],
            ['Neil can override strategy', false],
            ['Generic article mode allowed', false],
            ['Unsupported savings claims', false],
            ['Insurance replacement claims', false],
          ] as [string, boolean][]).map(([label, value]) => (
            <div
              key={label}
              className={`rounded-lg border px-3 py-2 flex items-start gap-2 ${
                value ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              <span className="shrink-0 font-bold text-sm">{value ? '✓' : '✕'}</span>
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DAP truth rules */}
      <div className="max-w-6xl mx-auto mb-10" data-page-brief-truth-rules>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">DAP Truth Rules (inherited by all briefs)</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {DAP_REQUIRED_TRUTH_RULES.map(rule => (
            <div key={rule} className="text-sm text-gray-700 flex gap-2">
              <span className="text-green-500 shrink-0">✓</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary table */}
      <div className="max-w-6xl mx-auto mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Brief Summary</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium w-40">Page Type</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium w-28">Neil Usage</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Primary Visitor Intent</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium w-48">Primary CTA</th>
              </tr>
            </thead>
            <tbody>
              {ALL_BRIEFS.map(brief => (
                <tr key={brief.pageType} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-700 text-xs">{brief.pageType}</td>
                  <td className="px-4 py-3"><UsagePill usage={brief.neilFormattingUsage} /></td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{brief.primaryVisitorIntent}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{brief.ctaRules.primaryCta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-brief detail cards */}
      <div className="max-w-6xl mx-auto space-y-10">
        {ALL_BRIEFS.map(brief => (
          <div
            key={brief.pageType}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            data-page-brief-card={brief.pageType}
          >
            {/* Card header */}
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center gap-3">
              <span className="font-mono font-bold text-gray-800">{brief.pageType}</span>
              <UsagePill usage={brief.neilFormattingUsage} />
            </div>

            <div className="px-5 py-5 grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Left column */}
              <div className="space-y-5">

                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Strategic Purpose</div>
                  <p className="text-sm text-gray-700">{brief.strategicPurpose}</p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Visitor Intent</div>
                  <p className="text-sm text-gray-700">{brief.primaryVisitorIntent}</p>
                  {brief.secondaryVisitorIntent && (
                    <p className="text-xs text-gray-500 mt-1">{brief.secondaryVisitorIntent}</p>
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">BrandScript Role</div>
                  <p className="text-sm text-gray-600">{brief.brandScriptRole}</p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">SEO / AEO Role</div>
                  <p className="text-sm text-gray-600">{brief.seoAeoRole}</p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Required Sections</div>
                  <div className="flex flex-wrap gap-1">
                    {brief.requiredSections.map(s => <SectionPill key={s} label={s} variant="required" />)}
                  </div>
                </div>

                {brief.optionalSections.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Optional Sections</div>
                    <div className="flex flex-wrap gap-1">
                      {brief.optionalSections.map(s => <SectionPill key={s} label={s} variant="optional" />)}
                    </div>
                  </div>
                )}

                {/* CTA rules */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">CTA Rules</div>
                  <div className="space-y-1">
                    <div className="text-xs text-green-700 flex gap-1.5">
                      <span>→</span>
                      <span><strong>Primary:</strong> {brief.ctaRules.primaryCta}</span>
                    </div>
                    {brief.ctaRules.secondaryCta && (
                      <div className="text-xs text-blue-700 flex gap-1.5">
                        <span>→</span>
                        <span><strong>Secondary:</strong> {brief.ctaRules.secondaryCta}</span>
                      </div>
                    )}
                    <div className="mt-1">
                      <div className="text-xs text-gray-400 mb-0.5">Forbidden CTAs:</div>
                      <ul className="space-y-0.5">
                        {brief.ctaRules.forbiddenCtas.map(cta => (
                          <li key={cta} className="text-xs text-red-600 flex gap-1.5">
                            <span>✕</span><span>{cta}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right column */}
              <div className="space-y-5">

                {/* Wireframe order */}
                <div data-page-brief-wireframe-order={brief.pageType}>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recommended Wireframe Order</div>
                  <div className="space-y-2">
                    {brief.recommendedWireframeOrder.map((step, i) => (
                      <WireframeStep key={step} n={i + 1} text={step} />
                    ))}
                  </div>
                </div>

                {/* Forbidden claims */}
                <div data-page-brief-forbidden-claims={brief.pageType}>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Forbidden Claims</div>
                  <ul className="space-y-1">
                    {brief.forbiddenClaims.map(c => <ForbiddenItem key={c} text={c} />)}
                  </ul>
                </div>

                {/* Forbidden lead patterns */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Forbidden Lead Patterns</div>
                  <ul className="space-y-1">
                    {brief.forbiddenLeadPatterns.map(p => <ForbiddenItem key={p} text={p} />)}
                  </ul>
                </div>

                {/* Prompt seeds */}
                <div data-page-brief-prompt-seeds={brief.pageType}>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Generation Prompt Seeds</div>
                  <div className="space-y-2">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-400 mb-0.5">Opening prompt</div>
                      <p className="text-xs text-gray-700">{brief.generationPromptSeeds.pageOpeningPrompt}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-400 mb-0.5">Section prompt</div>
                      <p className="text-xs text-gray-700">{brief.generationPromptSeeds.sectionPrompt}</p>
                    </div>
                    {brief.generationPromptSeeds.faqPrompt && (
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-400 mb-0.5">FAQ prompt</div>
                        <p className="text-xs text-gray-700">{brief.generationPromptSeeds.faqPrompt}</p>
                      </div>
                    )}
                    {brief.generationPromptSeeds.comparisonPrompt && (
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-400 mb-0.5">Comparison prompt</div>
                        <p className="text-xs text-gray-700">{brief.generationPromptSeeds.comparisonPrompt}</p>
                      </div>
                    )}
                    {brief.generationPromptSeeds.localPrompt && (
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-400 mb-0.5">Local prompt</div>
                        <p className="text-xs text-gray-700">{brief.generationPromptSeeds.localPrompt}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
