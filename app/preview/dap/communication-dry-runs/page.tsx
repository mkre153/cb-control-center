// Preview-only — no email sending, no MKCRM calls, no Resend calls, no Supabase mutations.
// Dry-run delivery is not delivery. This page simulates delivery readiness only.
// CB Control Center is the authority. MKCRM is not.

import Link from 'next/link'
import {
  getAllDapPracticeDecisionCommunicationDryRunPreviews,
  getAllDapMemberStatusCommunicationDryRunPreviews,
} from '@/lib/cb-control-center/dapCommunicationDryRun'
import type { DapCommunicationDryRunResult } from '@/lib/cb-control-center/dapCommunicationDryRunTypes'

export const dynamic = 'force-dynamic'

// ─── Dry-run status badge ─────────────────────────────────────────────────────

function dryRunStatusBadgeClass(status: DapCommunicationDryRunResult['dryRunStatus']): string {
  switch (status) {
    case 'not_ready':       return 'bg-gray-100 text-gray-600 border border-gray-300'
    case 'dry_run_ready':   return 'bg-green-50 text-green-700 border border-green-200'
    case 'dry_run_blocked': return 'bg-red-50 text-red-700 border border-red-200'
  }
}

// ─── Single dry-run card ──────────────────────────────────────────────────────

