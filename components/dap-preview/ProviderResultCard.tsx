import Link from 'next/link'
import { getStatusColors } from '@/lib/cb-control-center/dapDisplayRules'
import { ProviderStatusBadge } from './ProviderStatusBadge'
import type { DapPracticeCmsRecord } from '@/lib/dap/site/dapCmsTypes'

interface ProviderResultCardProps {
  record: DapPracticeCmsRecord
}

export function ProviderResultCard({ record }: ProviderResultCardProps) {
  if (!record.publicDisplay.isPublic) return null

  const { card, cta }                                      = getStatusColors(record.status)
  const { showPricing, showJoinCta, ctaLabel, ctaHref }    = record.publicDisplay

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${card}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{record.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{record.city}, CA {record.zip}</p>
        </div>
        <ProviderStatusBadge status={record.status} />
      </div>

      {/* Pricing — rendered from CMS offerSummary (gated by confirmed + offerTermsValidated) */}
      {showPricing && record.offerSummary && (
        <div className="bg-green-50 border border-green-100 rounded px-3 py-2 space-y-0.5">
          <p className="text-xs font-semibold text-green-700">Plan Pricing</p>
          <p className="text-sm text-green-800">
            {record.offerSummary.adultAnnualFee} adult · {record.offerSummary.childAnnualFee} child
          </p>
          <p className="text-xs text-green-600">{record.offerSummary.source}</p>
        </div>
      )}

      {!showPricing && record.status !== 'confirmed_dap_provider' && (
        <p className="text-xs text-gray-500 italic">
          This practice has not confirmed DAP participation — no pricing or plan details available.
        </p>
      )}

      {record.status === 'confirmed_dap_provider' && !showPricing && (
        <p className="text-xs text-gray-500 italic">
          Confirmed DAP provider. Offer terms are being finalized — plan details coming soon.
        </p>
      )}

      {/* CTA — label and href pre-computed by CMS export */}
      <Link
        href={ctaHref}
        className={`block w-full text-center px-4 py-2 rounded text-sm font-medium transition-colors ${cta}`}
      >
        {ctaLabel}
      </Link>

      {showJoinCta && (
        <p className="text-xs text-gray-400 text-center">
          Membership arranged directly with this practice · DAP is a directory service
        </p>
      )}
    </div>
  )
}
