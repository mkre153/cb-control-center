import type {
  DapDentistPageModel,
  DapProviderCardModel,
  DapSavingsEducationModel,
  DapFaqSectionModel,
} from '@/lib/cb-control-center/dapPublicUxTypes'
import { DapProviderCard } from '@/components/cb-control-center/dap-public/DapProviderCard'
import { DapSavingsEducationSection } from '@/components/cb-control-center/dap-public/DapSavingsEducationSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'

interface DapDentistPageProps {
  model: DapDentistPageModel
  card: DapProviderCardModel
  savingsEd: DapSavingsEducationModel
  faq: DapFaqSectionModel
}

export function DapDentistPage({ model, card, savingsEd, faq }: DapDentistPageProps) {
  return (
    <div
      className="space-y-8"
      data-page-kind="dentist_page"
      data-template-id={model.templateId}
      data-is-public={String(model.isPublic)}
      data-preview-page
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight" data-dentist-h1>
          {model.h1Pattern}
        </h1>
      </div>

      {/* Provider card — main content block */}
      <DapProviderCard model={card} previewMode />

      <hr className="border-gray-100" />
      <DapSavingsEducationSection model={savingsEd} />
      <hr className="border-gray-100" />
      <DapFaqSection model={faq} />
    </div>
  )
}
