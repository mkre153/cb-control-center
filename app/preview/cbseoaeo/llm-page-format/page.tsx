import {
  CB_FRAMEWORK_HIERARCHY,
  NEIL_LLM_CANNOT_OVERRIDE_LAYERS,
  NEIL_LLM_BOTTOM_LINE_RULE,
  NEIL_LLM_SECTIONS,
  DAP_NEIL_LLM_FORMATTING_USAGE,
  HOMEPAGE_GUARDRAIL,
  DAP_TRUTH_RULES,
  type NeilLlmFormattingUsage,
} from '@/lib/cb-control-center/cbSeoAeoLlmFormatting'

const USAGE_COLORS: Record<NeilLlmFormattingUsage, string> = {
  none:       'bg-gray-100 text-gray-500',
  light:      'bg-blue-100 text-blue-700',
  medium:     'bg-yellow-100 text-yellow-700',
  strong:     'bg-orange-100 text-orange-700',
  very_strong:'bg-red-100 text-red-700',
  full:       'bg-purple-100 text-purple-700',
}

function UsagePill({ usage }: { usage: NeilLlmFormattingUsage }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${USAGE_COLORS[usage]}`}>
      {usage}
    </span>
  )
}

export default function NeilLlmPageFormatPreview() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6" data-preview-page="neil-llm-formatting">

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="text-xs font-mono text-gray-400 mb-1">CBSeoAeo / Neil-Style LLM Formatting</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Neil-Style LLM-Friendly Page Formatting Standard</h1>
        <p className="text-gray-500 text-sm max-w-2xl">
          Structure layer only — rank 5 in the framework hierarchy.
          Cannot override BrandScript, Decision Lock, CBDesignEngine, or CBSeoAeo Core30/NateSEO.
        </p>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800" data-bottom-line-rule>
          <span className="font-semibold">Bottom line: </span>
          {NEIL_LLM_BOTTOM_LINE_RULE}
        </div>
      </div>

      {/* Framework Hierarchy */}
      <div className="max-w-5xl mx-auto mb-10" data-section="framework-hierarchy">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Framework Hierarchy</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium w-12">Rank</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium w-48">Layer</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Description</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium w-32">Override?</th>
              </tr>
            </thead>
            <tbody>
              {CB_FRAMEWORK_HIERARCHY.map(layer => {
                const cannotOverride = NEIL_LLM_CANNOT_OVERRIDE_LAYERS.includes(layer.id as typeof NEIL_LLM_CANNOT_OVERRIDE_LAYERS[number])
                return (
                  <tr key={layer.id} className={`border-b border-gray-100 last:border-0 ${layer.id === 'NeilLlmFormatting' ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-gray-400 text-center">{layer.rank}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{layer.id}</td>
                    <td className="px-4 py-3 text-gray-600">{layer.description}</td>
                    <td className="px-4 py-3">
                      {cannotOverride ? (
                        <span className="text-red-600 font-semibold text-xs">Cannot override</span>
                      ) : (
                        <span className="text-blue-600 text-xs italic">This layer</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DAP Page-Type Usage Map */}
      <div className="max-w-5xl mx-auto mb-10" data-section="dap-usage-map">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">DAP Page-Type Usage Map</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Page Type</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Primary Framework</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">LLM Usage</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(DAP_NEIL_LLM_FORMATTING_USAGE).map(([pageType, entry]) => (
                <tr key={pageType} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-gray-700">{pageType}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.primaryFramework}</td>
                  <td className="px-4 py-3">
                    <UsagePill usage={entry.usage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Homepage is capped at &ldquo;light&rdquo; by the homepage guardrail — BrandScript always leads.
        </p>
      </div>

      {/* Section Taxonomy */}
      <div className="max-w-5xl mx-auto mb-10" data-section="section-taxonomy">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">12 Section Types</h2>
        <div className="grid grid-cols-1 gap-3">
          {NEIL_LLM_SECTIONS.map(section => (
            <div key={section.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-start gap-4">
              <div className="w-48 shrink-0">
                <div className="font-semibold text-gray-800 text-sm">{section.label}</div>
                <div className="font-mono text-xs text-gray-400">{section.id}</div>
              </div>
              <div className="flex-1 text-sm text-gray-600">{section.description}</div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-gray-400 mb-1">Required at:</div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {section.requiredAt.map(u => (
                    <UsagePill key={u} usage={u} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Homepage Guardrail */}
      <div className="max-w-5xl mx-auto mb-10" data-section="homepage-guardrail">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Homepage Guardrail</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-sm font-medium w-36">Max usage:</span>
            <UsagePill usage={HOMEPAGE_GUARDRAIL.usage} />
          </div>
          <div>
            <div className="text-gray-500 text-sm font-medium mb-1">Reason:</div>
            <div className="text-sm text-gray-700">{HOMEPAGE_GUARDRAIL.reason}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm font-medium mb-1">Required structure:</div>
            <div className="text-sm text-gray-700">{HOMEPAGE_GUARDRAIL.requiredStructure}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm font-medium mb-2">Forbidden lead patterns:</div>
            <ul className="space-y-1">
              {HOMEPAGE_GUARDRAIL.forbiddenLeadPatterns.map(p => (
                <li key={p} className="text-sm text-red-700 flex items-center gap-2">
                  <span className="text-red-400">✕</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-gray-500 text-sm font-medium mb-1">Allowed sections:</div>
            <div className="flex gap-2">
              {HOMEPAGE_GUARDRAIL.allowedSections.map(s => (
                <span key={s} className="font-mono text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DAP Truth Rules */}
      <div className="max-w-5xl mx-auto mb-10" data-section="dap-truth-rules">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">DAP Truth Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="font-semibold text-green-800 mb-2 text-sm">DAP is:</div>
            <ul className="space-y-1">
              {DAP_TRUTH_RULES.is.map(s => (
                <li key={s} className="text-xs text-green-700 flex gap-1.5 items-start">
                  <span className="mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="font-semibold text-red-800 mb-2 text-sm">DAP is NOT:</div>
            <ul className="space-y-1">
              {DAP_TRUTH_RULES.isNot.map(s => (
                <li key={s} className="text-xs text-red-700 flex gap-1.5 items-start">
                  <span className="mt-0.5">✕</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="font-semibold text-amber-800 mb-2 text-sm">Forbidden implications:</div>
            <ul className="space-y-1">
              {DAP_TRUTH_RULES.forbiddenImplications.map(s => (
                <li key={s} className="text-xs text-amber-700 flex gap-1.5 items-start">
                  <span className="mt-0.5">⚠</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  )
}
