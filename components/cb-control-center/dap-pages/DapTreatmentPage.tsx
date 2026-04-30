import type {
  DapTreatmentPageCtaModel,
  DapSavingsEducationModel,
  DapFaqSectionModel,
  DapCtaModel,
  DapPublicCtaType,
} from '@/lib/cb-control-center/dapPublicUxTypes'
import { DapPublicCta } from '@/components/cb-control-center/dap-public/DapPublicCta'
import { DapSavingsEducationSection } from '@/components/cb-control-center/dap-public/DapSavingsEducationSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'

interface DapTreatmentPageProps {
  h1: string
  ctaModel: DapTreatmentPageCtaModel
  savingsEd: DapSavingsEducationModel
  faq: DapFaqSectionModel
}

const TREATMENT_CTA_LABELS: Partial<Record<DapPublicCtaType, string>> = {
  search_nearby: 'Find DAP dentists near me',
  request_city_availability: 'Request DAP in my area',
}

function makeCtaModel(type: DapPublicCtaType): DapCtaModel {
  return {
    type,
    label: TREATMENT_CTA_LABELS[type] ?? type,
    href: type === 'search_nearby' ? '/search' : '/request-dap',
  }
}

export function DapTreatmentPage({ h1, ctaModel, savingsEd, faq }: DapTreatmentPageProps) {
  return (
    <div
      className="space-y-8"
      data-page-kind="treatment_page"
      data-implies-guaranteed-pricing={String(ctaModel.impliesGuaranteedPricing)}
      data-preview-page
    >
      {/* Page header + CTAs */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight" data-treatment-h1>{h1}</h1>
        <div className="flex flex-wrap gap-3">
          <DapPublicCta cta={makeCtaModel(ctaModel.primaryCta)} />
          <DapPublicCta cta={makeCtaModel(ctaModel.secondaryCta)} />
        </div>
      </div>

      <DapSavingsEducationSection model={savingsEd} />
      <hr className="border-gray-100" />
      <DapFaqSection model={faq} />
    </div>
  )
}
