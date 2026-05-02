// Member admin summary preview — internal use only.
// Admin-facing complement to the public member status page (Phase 10).
// No PHI. No payment CTA. Computed by server.

import Link from 'next/link'
import {
  getAllDapMemberAdminSummaries,
} from '@/lib/cb-control-center/dapMemberAdminSummary'
import type { DapMemberAdminSummary } from '@/lib/cb-control-center/dapMemberAdminSummary'
import type { DapMemberStanding } from '@/lib/dap/membership/dapMemberStatusTypes'

export const dynamic = 'force-dynamic'

function standingBadgeClass(standing: DapMemberStanding): string {
  switch (standing) {
    case 'active':          return 'text-green-700 bg-green-50 border-green-200'
    case 'pending':         return 'text-blue-700 bg-blue-50 border-blue-200'
    case 'past_due':        return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'payment_failed':  return 'text-red-700 bg-red-50 border-red-200'
    case 'canceled':        return 'text-gray-600 bg-gray-100 border-gray-300'
    case 'refunded':        return 'text-violet-700 bg-violet-50 border-violet-200'
    case 'chargeback':      return 'text-red-800 bg-red-50 border-red-300'
    default:                return 'text-gray-500 bg-gray-50 border-gray-200'
  }
}

function SummaryCard({ summary }: { summary: DapMemberAdminSummary }) {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-5 space-y-4"
      data-member-admin-summary-card
      data-standing={summary.standing}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-xs text-gray-400">{summary.membershipId}</span>
        <span
          className={`inline-block rounded border px-3 py-0.5 text-xs font-semibold ${standingBadgeClass(summary.standing)}`}
        >
          {summary.standing}
        </span>
        <span className="text-xs text-gray-500">→ {summary.publicStatus}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono text-gray-700">
        <div>standingSource: <span className="text-blue-700">{summary.standingSource}</span></div>
        <div>statusPageSafe: <span className={summary.statusPageSafe ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>{String(summary.statusPageSafe)}</span></div>
        <div>
          communicationTemplates:{' '}
          <span className={summary.communicationTemplatesAvailable ? 'text-green-700 font-semibold' : 'text-gray-400'}>
            {summary.communicationTemplateCount}
          </span>
        </div>
      </div>

      <div className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2 space-y-0.5 text-xs font-mono text-gray-600" data-safety-flags>
        <div>derivedFromBillingEvents: <span className="text-green-700 font-semibold">{String(summary.derivedFromBillingEvents)}</span></div>
        <div>includesPaymentCta: <span className="text-green-700 font-semibold">{String(summary.includesPaymentCta)}</span></div>
        <div>includesPhi: <span className="text-green-700 font-semibold">{String(summary.includesPhi)}</span></div>
        <div>computedByServer: <span className="text-blue-700 font-semibold">{String(summary.computedByServer)}</span></div>
      </div>

      {summary.warnings.length > 0 && (
        <ul className="space-y-1" data-warnings>
          {summary.warnings.map((w, i) => (
            <li key={i} className="text-xs text-amber-700 flex gap-2">
              <span>⚠</span>{w}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3 text-xs">
        <Link
          href={`/preview/dap/member-status/${summary.membershipId}`}
          className="text-blue-600 hover:underline"
        >
          Public status page →
        </Link>
      </div>
    </div>
  )
}

export default function MemberAdminSummaryPreviewPage() {
  const summaries = getAllDapMemberAdminSummaries()

  return (
    <main
      className="max-w-3xl mx-auto px-4 py-8 space-y-8"
      data-member-admin-summary-preview-page
    >
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="member-admin-summary"
        >
          Member Admin Summary
        </h1>
        <p className="text-xs text-gray-400">Preview — internal use only</p>
      </div>

      <section
        className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-1"
        data-authority-notice
      >
        <p className="text-xs font-semibold text-blue-800">Derived Standing</p>
        <p className="text-xs text-blue-700">
          Standing is derived from Client Builder Pro billing events.
          No PHI is included. No payment CTA is shown.
          DAP is a registry — it does not store standing or process payments.
        </p>
      </section>

      <div className="space-y-4">
        {summaries.map(summary => (
          <SummaryCard key={summary.membershipId} summary={summary} />
        ))}
      </div>
    </main>
  )
}
