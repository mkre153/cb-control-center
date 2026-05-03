import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'
import { getDecisionPageCtaModel } from '@/lib/dap/registry/dapPublicUxRules'
import {
  getDefaultSavingsEducationModel,
  getDefaultComparisonModel,
  getDefaultFaqModel,
} from '@/lib/cb-control-center/dapPublicSectionModels'
import { DapPublicCta } from '@/components/cb-control-center/dap-public/DapPublicCta'
import { DapSavingsEducationSection } from '@/components/cb-control-center/dap-public/DapSavingsEducationSection'
import { DapComparisonSection } from '@/components/cb-control-center/dap-public/DapComparisonSection'
import { DapFaqSection } from '@/components/cb-control-center/dap-public/DapFaqSection'
import type { DapCtaModel, DapPublicCtaType } from '@/lib/dap/site/dapPublicUxTypes'

type Params = Promise<{ slug: string }>

// CTA hrefs resolve to existing informational guide pages — search/request routes not yet live.
const GUIDE_CTA_HREFS: Partial<Record<DapPublicCtaType, string>> = {
  search_nearby:             '/guides/how-to-find-dentist-who-offers-dap',
  request_city_availability: '/guides/what-happens-if-no-dentist-offers-dap-near-me',
  learn_how_it_works:        '/guides/how-does-dap-work',
  request_this_dentist:      '/guides/what-happens-if-no-dentist-offers-dap-near-me',
}

const GUIDE_CTA_LABELS: Partial<Record<DapPublicCtaType, string>> = {
  search_nearby:             'How to find a DAP dentist',
  request_city_availability: 'What to do if no DAP dentist is nearby',
  learn_how_it_works:        'How DAP works',
  request_this_dentist:      'What to do if no DAP dentist is nearby',
}

function makeGuideCta(type: DapPublicCtaType): DapCtaModel {
  return {
    type,
    label: GUIDE_CTA_LABELS[type] ?? type,
    href: GUIDE_CTA_HREFS[type] ?? null,
  }
}

export function generateStaticParams() {
  const { decisionPages } = exportDapCmsSnapshot()
  return decisionPages.map(d => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const { decisionPages } = exportDapCmsSnapshot()
  const record = decisionPages.find(d => d.slug === slug)
  if (!record) return {}
  return {
    title: record.seoTitle,
    description: record.seoDescription,
  }
}

export default async function GuidePage({ params }: { params: Params }) {
  const { slug } = await params
  const { decisionPages } = exportDapCmsSnapshot()
  const record = decisionPages.find(d => d.slug === slug)
  if (!record) notFound()

  const ctaModel = getDecisionPageCtaModel()
  const savingsEd = getDefaultSavingsEducationModel()
  const comparison = getDefaultComparisonModel()
  const faq = getDefaultFaqModel('decision_page')

  return (
    <main
      className="space-y-8"
      data-page-kind="decision_page"
      data-implies-pricing="false"
    >
      <div className="space-y-4">
        <h1
          className="text-2xl font-bold text-gray-900 leading-tight"
          data-decision-h1
        >
          {record.decisionQuestion}
        </h1>
        <p className="text-gray-700 leading-relaxed">{record.safeAnswer}</p>
        <div className="flex flex-wrap gap-3">
          <DapPublicCta cta={makeGuideCta(ctaModel.primaryCta)} />
          <DapPublicCta cta={makeGuideCta(ctaModel.secondaryCta)} />
        </div>
      </div>
      <DapSavingsEducationSection model={savingsEd} />
      <hr className="border-gray-100" />
      <DapComparisonSection model={comparison} />
      <hr className="border-gray-100" />
      <DapFaqSection model={faq} />
    </main>
  )
}
