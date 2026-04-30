import { shouldShowConfirmedBadge } from '@/lib/cb-control-center/dapDisplayRules'
import type { ProviderStatus } from '@/lib/cb-control-center/types'

interface ProviderStatusBadgeProps {
  status: ProviderStatus
}

export function ProviderStatusBadge({ status }: ProviderStatusBadgeProps) {
  if (shouldShowConfirmedBadge(status)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        Confirmed DAP Provider
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
      Not yet a DAP provider
    </span>
  )
}
