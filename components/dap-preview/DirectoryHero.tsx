import { HERO_HEADLINE, HERO_SUBHEAD, REQUEST_FLOW_ROUTE } from '@/lib/dap/registry/dapDisplayRules'
import Link from 'next/link'

export function DirectoryHero() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-10 text-center space-y-4">
      <p className="text-xs font-semibold text-green-600 uppercase tracking-widest">
        Dental Advantage Plan Directory
      </p>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 max-w-xl mx-auto leading-snug">
        {HERO_HEADLINE}
      </h1>
      <p className="text-base text-gray-500 max-w-md mx-auto">{HERO_SUBHEAD}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href={REQUEST_FLOW_ROUTE}
          className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Request a dentist near me
        </Link>
        <a
          href="#search"
          className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Search by ZIP code
        </a>
      </div>
      <p className="text-xs text-gray-400 max-w-sm mx-auto">
        DAP connects patients with in-house dental savings plans at participating practices.
        Each practice sets its own pricing.
      </p>
    </div>
  )
}
