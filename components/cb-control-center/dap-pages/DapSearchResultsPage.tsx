import type {
  DapSearchResultsModel,
  DapProviderCardModel,
  DapHowItWorksSectionModel,
} from '@/lib/dap/site/dapPublicUxTypes'
import { DapSearchResultsPreview } from '@/components/cb-control-center/dap-public/DapSearchResultsPreview'
import { DapHowItWorksSection } from '@/components/cb-control-center/dap-public/DapHowItWorksSection'

interface DapSearchResultsPageProps {
  model: DapSearchResultsModel
  providerCards: DapProviderCardModel[]
  howItWorks: DapHowItWorksSectionModel
}

export function DapSearchResultsPage({ model, providerCards, howItWorks }: DapSearchResultsPageProps) {
  return (
    <div className="space-y-8" data-page-kind="search_results_page" data-preview-page>
      <DapSearchResultsPreview model={model} providerCards={providerCards} />
      <DapHowItWorksSection model={howItWorks} />
    </div>
  )
}
