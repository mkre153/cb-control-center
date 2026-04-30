// Admin decision readiness preview — internal use only.
// No PHI. No payment actions. No MKCRM network calls. No email sending.

import Link from 'next/link'
import {
  getAllDapAdminDecisionReadinessPreviews,
  DAP_ADMIN_DECISION_FIXTURES,
} from '@/lib/cb-control-center/dapAdminDecisionReadiness'
import type {
  DapAdminDecisionReadinessResult,
  DapAdminDecisionReadinessStatus,
} from '@/lib/cb-control-center/dapAdminDecisionReadiness'

export const dynamic = 'force-dynamic'

function statusBadgeClass(status: DapAdminDecisionReadinessStatus): string {
  switch (status) {
    case 'ready_for_review':      return 'bg-green-50 text-green-700 border border-green-200'
    case 'missing_required_fields': return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'blocked_by_safety_rules': return 'bg-red-50 text-red-700 border border-red-200'
    case 'already_decided':       return 'bg-gray-100 text-gray-600 border border-gray-300'
  }
}

function ReadinessCard({ result, label }: { result: DapAdminDecisionReadinessResult; label: string }) {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-5 space-y-4"
      data-readiness-card
      data-status={result.status}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-xs text-gray-400">{result.requestId}</span>
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(result.status)}`}>
          {result.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div>
          canApprove:{' '}
          <span className={result.canApprove ? 'text-green-700 font-semibold' : 'text-gray-400'}>
            {String(result.canApprove)}
          </span>
        </div>
        <div>
          canReject:{' '}
          <span className={result.canReject ? 'text-amber-700 font-semibold' : 'text-gray-400'}>
            {String(result.canReject)}
          </span>
        </div>
      </div>

      {result.blockers.length > 0 && (
        <ul className="space-y-1" data-blockers>
          {result.blockers.map((b, i) => (
            <li key={i} className="text-xs text-red-700 flex gap-2">
              <span className="text-red-400">✗</span>
              {b}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2 space-y-0.5 text-xs font-mono text-gray-600" data-safety-flags>
        <div>includesPhi: <span className="text-green-700 font-semibold">{String(result.safety.includesPhi)}</span></div>
        <div>usesPaymentAuthority: <span className="text-green-700 font-semibold">{String(result.safety.usesPaymentAuthority)}</span></div>
        <div>usesMkcrmDecisionAuthority: <span className="text-green-700 font-semibold">{String(result.safety.usesMkcrmDecisionAuthority)}</span></div>
        <div>adminDecisionRequired: <span className="text-blue-700 font-semibold">{String(result.safety.adminDecisionRequired)}</span></div>
      </div>
    </div>
  )
}

export default function AdminReviewPreviewPage() {
  const previews = getAllDapAdminDecisionReadinessPreviews()
  const fixtureKeys = Object.keys(DAP_ADMIN_DECISION_FIXTURES)

  return (
    <main
      className="max-w-3xl mx-auto px-4 py-8 space-y-8"
      data-admin-review-preview-page
    >
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="admin-review"
        >
          Admin Decision Readiness
        </h1>
        <p className="text-xs text-gray-400">Preview — internal use only</p>
      </div>

      <section
        className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-1"
        data-authority-notice
      >
        <p className="text-xs font-semibold text-blue-800">Authority Boundary</p>
        <p className="text-xs text-blue-700">
          Admin decision is required. MKCRM cannot approve or reject requests.
          Payment standing cannot determine provider enrollment.
          DAP is a registry — approval here does not confirm a public provider page.
        </p>
      </section>

      <div className="space-y-4">
        {previews.map((result, i) => (
          <ReadinessCard key={result.requestId} result={result} label={fixtureKeys[i] ?? ''} />
        ))}
      </div>
    </main>
  )
}
