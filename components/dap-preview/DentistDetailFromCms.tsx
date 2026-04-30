import Link from 'next/link'
import { DIRECTORY_ROUTE, REQUEST_FLOW_ROUTE } from '@/lib/cb-control-center/dapDisplayRules'
import { ProviderStatusBadge } from './ProviderStatusBadge'
import type { DapDentistPageCmsRecord } from '@/lib/cb-control-center/dapCmsTypes'

interface DentistDetailFromCmsProps {
  record: DapDentistPageCmsRecord
}

export function DentistDetailFromCms({ record }: DentistDetailFromCmsProps) {
  const isConfirmed   = record.publicState === 'confirmed_provider'
  const isEstimate    = record.publicState === 'search_estimate'
  const badgeStatus   = isConfirmed ? 'confirmed_dap_provider' as const : 'not_confirmed' as const
  const showJoinNote  = record.primaryCta.href.includes('/enroll')

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href={DIRECTORY_ROUTE} className="hover:text-gray-600">Directory</Link>
        <span>›</span>
        <span className="text-gray-600">{record.practiceName}</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-7 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{record.practiceName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{record.city}, {record.state} {record.zip}</p>
          </div>
          <ProviderStatusBadge status={badgeStatus} />
        </div>

        {/* Offer summary — from CMS record, null unless confirmed + offerTermsValidated */}
        {record.offerSummary && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-4 space-y-2">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">DAP Plan Pricing</p>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-green-600">Adult membership</p>
                <p className="text-lg font-bold text-green-800">{record.offerSummary.adultAnnualFee}</p>
              </div>
              <div>
                <p className="text-xs text-green-600">Child membership (age 17 &amp; under)</p>
                <p className="text-lg font-bold text-green-800">{record.offerSummary.childAnnualFee}</p>
              </div>
            </div>
            <p className="text-xs text-green-600">{record.offerSummary.source}</p>
          </div>
        )}

        {/* Confirmed, offer terms pending */}
        {isConfirmed && !record.offerSummary && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-700">
              Confirmed DAP provider. Offer terms and pricing are being finalized — check back soon.
            </p>
          </div>
        )}

        {/* Pending confirmation (search_estimate state) */}
        {isEstimate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-xs text-blue-700">
              DAP outreach is in progress with this practice. No plan is confirmed yet — check back or submit a request to register your interest.
            </p>
          </div>
        )}

        {/* CTA — href and label come from CMS record */}
        <Link
          href={record.primaryCta.href}
          className={`block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isConfirmed
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-800 hover:bg-gray-900 text-white'
          }`}
        >
          {record.primaryCta.label}
        </Link>

        {showJoinNote && (
          <p className="text-xs text-gray-400 text-center">
            Membership arranged directly with this practice · DAP is a directory service
          </p>
        )}
      </div>

      {/* Expectation copy — from CMS record, present only on unconfirmed pages */}
      {record.expectationCopy && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">About this listing</p>
          <p className="text-sm text-gray-600">{record.expectationCopy}</p>
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
