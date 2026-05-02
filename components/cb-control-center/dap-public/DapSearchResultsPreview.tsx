import type { DapProviderCardModel, DapSearchResultsModel, DapCtaModel } from '@/lib/dap/site/dapPublicUxTypes'
import { DapProviderCard } from './DapProviderCard'
import { DapNoResultsPanel } from './DapNoResultsPanel'
import { DapPublicCta } from './DapPublicCta'

interface DapSearchResultsPreviewProps {
  model: DapSearchResultsModel
  providerCards: DapProviderCardModel[]
}

export function DapSearchResultsPreview({ model, providerCards }: DapSearchResultsPreviewProps) {
  const publicCards     = providerCards.filter(c => c.isPublic)
  const confirmedCards  = publicCards.filter(c => c.availabilityState === 'confirmed')
  const otherCards      = publicCards.filter(c => c.availabilityState !== 'confirmed')

  const requestAreaCta: DapCtaModel  = { type: model.primaryCta,   label: 'Request DAP in this area',  href: '/request-dap'         }
  const requestDentistCta: DapCtaModel = { type: model.secondaryCta, label: 'Request a specific dentist', href: '/request-dap/dentist' }

  return (
    <div
      className="space-y-5"
      data-is-dead-end={String(model.isDeadEnd)}
      data-has-confirmed-providers={model.hasConfirmedProviders}
    >
      {/* No-results panel — shown when result list is truly empty */}
      {model.noResultsModel && (
        <DapNoResultsPanel model={model.noResultsModel} />
      )}

      {/* Confirmed providers section */}
      {confirmedCards.length > 0 && (
        <section className="space-y-3" data-confirmed-section>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" aria-hidden />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Confirmed DAP Providers ({confirmedCards.length})
            </p>
          </div>
          <div className="space-y-3">
            {confirmedCards.map(c => (
              <DapProviderCard key={c.practiceId} model={c} />
            ))}
          </div>
        </section>
      )}

      {/* Other practices — only shown when no confirmed providers exist */}
      {otherCards.length > 0 && !model.hasConfirmedProviders && (
        <section className="space-y-3" data-other-section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Other practices — DAP not yet confirmed
          </p>
          <div className="space-y-3">
            {otherCards.map(c => (
              <DapProviderCard key={c.practiceId} model={c} />
            ))}
          </div>
        </section>
      )}

      {/* Request path — always shown when no confirmed providers, to prevent dead ends */}
      {!model.hasConfirmedProviders && publicCards.length > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 space-y-2" data-request-path>
          <p className="text-sm text-blue-700 font-medium">
            No confirmed DAP providers in this area yet.
          </p>
          <div className="flex flex-wrap gap-2">
            <DapPublicCta cta={requestAreaCta} />
            <DapPublicCta cta={requestDentistCta} />
          </div>
        </div>
      )}
    </div>
  )
}
