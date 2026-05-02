import type {
  DapDecisionPageCtaModel,
  DapComparisonSectionModel,
  DapSavingsEducationModel,
  DapFaqSectionModel,
  DapCtaModel,
  DapPublicCtaType,
} from '@/lib/dap/site/dapPublicUxTypes'
import { DapPublicCta } from '@/components/cb-control-center/dap-public/DapPublicCta'
import { DapComparisonSection } from '@/components/cb-control-center/dap-public/DapComparisonSection'
import { DapSavingsEducationSection } from '@/components/cb-control-center/dap-public/DapSavingsEducationSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'

interface DapDecisionPageProps {
  h1: string
  ctaModel: DapDecisionPageCtaModel
  comparison: DapComparisonSectionModel
  savingsEd: DapSavingsEducationModel
  faq: DapFaqSectionModel
}

const DECISION_CTA_LABELS: Partial<Record<DapPublicCtaType, string>> = {
  search_nearby: 'Find DAP dentists near me',
  request_city_availability: 'Request DAP in my area',
  learn_how_it_works: 'Learn how DAP works',
}

function makeCtaModel(type: DapPublicCtaType): DapCtaModel {
  return {
    type,
    label: DECISION_CTA_LABELS[type] ?? type,
    href: type === 'search_nearby' ? '/search' : '/request-dap',
  }
}

export function DapDecisionPage({ h1, ctaModel, comparison, savingsEd, faq }: DapDecisionPageProps) {
  return (
    <div
      className="space-y-8"
      data-page-kind="decision_page"
      data-implies-pricing={String(ctaModel.impliesPricing)}
      data-preview-page
    >
      {/* Page header + CTAs */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight" data-decision-h1>{h1}</h1>
        <div className="flex flex-wrap gap-3">
          <DapPublicCta cta={makeCtaModel(ctaModel.primaryCta)} />
          <DapPublicCta cta={makeCtaModel(ctaModel.secondaryCta)} />
        </div>
      </div>

      <DapSavingsEducationSection model={savingsEd} />
      <hr className="border-gray-100" />
      <DapComparisonSection model={comparison} />
      <hr className="border-gray-100" />
      <DapFaqSection model={faq} />
    </div>
  )
}
