import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'
import { DapPublicCta } from '@/components/cb-control-center/dap-public/DapPublicCta'
import type { DapCtaModel } from '@/lib/dap/site/dapPublicUxTypes'

type Params = Promise<{ city: string }>

export function generateStaticParams() {
  const { cities } = exportDapCmsSnapshot()
  return cities.map(c => ({ city: c.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city } = await params
  const { cities } = exportDapCmsSnapshot()
  const record = cities.find(c => c.slug === city)
  if (!record) return {}
  return {
    title: record.seoTitle,
    description: record.seoDescription,
  }
}

export default async function CityPage({ params }: { params: Params }) {
  const { city } = await params
  const { cities, dentistPages } = exportDapCmsSnapshot()
  const record = cities.find(c => c.slug === city)
  if (!record) notFound()

  const visibleDentists = dentistPages.filter(d =>
    record.visiblePracticeSlugs.includes(d.slug)
  )

  const primaryCta: DapCtaModel = {
    type: record.primaryCta.href.includes('request') ? 'request_city_availability' : 'search_nearby',
    label: record.primaryCta.label,
    href: record.primaryCta.href,
  }

  return (
    <main
      className="space-y-8"
      data-page-kind="city_page"
      data-implies-universal-availability="false"
      data-city={record.slug}
    >
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {record.countyName}, {record.state}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{record.heading}</h1>
        <p className="text-gray-600 leading-relaxed">{record.subheading}</p>
      </div>

      {visibleDentists.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            {visibleDentists.filter(d => d.publicState === 'confirmed_provider').length > 0
              ? 'Participating practices'
              : 'Practices in this area'}
          </h2>
          <ul className="space-y-3">
            {visibleDentists.map(d => (
              <li key={d.slug}>
                <Link
                  href={`/dental-advantage-plan/dentists/${city}/${d.slug}`}
                  className="block border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{d.practiceName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{d.city}, {d.state} · {d.zip}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
                      d.publicState === 'confirmed_provider'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {d.badgeLabel}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="border border-blue-200 bg-blue-50 rounded-lg px-5 py-5 space-y-3">
          <p className="text-sm font-semibold text-blue-900">No confirmed DAP practices in this area yet.</p>
          <p className="text-sm text-blue-800">
            You can request that a dentist near you consider offering a membership plan.
          </p>
          <DapPublicCta cta={primaryCta} />
        </div>
      )}

      {visibleDentists.length > 0 && (
        <div>
          <DapPublicCta cta={primaryCta} />
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          DAP does not guarantee provider availability in {record.cityName}. Plan details vary by participating practice.
        </p>
      </div>
    </main>
  )
}
