// Public-safe member status preview.
// The page displays status. It does not decide status.
// standing is derived, not stored.
// No PHI. No payment CTAs. No raw billing events. No MKCRM authority.
// Client Builder Pro is the payment system. DAP is the registry.

import Link from 'next/link'
import {
  getDapMemberStatusReadModel,
  getAllDapMemberPublicStatusFixtures,
  DAP_P10_FIXTURE_MEMBERSHIP_IDS,
} from '@/lib/cb-control-center/dapMemberStatusReadModel'
import type { DapMemberPublicStatus } from '@/lib/cb-control-center/dapMemberStatusPublicTypes'
import type { DapMemberStanding }     from '@/lib/cb-control-center/dapMemberStatusTypes'

export const dynamic = 'force-dynamic'

type Params = Promise<{ membershipId: string }>

// ─── Badge colors ─────────────────────────────────────────────────────────────

function publicStatusBadgeClass(status: DapMemberPublicStatus): string {
  switch (status) {
    case 'active':           return 'bg-green-50 text-green-700 border border-green-200'
    case 'pending':          return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'attention_needed': return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'inactive':         return 'bg-gray-100 text-gray-600 border border-gray-300'
    case 'unknown':          return 'bg-gray-50 text-gray-500 border border-gray-200'
  }
}

function standingBadgeClass(standing: DapMemberStanding): string {
  switch (standing) {
    case 'active':          return 'text-green-700'
    case 'pending':         return 'text-blue-700'
    case 'past_due':        return 'text-amber-700'
    case 'payment_failed':  return 'text-red-700'
    case 'canceled':        return 'text-gray-600'
    case 'refunded':        return 'text-violet-700'
    case 'chargeback':      return 'text-red-800'
    default:                return 'text-gray-500'
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MemberStatusPublicPage({ params }: { params: Params }) {
  const { membershipId } = await params
  const model = getDapMemberStatusReadModel(membershipId)

  return (
    <main
      className="max-w-2xl mx-auto px-4 py-8 space-y-8"
      data-member-status-public-page
    >
      {/* Back nav */}
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      {/* Heading */}
      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="member-status-public"
        >
          Membership Status
        </h1>
        <p className="font-mono text-xs text-gray-400" data-membership-id>
          {model.membershipId}
        </p>
        <p className="text-xs text-gray-400">Preview — internal use only</p>
      </div>

      {/* Authority notice */}
      <section
        className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-1"
        data-authority-notice
      >
        <p className="text-xs font-semibold text-blue-800">Derived Standing</p>
        <p className="text-xs text-blue-700">
          Membership standing is derived from Client Builder Pro billing events.
          DAP is a registry — it does not store standing or process payments.
          MKCRM has no authority over member standing.
        </p>
      </section>

      {/* Status card */}
      <section
        className="rounded-lg border border-gray-200 bg-white p-6 space-y-5"
        data-status-card
      >
        {/* Public status + standing */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${publicStatusBadgeClass(model.publicStatus)}`}
            data-public-status={model.publicStatus}
          >
            {model.statusLabel}
          </span>
          <span
            className={`text-xs font-mono ${standingBadgeClass(model.standing)}`}
            data-standing={model.standing}
          >
            standing: {model.standing}
          </span>
        </div>

        {/* Status summary */}
        <p
          className="text-sm text-gray-700"
          data-status-summary
        >
          {model.statusSummary}
        </p>

        {/* Next step */}
        <div
          className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3"
          data-next-step
        >
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Next Step</p>
          <p className="text-sm text-gray-700">{model.nextStep}</p>
        </div>
      </section>

      {/* Source authority */}
      <section
        className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 space-y-1"
        data-source-authority
      >
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">Source Authority</p>
        <div className="text-xs font-mono space-y-0.5 text-blue-800">
          <div>
            derivedFromBillingEvents:{' '}
            <span className="text-green-700 font-semibold">
              {String(model.source.derivedFromBillingEvents)}
            </span>
          </div>
          <div>paymentAuthority: <span className="font-semibold">{model.source.paymentAuthority}</span></div>
          <div>
            crmAuthority:{' '}
            <span className="text-green-700 font-semibold">{String(model.source.crmAuthority)}</span>
          </div>
          <div>dapAuthority: <span className="font-semibold">{model.source.dapAuthority}</span></div>
        </div>
      </section>

      {/* Safety flags */}
      <section
        className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 space-y-1"
        data-safety-flags
      >
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Safety Flags</p>
        <div className="text-xs font-mono space-y-0.5 text-gray-700">
          <div>
            includesPhi:{' '}
            <span className="text-green-700 font-semibold">{String(model.safety.includesPhi)}</span>
          </div>
          <div>
            includesPaymentCta:{' '}
            <span className="text-green-700 font-semibold">{String(model.safety.includesPaymentCta)}</span>
          </div>
          <div>
            includesRawBillingEvents:{' '}
            <span className="text-green-700 font-semibold">{String(model.safety.includesRawBillingEvents)}</span>
          </div>
        </div>
      </section>

      {/* Fixture navigation */}
      <section className="space-y-3" data-fixture-nav>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Other fixture standings
        </p>
        <div className="flex flex-wrap gap-2">
          {DAP_P10_FIXTURE_MEMBERSHIP_IDS.map(id => (
            <Link
              key={id}
              href={`/preview/dap/member-status/${id}`}
              className={`inline-block rounded-full px-3 py-1 text-xs border font-mono ${
                id === membershipId
                  ? 'bg-gray-200 text-gray-700 border-gray-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {id}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
