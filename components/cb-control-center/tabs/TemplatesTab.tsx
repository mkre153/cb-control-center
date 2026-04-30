import type { ProviderStatus, DentistTemplateId } from '@/lib/cb-control-center/types'
import { DENTIST_PAGE_TEMPLATES, MOCK_DENTIST_PAGES } from '@/lib/cb-control-center/mockData'

const STATUS_LABELS: Record<ProviderStatus, { label: string; className: string; template: DentistTemplateId }> = {
  confirmed_dap_provider: { label: 'Confirmed DAP Provider',  className: 'bg-green-100 text-green-700',  template: 'confirmed-provider' },
  not_confirmed:          { label: 'Not Confirmed',           className: 'bg-gray-100 text-gray-600',    template: 'unconfirmed-practice' },
  recruitment_requested:  { label: 'Recruitment Requested',   className: 'bg-blue-100 text-blue-700',    template: 'unconfirmed-practice' },
  pending_confirmation:   { label: 'Pending Confirmation',    className: 'bg-amber-100 text-amber-700',  template: 'unconfirmed-practice' },
  declined:               { label: 'Declined (Internal Only)', className: 'bg-red-50 text-red-700',      template: 'internal_only' },
}

const TEMPLATE_COLORS: Record<DentistTemplateId, { border: string; header: string; badge: string; badgeText: string }> = {
  'confirmed-provider':   { border: 'border-green-200', header: 'bg-green-50',  badge: 'bg-green-100 text-green-700', badgeText: 'Template A' },
  'unconfirmed-practice': { border: 'border-amber-200', header: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700', badgeText: 'Template B' },
  'internal_only':        { border: 'border-red-100',   header: 'bg-red-50',    badge: 'bg-red-50 text-red-700',      badgeText: 'Internal Only' },
}

export function TemplatesTab() {
  return (
    <div className="space-y-6">

      {/* Gate rule */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Template Gate Rule</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Template A requires <code className="font-mono bg-gray-100 px-1 rounded">provider_status = &quot;confirmed_dap_provider&quot;</code>.
            Template B is for demand-capture and request flows only — not a provider offer page.
            Declined practices have no patient-facing template.
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {(Object.entries(STATUS_LABELS) as [ProviderStatus, typeof STATUS_LABELS[ProviderStatus]][]).map(([status, cfg]) => (
            <div key={status} className="px-4 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <code className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  {status}
                </code>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.className}`}>
                  {cfg.label}
                </span>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                cfg.template === 'confirmed-provider'
                  ? 'bg-green-100 text-green-700'
                  : cfg.template === 'internal_only'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {cfg.template === 'confirmed-provider'
                  ? 'Template A'
                  : cfg.template === 'internal_only'
                  ? 'Internal Only'
                  : 'Template B'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Template specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DENTIST_PAGE_TEMPLATES.map((template) => {
          const colors = TEMPLATE_COLORS[template.id]
          return (
            <div key={template.id} className={`border rounded-lg overflow-hidden ${colors.border}`}>
              <div className={`px-4 py-3 border-b ${colors.border} ${colors.header} flex items-center justify-between`}>
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mr-2 ${colors.badge}`}>
                    {colors.badgeText}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">{template.name}</span>
                </div>
              </div>

              <div className="px-4 py-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Gate Condition</p>
                  <code className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 block">
                    {template.gateCriteria}
                  </code>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sample H1</p>
                    <p className="text-sm font-medium text-gray-800">{template.sampleH1}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sample Subhead</p>
                    <p className="text-sm text-gray-700 italic">{template.sampleSubhead}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">CTA</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${
                      template.id === 'confirmed-provider'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}>
                      {template.ctaText}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Destination</p>
                    <code className="text-xs font-mono text-gray-500 truncate block">{template.ctaDestination}</code>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1.5">Allowed Language</p>
                  <ul className="space-y-1">
                    {template.allowedLanguage.map((lang, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                        {lang}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1.5">Forbidden Language</p>
                  <ul className="space-y-1">
                    {template.forbiddenLanguage.map((lang, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-red-500 shrink-0 mt-0.5">✕</span>
                        {lang}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded px-3 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Required Disclaimer</p>
                  <p className="text-xs text-gray-600 italic">{template.requiredDisclaimer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mock practice page assignments */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Mock Practice Pages — Template Assignment</p>
            <p className="text-xs text-gray-500 mt-0.5">San Diego dataset sample — {MOCK_DENTIST_PAGES.length} practices</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-700 font-medium">
              {MOCK_DENTIST_PAGES.filter(p => p.assignedTemplate === 'confirmed-provider').length} Template A
            </span>
            <span className="text-amber-700 font-medium">
              {MOCK_DENTIST_PAGES.filter(p => p.assignedTemplate === 'unconfirmed-practice').length} Template B
            </span>
            <span className="text-red-600 font-medium">
              {MOCK_DENTIST_PAGES.filter(p => p.assignedTemplate === 'internal_only').length} Internal Only
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {MOCK_DENTIST_PAGES.map((page) => {
            const statusCfg   = STATUS_LABELS[page.provider_status]
            const templateCfg = TEMPLATE_COLORS[page.assignedTemplate]
            return (
              <div key={page.id} className="px-4 py-3 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-gray-800">{page.practiceName}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{page.city}, CA {page.zip}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{page.eligibilityReason}</p>
                  {page.pageSlug
                    ? <code className="text-xs font-mono text-gray-400 mt-0.5 block">{page.pageSlug}</code>
                    : <span className="text-xs text-red-400 mt-0.5 block italic">no public URL — internal only</span>
                  }
                </div>
                <div className="shrink-0 text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${templateCfg.badge}`}>
                    {templateCfg.badgeText}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {page.assignedTemplate === 'confirmed-provider'
                      ? '"Join plan"'
                      : page.assignedTemplate === 'internal_only'
                      ? 'No patient CTA'
                      : '"Request DAP"'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
