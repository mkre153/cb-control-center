import Link from 'next/link'
import {
  shouldShowJoinCta,
  shouldShowPricingClaims,
  getCtaLabel,
  getCtaHref,
  CONFIRMED_PRICING,
  REQUEST_EXPECTATION_COPY,
  DIRECTORY_ROUTE,
  REQUEST_FLOW_ROUTE,
} from '@/lib/dap/registry/dapDisplayRules'
import { ProviderStatusBadge } from './ProviderStatusBadge'
import type { MockDentistPage } from '@/lib/cb-control-center/types'

interface DentistDetailViewProps {
  practice: MockDentistPage
  offerTermsValidated: boolean
  ctaGateUnlocked: boolean
}

export function DentistDetailView({
  practice,
  offerTermsValidated,
  ctaGateUnlocked,
}: DentistDetailViewProps) {
  const showJoin    = shouldShowJoinCta(practice.provider_status, offerTermsValidated, ctaGateUnlocked)
  const showPricing = shouldShowPricingClaims(practice.provider_status, offerTermsValidated)
  const ctaLabel    = getCtaLabel(practice.provider_status, offerTermsValidated, ctaGateUnlocked)
  const ctaHref     = getCtaHref(practice.provider_status, practice.pageSlug, offerTermsValidated, ctaGateUnlocked)
  const isConfirmed = practice.provider_status === 'confirmed_dap_provider'

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href={DIRECTORY_ROUTE} className="hover:text-gray-600">Directory</Link>
        <span>›</span>
        <span>{practice.practiceName}</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-7 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{practice.practiceName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{practice.city}, CA {practice.zip}</p>
          </div>
          <ProviderStatusBadge status={practice.provider_status} />
        </div>

        {/* Confirmed provider — pricing section */}
        {isConfirmed && showPricing && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-4 space-y-2">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">DAP Plan Pricing</p>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-green-600">Adult membership</p>
                <p className="text-lg font-bold text-green-800">{CONFIRMED_PRICING.adult}</p>
              </div>
              <div>
                <p className="text-xs text-green-600">Child membership (age 17 &amp; under)</p>
                <p className="text-lg font-bold text-green-800">{CONFIRMED_PRICING.child}</p>
              </div>
            </div>
            <p className="text-xs text-green-600">{CONFIRMED_PRICING.source}</p>
          </div>
        )}

        {/* Confirmed provider — offer terms pending */}
        {isConfirmed && !showPricing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-700">
              Confirmed DAP provider. Offer terms and pricing are being finalized — check back soon.
            </p>
          </div>
        )}

        {/* CTA */}
        <Link
          href={ctaHref}
          className={`block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isConfirmed
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-800 hover:bg-gray-900 text-white'
          }`}
        >
          {ctaLabel}
        </Link>

        {showJoin && (
          <p className="text-xs text-gray-400 text-center">
            Membership arranged directly with this practice · DAP is a directory service
          </p>
        )}
      </div>

      {/* Unconfirmed — expectation copy */}
      {!isConfirmed && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">About this listing</p>
          <p className="text-sm text-gray-600">{REQUEST_EXPECTATION_COPY}</p>
          <p className="text-xs text-gray-400">
            This practice is in the San Diego County dental dataset. It has not confirmed DAP participation.
            No DAP pricing, membership terms, or plan availability claims are made for this listing.
          </p>
          <Link
            href={REQUEST_FLOW_ROUTE}
            className="inline-block text-xs font-medium text-gray-700 underline hover:text-gray-900 mt-1"
          >
            Request DAP at this practice →
          </Link>
        </div>
      )}
    </div>
  )
}
