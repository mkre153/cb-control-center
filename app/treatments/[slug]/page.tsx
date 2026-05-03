import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'
import { getTreatmentPageCtaModel } from '@/lib/dap/registry/dapPublicUxRules'
import {
  getDefaultSavingsEducationModel,
  getDefaultFaqModel,
} from '@/lib/cb-control-center/dapPublicSectionModels'
import { DapPublicCta } from '@/components/cb-control-center/dap-public/DapPublicCta'
import { DapSavingsEducationSection } from '@/components/cb-control-center/dap-public/DapSavingsEducationSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'
import type { DapCtaModel, DapPublicCtaType } from '@/lib/dap/site/dapPublicUxTypes'

type Params = Promise<{ slug: string }>

// CTA hrefs resolve to existing informational guide pages — search/request routes not yet live.
const TREATMENT_CTA_HREFS: Partial<Record<DapPublicCtaType, string>> = {
  search_nearby:             '/guides/how-to-find-dentist-who-offers-dap',
  request_city_availability: '/guides/what-happens-if-no-dentist-offers-dap-near-me',
  request_this_dentist:      '/guides/what-happens-if-no-dentist-offers-dap-near-me',
}

const TREATMENT_CTA_LABELS: Partial<Record<DapPublicCtaType, string>> = {
  search_nearby:             'Find a DAP dentist near me',
  request_city_availability: 'Request DAP in my area',
  request_this_dentist:      'Request DAP at my dentist',
}

function makeTreatmentCta(type: DapPublicCtaType): DapCtaModel {
  return {
    type,
    label: TREATMENT_CTA_LABELS[type] ?? type,
    href: TREATMENT_CTA_HREFS[type] ?? null,
  }
}

export function generateStaticParams() {
  const { treatmentPages } = exportDapCmsSnapshot()
  return treatmentPages.map(t => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const { treatmentPages } = exportDapCmsSnapshot()
  const record = treatmentPages.find(t => t.slug === slug)
  if (!record) return {}
  return {
    title: record.seoTitle,
    description: record.seoDescription,
  }
}

export default async function TreatmentPage({ params }: { params: Params }) {
  const { slug } = await params
  const { treatmentPages } = exportDapCmsSnapshot()
  const record = treatmentPages.find(t => t.slug === slug)
  if (!record) notFound()

  const ctaModel = getTreatmentPageCtaModel()
  const savingsEd = getDefaultSavingsEducationModel()
  const faq = getDefaultFaqModel('treatment_page')

  return (
    <main
      className="space-y-8"
      data-page-kind="treatment_page"
      data-implies-guaranteed-pricing="false"
    >
      <div className="space-y-4">
        <h1
          className="text-2xl font-bold text-gray-900 leading-tight"
          data-treatment-h1
        >
          {record.treatmentQuestion}
        </h1>
        <p className="text-gray-700 leading-relaxed">{record.safeAnswer}</p>
        <div className="flex flex-wrap gap-3">
          <DapPublicCta cta={makeTreatmentCta(ctaModel.primaryCta)} />
          <DapPublicCta cta={makeTreatmentCta(ctaModel.secondaryCta)} />
        </div>
      </div>
      <DapSavingsEducationSection model={savingsEd} />
      <hr className="border-gray-100" />
      <DapFaqSection model={faq} />
    </main>
  )
}
