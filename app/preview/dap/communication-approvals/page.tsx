// Preview-only — no email sending, no MKCRM calls, no Supabase mutations.
// Admin approval is not delivery. Approved = approved for future sending only.
// CB Control Center determines approval. MKCRM does not.

import Link from 'next/link'
import {
  getAllDapPracticeDecisionCommunicationApprovalPreviews,
  getAllDapMemberStatusCommunicationApprovalPreviews,
} from '@/lib/cb-control-center/dapCommunicationApprovals'
import type { DapCommunicationApprovalDecision } from '@/lib/cb-control-center/dapCommunicationApprovalTypes'

export const dynamic = 'force-dynamic'

// ─── Status badge ─────────────────────────────────────────────────────────────

function approvalStatusBadgeClass(status: DapCommunicationApprovalDecision['approvalStatus']): string {
  switch (status) {
    case 'not_reviewed':             return 'bg-gray-100 text-gray-600 border border-gray-300'
    case 'approved_for_future_send': return 'bg-green-50 text-green-700 border border-green-200'
    case 'rejected_for_future_send': return 'bg-red-50 text-red-700 border border-red-200'
    case 'approval_revoked':         return 'bg-amber-50 text-amber-700 border border-amber-200'
  }
}

// ─── Single approval card ─────────────────────────────────────────────────────

