import type {
  DapCityPageModel,
  DapCityAvailabilitySummary,
  DapProviderCardModel,
  DapNoResultsModel,
  DapHowItWorksSectionModel,
  DapFaqSectionModel,
} from '@/lib/cb-control-center/dapPublicUxTypes'
import { DapCityAvailabilitySummaryView } from '@/components/cb-control-center/dap-public/DapCityAvailabilitySummary'
import { DapProviderCard } from '@/components/cb-control-center/dap-public/DapProviderCard'
import { DapNoResultsPanel } from '@/components/cb-control-center/dap-public/DapNoResultsPanel'
import { DapHowItWorksSection } from '@/components/cb-control-center/dap-public/DapHowItWorksSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'

interface DapCityPageProps {
  model: DapCityPageModel
  summary: DapCityAvailabilitySummary
  cards: DapProviderCardModel[]
  noResults: DapNoResultsModel | null
  howItWorks: DapHowItWorksSectionModel
  faq: DapFaqSectionModel
}

export function DapCityPage({ model, summary, cards, noResults, howItWorks, faq }: DapCityPageProps) {
  return (
    <div
      className="space-y-8"
      data-page-kind="city_page"
      data-implies-universal-availability={String(model.impliesUniversalAvailability)}
      data-preview-page
    >
      {/* Page header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight" data-city-h1>
          {model.h1}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed" data-city-subheading>
          {model.subheading}
        </p>
      </div>

      {/* Availability summary */}
      <DapCityAvailabilitySummaryView model={summary} />

      {/* Provider list or no-results */}
      {noResults
        ? <DapNoResultsPanel model={noResults} />
        : (
          <div className="space-y-3" data-provider-list>
            {cards.map(card => (
              <DapProviderCard key={card.practiceId} model={card} previewMode />
            ))}
          </div>
        )
      }

      <hr className="border-gray-100" />
      <DapHowItWorksSection model={howItWorks} />
      <hr className="border-gray-100" />
      <DapFaqSection model={faq} />
    </div>
  )
}
