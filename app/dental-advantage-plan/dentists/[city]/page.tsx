import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'

type Params = Promise<{ city: string }>

export function generateStaticParams() {
  const { cities } = exportDapCmsSnapshot()
  return cities.map(c => ({ city: c.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city } = await params
  const { cities } = exportDapCmsSnapshot()
  const cityRecord = cities.find(c => c.slug === city)
  if (!cityRecord) return {}
  return {
    title: `Dentists in ${cityRecord.cityName} With Membership Plans | DAP`,
    description: `Find dental practices in ${cityRecord.cityName}, ${cityRecord.state} that offer direct membership plans. Plan details and availability vary by practice.`,
  }
}

export default async function DentistsByCityPage({ params }: { params: Params }) {
  const { city } = await params
  const { cities, dentistPages } = exportDapCmsSnapshot()
  const cityRecord = cities.find(c => c.slug === city)
  if (!cityRecord) notFound()

  const visibleDentists = dentistPages.filter(d =>
    cityRecord.visiblePracticeSlugs.includes(d.slug)
  )
  const confirmedDentists = visibleDentists.filter(d => d.publicState === 'confirmed_provider')
  const otherDentists = visibleDentists.filter(d => d.publicState !== 'confirmed_provider')

  return (
    <main
      className="space-y-8"
      data-page-kind="city_page"
      data-implies-universal-availability="false"
      data-city={city}
    >
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {cityRecord.countyName}, {cityRecord.state}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          Dentists in {cityRecord.cityName} With Membership Plans
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Not every dental practice offers a membership plan. Below are practices in {cityRecord.cityName} available through DAP.
        </p>
      </div>

      {confirmedDentists.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Confirmed DAP Participants</h2>
          <ul className="space-y-3">
            {confirmedDentists.map(d => (
              <li key={d.slug}>
                <Link
                  href={`/dental-advantage-plan/dentists/${city}/${d.slug}`}
                  className="block border border-green-200 rounded-lg px-4 py-3 hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{d.practiceName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{d.city}, {d.state} · {d.zip}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">
                      {d.badgeLabel}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {otherDentists.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Request DAP at These Practices</h2>
          <ul className="space-y-3">
            {otherDentists.map(d => (
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
                    <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                      {d.badgeLabel}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visibleDentists.length === 0 && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg px-5 py-5 space-y-2">
          <p className="text-sm font-semibold text-blue-900">No practices listed in {cityRecord.cityName} yet.</p>
          <p className="text-sm text-blue-800">You can request DAP availability at your preferred dentist.</p>
          <Link
            href="/dental-advantage-plan/find-a-dentist"
            className="inline-block text-sm font-medium text-blue-700 hover:underline"
          >
            Learn how to request DAP →
          </Link>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          DAP does not guarantee provider availability in {cityRecord.cityName}. Plan details vary by practice.
        </p>
      </div>
    </main>
  )
}
