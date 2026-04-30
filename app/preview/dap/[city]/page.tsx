import { notFound } from 'next/navigation'
import { CityPageHeader } from '@/components/dap-preview/CityPageHeader'
import { ProviderResultCard } from '@/components/dap-preview/ProviderResultCard'
import { HowItWorksSection } from '@/components/dap-preview/HowItWorksSection'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'

export async function generateStaticParams() {
  const { cities } = exportDapCmsSnapshot()
  return cities.map(c => ({ city: c.slug }))
}

type Params = Promise<{ city: string }>

export default async function CityPage({ params }: { params: Params }) {
  const { city: citySlug } = await params
  const { practices, cities } = exportDapCmsSnapshot()

  const cityRecord = cities.find(c => c.slug === citySlug)
  if (!cityRecord) notFound()

  const cityPractices = practices.filter(p => p.city === cityRecord.cityName)
  const confirmed     = cityPractices.filter(p => p.status === 'confirmed_dap_provider')
  const unconfirmed   = cityPractices.filter(p => p.status !== 'confirmed_dap_provider')
  const suppressedCount = cityRecord.hiddenPracticeIds.length

  return (
    <>
      <CityPageHeader
        cityName={cityRecord.cityName}
        confirmedCount={confirmed.length}
        totalPublicCount={cityPractices.length}
        suppressedCount={suppressedCount}
      />

      {confirmed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Confirmed DAP Providers ({confirmed.length})
            </p>
          </div>
          <div className="space-y-3">
            {confirmed.map(r => (
              <ProviderResultCard key={r.id} record={r} />
            ))}
          </div>
        </section>
      )}

      {unconfirmed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Other Practices in Dataset ({unconfirmed.length})
            </p>
            <p className="text-xs text-gray-400">— none have confirmed DAP participation</p>
          </div>
          <div className="space-y-3">
            {unconfirmed.map(r => (
              <ProviderResultCard key={r.id} record={r} />
            ))}
          </div>
        </section>
      )}

      {cityPractices.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-8 text-center space-y-2">
          <p className="text-sm font-medium text-gray-700">
            No listed practices in {cityRecord.cityName} yet
          </p>
          <p className="text-xs text-gray-400">
            Submit a request below and we'll identify patient demand in your area.
          </p>
        </div>
      )}

      <HowItWorksSection />
    </>
  )
}
