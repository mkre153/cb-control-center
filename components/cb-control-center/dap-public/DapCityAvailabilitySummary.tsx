import type { DapCityAvailabilitySummary, DapCtaModel } from '@/lib/cb-control-center/dapPublicUxTypes'
import { DapPublicCta } from './DapPublicCta'

const CITY_CTA_LABELS: Record<string, { label: string; href: string }> = {
  search_nearby:             { label: 'Find DAP dentists',         href: '/search'      },
  request_city_availability: { label: 'Request DAP in this city',  href: '/request-dap' },
}

interface DapCityAvailabilitySummaryViewProps {
  model: DapCityAvailabilitySummary
}

export function DapCityAvailabilitySummaryView({ model }: DapCityAvailabilitySummaryViewProps) {
  const display = CITY_CTA_LABELS[model.primaryCta] ?? { label: 'Request availability', href: '/request-dap' }
  const ctaModel: DapCtaModel = { type: model.primaryCta, label: display.label, href: display.href }
  const hasConfirmed = model.hasConfirmedProviders

  return (
    <div
      className={`rounded-xl border px-5 py-4 space-y-4 ${
        hasConfirmed
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-blue-200 bg-blue-50'
      }`}
      data-city={model.cityName}
      data-has-confirmed-providers={model.hasConfirmedProviders}
    >
      <div>
        <h2 className={`text-base font-bold ${hasConfirmed ? 'text-emerald-900' : 'text-blue-900'}`}>
          {model.heading}
        </h2>
        <p className={`text-sm mt-0.5 leading-relaxed ${hasConfirmed ? 'text-emerald-700' : 'text-blue-700'}`} data-city-subheading>
          {model.subheading}
        </p>
      </div>

      {model.confirmedCount > 0 && (
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" aria-hidden />
            <span className="font-semibold text-emerald-700">{model.confirmedCount}</span>
            <span className="text-emerald-600">confirmed</span>
          </span>
          {model.requestedCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" aria-hidden />
              <span className="font-semibold text-blue-700">{model.requestedCount}</span>
              <span className="text-blue-600">requested</span>
            </span>
          )}
          <span className="text-gray-400">{model.totalCount} in dataset</span>
        </div>
      )}

      <DapPublicCta cta={ctaModel} />

      {!hasConfirmed && (
        <p className="text-xs text-blue-600/70 border-t border-blue-200 pt-3" data-no-provider-caveat>
          Requesting availability lets DAP know where patients want coverage. It does not guarantee
          DAP will become available in {model.cityName}.
        </p>
      )}
    </div>
  )
}
