import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'
import { DapPublicCta } from '@/components/cb-control-center/dap-public/DapPublicCta'
import { DapSavingsEducationSection } from '@/components/cb-control-center/dap-public/DapSavingsEducationSection'
import { getDefaultSavingsEducationModel } from '@/lib/cb-control-center/dapPublicSectionModels'
import type { DapCtaModel } from '@/lib/dap/site/dapPublicUxTypes'

type Params = Promise<{ city: string; practiceSlug: string }>

export function generateStaticParams() {
  const { cities, dentistPages } = exportDapCmsSnapshot()
  return cities.flatMap(c =>
    dentistPages
      .filter(d => c.visiblePracticeSlugs.includes(d.slug))
      .map(d => ({ city: c.slug, practiceSlug: d.slug }))
  )
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { practiceSlug } = await params
  const { dentistPages } = exportDapCmsSnapshot()
  const record = dentistPages.find(d => d.slug === practiceSlug)
  if (!record) return {}
  return {
    title: `${record.practiceName} — Dental Membership Plan | DAP`,
    description: record.publicState === 'confirmed_provider'
      ? `${record.practiceName} in ${record.city}, ${record.state} participates in Dental Advantage Plan.`
      : `${record.practiceName} in ${record.city}, ${record.state} is in the DAP directory. Request membership plan availability.`,
  }
}

export default async function DentistDetailPage({ params }: { params: Params }) {
  const { practiceSlug } = await params
  const { dentistPages } = exportDapCmsSnapshot()
  const record = dentistPages.find(d => d.slug === practiceSlug)
  if (!record) notFound()

  const isConfirmed = record.publicState === 'confirmed_provider'

  const primaryCta: DapCtaModel = {
    type: isConfirmed ? 'view_plan_details' : 'request_this_dentist',
    label: record.primaryCta.label,
    href: record.primaryCta.href,
  }

  return (
    <main
      className="space-y-8"
      data-page-kind="dentist_page"
      data-implies-pricing="false"
      data-implies-guaranteed-savings="false"
      data-practice-slug={record.slug}
      data-public-state={record.publicState}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{record.heading}</h1>
            <p className="text-sm text-gray-500">{record.city}, {record.state} · {record.zip}</p>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
            isConfirmed
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {record.badgeLabel}
          </span>
        </div>

        {record.bodySections.map((section, i) => (
          <p key={i} className="text-sm text-gray-700 leading-relaxed">{section}</p>
        ))}

        {record.expectationCopy && (
          <p className="text-sm text-gray-500 italic">{record.expectationCopy}</p>
        )}
      </div>

      {isConfirmed && record.offerSummary && (
        <div className="border border-green-200 bg-green-50 rounded-lg px-5 py-4 space-y-2">
          <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Plan pricing (from {record.offerSummary.source})</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-green-900">
            <div>
              <p className="text-xs text-green-700">Adult annual fee</p>
              <p className="font-semibold">{record.offerSummary.adultAnnualFee}</p>
            </div>
            <div>
              <p className="text-xs text-green-700">Child annual fee</p>
              <p className="font-semibold">{record.offerSummary.childAnnualFee}</p>
            </div>
          </div>
          <p className="text-xs text-green-700">
            Pricing provided by the practice. Confirm details directly with the practice.
          </p>
        </div>
      )}

      <div>
        <DapPublicCta cta={primaryCta} />
      </div>

      <DapSavingsEducationSection model={getDefaultSavingsEducationModel()} />

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          DAP does not guarantee savings, plan availability, or clinical eligibility at any practice. Confirm all details directly with the practice.
        </p>
      </div>
    </main>
  )
}
