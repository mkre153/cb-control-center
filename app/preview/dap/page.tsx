import { DirectoryHero } from '@/components/dap-preview/DirectoryHero'
import { ZipSearchForm } from '@/components/dap-preview/ZipSearchForm'
import { ProviderResultCard } from '@/components/dap-preview/ProviderResultCard'
import { HowItWorksSection } from '@/components/dap-preview/HowItWorksSection'
import { SearchStateDisplay } from '@/components/dap-preview/SearchStateDisplay'
import { exportDapCmsSnapshot } from '@/lib/cb-control-center/dapCmsExport'
import { REQUEST_FLOW_ROUTE } from '@/lib/dap/registry/dapDisplayRules'
import Link from 'next/link'

export default function DAPDirectoryPage() {
  const { practices } = exportDapCmsSnapshot()

  const confirmed   = practices.filter(p => p.status === 'confirmed_dap_provider')
  const unconfirmed = practices.filter(p => p.status !== 'confirmed_dap_provider')

  return (
    <>
      <DirectoryHero />
      <ZipSearchForm />

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Other Practices in Dataset ({unconfirmed.length})
              </p>
            </div>
            <p className="text-xs text-gray-400">None have confirmed DAP participation</p>
          </div>
          <div className="space-y-3">
            {unconfirmed.map(r => (
              <ProviderResultCard key={r.id} record={r} />
            ))}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
            These practices are in the San Diego County dental dataset but have not confirmed DAP participation.
            You can{' '}
            <Link href={REQUEST_FLOW_ROUTE} className="font-medium text-gray-700 underline">
              request that DAP contact them
            </Link>{' '}
            on your behalf.
          </div>
        </section>
      )}

      <SearchStateDisplay />
      <HowItWorksSection />
    </>
  )
}