function DryRunCard({ result }: { result: DapCommunicationDryRunResult }) {
  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-6 space-y-5"
      data-dry-run-card={result.templateKey}
    >
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
          data-template-key={result.templateKey}
        >
          {result.templateKey}
        </span>
        <span className="inline-block rounded-full px-3 py-1 text-xs bg-gray-100 text-gray-600 border border-gray-200">
          {result.communicationType}
        </span>
        <span className="inline-block rounded-full px-3 py-1 text-xs bg-gray-100 text-gray-600 border border-gray-200">
          adapter: {result.adapter}
        </span>
      </div>

      {/* Dry-run status */}
      <div
        className="rounded-md px-4 py-3 space-y-2"
        data-dry-run-status={result.dryRunStatus}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${dryRunStatusBadgeClass(result.dryRunStatus)}`}
          >
            {result.dryRunStatus}
          </span>
          <span className="text-xs font-mono text-gray-500">
            eventType: {result.dryRunEventType}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs" data-eligible-for-dry-run-delivery>
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              result.eligibleForDryRunDelivery ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          <span className="font-mono text-gray-600">eligibleForDryRunDelivery:</span>
          <span className={`font-mono font-semibold ${
            result.eligibleForDryRunDelivery ? 'text-green-700' : 'text-red-600'
          }`}>
            {String(result.eligibleForDryRunDelivery)}
          </span>
        </div>

        {result.dryRunBlockerCodes.length > 0 && (
          <div className="text-xs text-red-600 space-y-0.5">
            <p className="font-medium">Dry-run blockers:</p>
            {result.dryRunBlockerCodes.map(c => (
              <span key={c} className="block font-mono">{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Approval context */}
      <div
        className="rounded-md bg-indigo-50 border border-indigo-100 px-4 py-3 space-y-1"
        data-approval-context
      >
        <p className="text-xs font-medium text-indigo-700 uppercase tracking-wide mb-2">Approval Context</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-indigo-800">
          <div>approvalStatus: {result.approvalStatus}</div>
          <div>approvalEventType: <span className="text-[10px]">{result.approvalEventType}</span></div>
          <div>
            shadowPayloadValid:{' '}
            <span className={result.shadowPayloadValid ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
              {String(result.shadowPayloadValid)}
            </span>
          </div>
          <div>dispatchEventType: <span className="text-[10px]">{result.dispatchEventType}</span></div>
          <div>readinessStatus: {result.readinessStatus}</div>
          <div>channel: {result.channel}</div>
        </div>
      </div>

      {/* Authority boundary */}
      <div
        className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 space-y-1"
        data-source-authority
      >
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">Decision Authority</p>
        <div className="text-xs font-mono space-y-0.5 text-blue-800">
          <div>decisionAuthority: <span className="font-semibold">{result.source.decisionAuthority}</span></div>
          <div>
            crmAuthority:{' '}
            <span className="text-green-700 font-semibold">{String(result.source.crmAuthority)}</span>
          </div>
          <div>
            paymentAuthority:{' '}
            <span className="text-green-700 font-semibold">{String(result.source.paymentAuthority)}</span>
          </div>
        </div>
      </div>

      {/* Delivery simulation flags */}
      <div
        className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 space-y-1"
        data-delivery-disabled
      >
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Delivery Simulation (All Disabled / Not Sent)</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs font-mono text-gray-700">
          <div>dryRunOnly: <span className="text-amber-700 font-semibold">{String(result.delivery.dryRunOnly)}</span></div>
          <div>deliveryDisabled: <span className="text-amber-700 font-semibold">{String(result.delivery.deliveryDisabled)}</span></div>
          <div>externalSendDisabled: <span className="text-amber-700 font-semibold">{String(result.delivery.externalSendDisabled)}</span></div>
          <div>mkcrmDeliveryDisabled: <span className="text-amber-700 font-semibold">{String(result.delivery.mkcrmDeliveryDisabled)}</span></div>
          <div>resendDisabled: <span className="text-amber-700 font-semibold">{String(result.delivery.resendDisabled)}</span></div>
          <div>queued: <span className="text-green-700 font-semibold">{String(result.delivery.queued)}</span></div>
          <div>scheduled: <span className="text-green-700 font-semibold">{String(result.delivery.scheduled)}</span></div>
          <div>sent: <span className="text-green-700 font-semibold">{String(result.delivery.sent)}</span></div>
        </div>
      </div>

      {/* Safety flags */}
      <div
        className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 space-y-1"
        data-safety-flags
      >
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Safety Flags</p>
        <div className="text-xs font-mono space-y-0.5 text-gray-700">
          <div>noPhi: <span className="text-green-700 font-semibold">{String(result.safety.noPhi)}</span></div>
          <div>noPaymentCta: <span className="text-green-700 font-semibold">{String(result.safety.noPaymentCta)}</span></div>
          <div>noEmailBody: <span className="text-green-700 font-semibold">{String(result.safety.noEmailBody)}</span></div>
          <div>noStoredStanding: <span className="text-green-700 font-semibold">{String(result.safety.noStoredStanding)}</span></div>
        </div>
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunicationDryRunsPreviewPage() {
  const practiceResults = getAllDapPracticeDecisionCommunicationDryRunPreviews()
  const memberResults   = getAllDapMemberStatusCommunicationDryRunPreviews()
  const allResults      = [...practiceResults, ...memberResults]

  return (
    <main
      className="max-w-4xl mx-auto px-4 py-8 space-y-10"
      data-communication-dry-runs-preview-page
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
          data-page-heading="communication-dry-runs-preview"
        >
          DAP Communication Dry-Run Delivery Adapter
        </h1>
        <p className="text-xs text-gray-400">
          Simulation only — internal use. No emails are sent. Dry-run shows delivery readiness only.
        </p>
      </div>

      {/* Phase notice */}
      <section
        className="rounded-lg border border-amber-100 bg-amber-50 p-4 space-y-2"
        data-dry-run-notice
      >
        <p className="text-xs font-semibold text-amber-800">Phase 9Z — Dry-Run Delivery Simulation</p>
        <p className="text-xs text-amber-700">
          Phase 9Z simulates delivery readiness only. It does not send email, call MKCRM, call Resend,
          queue delivery, schedule delivery, or create real delivery status.
        </p>
        <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
          <li>No email is sent. No delivery is queued or scheduled.</li>
          <li>All delivery flags remain disabled. queued, scheduled, and sent are always false.</li>
          <li>CB Control Center is the authority. MKCRM does not decide dry-run eligibility.</li>
          <li>Dry-run eligibility requires a prior approved_for_future_send admin approval.</li>
        </ul>
      </section>

      {/* Summary */}
      <section className="rounded-lg border border-gray-200 bg-white px-6 py-4 space-y-2" data-dry-run-summary>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Summary</p>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-mono text-gray-600">Total templates: </span>
            <span className="font-semibold" data-total-dry-run-count>{allResults.length}</span>
          </div>
          <div>
            <span className="font-mono text-gray-600">Dry-run ready: </span>
            <span className="font-semibold text-green-700">
              {allResults.filter(r => r.dryRunStatus === 'dry_run_ready').length}
            </span>
          </div>
          <div>
            <span className="font-mono text-gray-600">Dry-run blocked: </span>
            <span className="font-semibold text-red-600">
              {allResults.filter(r => r.dryRunStatus === 'dry_run_blocked').length}
            </span>
          </div>
        </div>
      </section>

      {/* Practice decision dry-runs */}
      <section className="space-y-4" data-practice-decision-dry-runs>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
          Practice Decision Emails ({practiceResults.length})
        </h2>
        <div className="space-y-6">
          {practiceResults.map(result => (
            <DryRunCard key={result.templateKey} result={result} />
          ))}
        </div>
      </section>

      {/* Member status dry-runs */}
      <section className="space-y-4" data-member-status-dry-runs>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-2">
          Member Status Emails ({memberResults.length})
        </h2>
        <div className="space-y-6">
          {memberResults.map(result => (
            <DryRunCard key={result.templateKey} result={result} />
          ))}
        </div>
      </section>
    </main>
  )
}
