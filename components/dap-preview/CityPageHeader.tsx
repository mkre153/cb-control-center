import Link from 'next/link'
import { getCityHeading, getCitySubheading } from '@/lib/cb-control-center/dapCityData'
import { DIRECTORY_ROUTE, REQUEST_FLOW_ROUTE } from '@/lib/dap/registry/dapDisplayRules'

interface CityPageHeaderProps {
  cityName: string
  confirmedCount: number
  totalPublicCount: number
  suppressedCount: number
}

export function CityPageHeader({
  cityName,
  confirmedCount,
  totalPublicCount,
  suppressedCount,
}: CityPageHeaderProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-8 space-y-3">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href={DIRECTORY_ROUTE} className="hover:text-gray-600">Directory</Link>
        <span>›</span>
        <span>{cityName}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">{getCityHeading(cityName)}</h1>
      <p className="text-sm text-gray-500 max-w-xl">{getCitySubheading()}</p>

      <div className="flex flex-wrap gap-3 pt-1 text-xs">
        {confirmedCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            {confirmedCount} confirmed DAP provider{confirmedCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
            No confirmed DAP providers yet
          </span>
        )}
        {totalPublicCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 border border-gray-200">
            {totalPublicCount} listed practice{totalPublicCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {confirmedCount === 0 && (
        <div className="pt-2">
          <Link
            href={REQUEST_FLOW_ROUTE}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Request DAP in {cityName}
          </Link>
        </div>
      )}

      {/* Preview-layer annotation — shows suppressed count for architecture review */}
      {suppressedCount > 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded px-3 py-1.5 mt-2">
          [Preview note: {suppressedCount} practice{suppressedCount !== 1 ? 's' : ''} in this city suppressed from public results — internal routing only]
        </p>
      )}
    </div>
  )
}
