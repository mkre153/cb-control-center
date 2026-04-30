import type {
  DapHomepageHeroModel,
  DapHowItWorksSectionModel,
  DapComparisonSectionModel,
  DapFaqSectionModel,
} from '@/lib/cb-control-center/dapPublicUxTypes'
import { DapHomepageHeroPreview } from '@/components/cb-control-center/dap-public/DapHomepageHeroPreview'
import { DapHowItWorksSection } from '@/components/cb-control-center/dap-public/DapHowItWorksSection'
import { DapComparisonSection } from '@/components/cb-control-center/dap-public/DapComparisonSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'

interface DapHomepagePageProps {
  hero: DapHomepageHeroModel
  howItWorks: DapHowItWorksSectionModel
  comparison: DapComparisonSectionModel
  faq: DapFaqSectionModel
}

export function DapHomepagePage({ hero, howItWorks, comparison, faq }: DapHomepagePageProps) {
  return (
    <div className="space-y-10" data-page-kind="homepage" data-preview-page>
      <DapHomepageHeroPreview model={hero} />
      <hr className="border-gray-100" />
      <DapHowItWorksSection model={howItWorks} />
      <hr className="border-gray-100" />
      <DapComparisonSection model={comparison} />
      <hr className="border-gray-100" />
      <DapFaqSection model={faq} />
    </div>
  )
}