function ApprovalCard({ decision }: { decision: DapCommunicationApprovalDecision }) {
  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-6 space-y-5"
      data-approval-card={decision.templateKey}
    >
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
          data-template-key={decision.templateKey}
        >
          {decision.templateKey}
        </span>
        <span className="inline-block rounded-full px-3 py-1 text-xs bg-gray-100 text-gray-600 border border-gray-200">
          {decision.communicationType}
        </span>
        <span className="inline-block rounded-full px-3 py-1 text-xs bg-gray-100 text-gray-600 border border-gray-200">
          audience: {decision.audience}
        </span>
      </div>

      {/* Approval status */}
      <div
        className="rounded-md px-4 py-3 space-y-2"
        data-approval-status={decision.approvalStatus}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${approvalStatusBadgeClass(decision.approvalStatus)}`}
          >
            {decision.approvalStatus}
          </span>
          <span className="text-xs font-mono text-gray-500">
            eventType: {decision.approvalEventType}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs" data-eligible-for-approval>
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              decision.eligibleForApproval ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          <span className="font-mono text-gray-600">eligibleForApproval:</span>
          <span className={`font-mono font-semibold ${
            decision.eligibleForApproval ? 'text-green-700' : 'text-red-600'
          }`}>
            {String(decision.eligibleForApproval)}
          </span>
        </div>

        {decision.approvalBlockerCodes.length > 0 && (
          <div className="text-xs text-red-600 space-y-0.5">
            <p className="font-medium">Approval blockers:</p>
            {decision.approvalBlockerCodes.map(c => (
              <span key={c} className="block font-mono">{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Dispatch context */}
      <div
        className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 space-y-1"
        data-dispatch-context
      >
        <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide mb-2">Dispatch Context</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-yellow-800">
          <div>readinessStatus: {decision.readinessStatus}</div>
          <div>dispatchEventType: {decision.dispatchEventType}</div>
          <div>
            shadowPayloadValid:{' '}
            <span className={decision.shadowPayloadValid ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
              {String(decision.shadowPayloadValid)}
            </span>
          </div>
          <div>channel: {decision.channel}</div>
        </div>
      </div>

      {/* Authority boundary */}
      <div
        className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 space-y-1"
        data-source-authority
      >
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">Decision Authority</p>
        <div className="text-xs font-mono space-y-0.5 text-blue-800">
          <div>decisionAuthority: <span className="font-semibold">{decision.source.decisionAuthority}</span></div>
          <div>
            crmAuthority:{' '}
            <span className="text-green-700 font-semibold">{String(decision.source.crmAuthority)}</span>
          </div>
          <div>
            paymentAuthority:{' '}
            <span className="text-green-700 font-semibold">{String(decision.source.paymentAuthority)}</span>
          </div>
        </div>
      </div>

      {/* Delivery disabled */}
      <div
        className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 space-y-1"
        data-delivery-disabled
      >
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Delivery (All Disabled)</p>
        <div className="text-xs font-mono space-y-0.5 text-gray-700">
          <div>deliveryDisabled: <span className="text-amber-700 font-semibold">{String(decision.delivery.deliveryDisabled)}</span></div>
          <div>externalSendDisabled: <span className="text-amber-700 font-semibold">{String(decision.delivery.externalSendDisabled)}</span></div>
          <div>mkcrmDeliveryDisabled: <span className="text-amber-700 font-semibold">{String(decision.delivery.mkcrmDeliveryDisabled)}</span></div>
          <div>resendDisabled: <span className="text-amber-700 font-semibold">{String(decision.delivery.resendDisabled)}</span></div>
        </div>
      </div>

      {/* Safety flags */}
      <div
        className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 space-y-1"
        data-safety-flags
      >
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Safety Flags</p>
        <div className="text-xs font-mono space-y-0.5 text-gray-700">
          <div>noPhi: <span className="text-green-700 font-semibold">{String(decision.safety.noPhi)}</span></div>
          <div>noPaymentCta: <span className="text-green-700 font-semibold">{String(decision.safety.noPaymentCta)}</span></div>
          <div>noEmailBody: <span className="text-green-700 font-semibold">{String(decision.safety.noEmailBody)}</span></div>
          <div>noStoredStanding: <span className="text-green-700 font-semibold">{String(decision.safety.noStoredStanding)}</span></div>
        </div>
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunicationApprovalsPreviewPage() {
  const practiceApprovals = getAllDapPracticeDecisionCommunicationApprovalPreviews()
  const memberApprovals   = getAllDapMemberStatusCommunicationApprovalPreviews()
  const allApprovals      = [...practiceApprovals, ...memberApprovals]

  return (
    <main
      className="max-w-4xl mx-auto px-4 py-8 space-y-10"
      data-communication-approvals-preview-page
    >
      {/* Back nav */}
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="communication-approvals-preview"
        >
          DAP Communication Admin Approval Surface
        </h1>
        <p className="text-xs text-gray-400">
          Preview only — internal use. No emails are sent. Approval authorizes future sending only.
        </p>
      </div>

      {/* Authority notice */}
      <section
        className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-2"
        data-authority-notice
      >
        <p className="text-xs font-semibold text-blue-800">Approval Authority</p>
        <p className="text-xs text-blue-700">
          CB Control Center grants or rejects approval for future sending.
          MKCRM does not determine practice status, payment status, membership standing,
          or dispatch eligibility. Approval is not delivery.
        </p>
        <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
          <li>No payment CTA is present on any template.</li>
          <li>No PHI is present on any template.</li>
          <li>All delivery flags are disabled in Phase 9Y.</li>
          <li>These are preview-only approval records. No email is sent from this surface.</li>
        </ul>
      </section>

      {/* Summary counts */}
      <section className="rounded-lg border border-gray-200 bg-white px-6 py-4 space-y-2" data-approval-summary>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Summary</p>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-mono text-gray-600">Total templates: </span>
            <span className="font-semibold" data-total-approval-count>{allApprovals.length}</span>
          </div>
          <div>
            <span className="font-mono text-gray-600">Eligible for approval: </span>
            <span className="font-semibold text-green-700">
              {allApprovals.filter(a => a.eligibleForApproval).length}
            </span>
          </div>
          <div>
            <span className="font-mono text-gray-600">Not reviewed: </span>
            <span className="font-semibold text-gray-500">
              {allApprovals.filter(a => a.approvalStatus === 'not_reviewed').length}
            </span>
          </div>
        </div>
      </section>

      {/* Practice decision approvals */}
      <section className="space-y-4" data-practice-decision-approvals>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
          Practice Decision Emails ({practiceApprovals.length})
        </h2>
        <div className="space-y-6">
          {practiceApprovals.map(decision => (
            <ApprovalCard key={decision.templateKey} decision={decision} />
          ))}
        </div>
      </section>

      {/* Member status approvals */}
      <section className="space-y-4" data-member-status-approvals>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
          Member Status Emails ({memberApprovals.length})
        </h2>
        <div className="space-y-6">
          {memberApprovals.map(decision => (
            <ApprovalCard key={decision.templateKey} decision={decision} />
          ))}
        </div>
      </section>
    </main>
  )
}
