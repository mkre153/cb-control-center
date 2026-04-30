// DAP Admin Decision Write Contract — preview-only validation surface.
// Phase 14 is validation-only. No action here executes, mutates, sends, queues, or triggers payment.
// This page shows the write contract that a future mutation endpoint must satisfy before any
// admin decision is ever appended. CB Control Center is the decision authority.
// MKCRM does not decide — it is shadow/reference only. No emails are sent from it.

import Link from 'next/link'
import {
  buildWriteContractsFromDemoContext,
  WRITE_CONTRACT_SAFETY,
  WRITE_CONTRACT_FORBIDDEN_FIELDS,
} from '@/lib/cb-control-center/dapAdminDecisionWriteContract'
import type { DapAdminDecisionWriteContract } from '@/lib/cb-control-center/dapAdminDecisionWriteContractTypes'
import type {
  DapAdminDecisionWriteEligibility,
  DapAdminDecisionWouldAppendTo,
} from '@/lib/cb-control-center/dapAdminDecisionWriteContractTypes'

export const dynamic = 'force-dynamic'

// ─── Badge helpers ────────────────────────────────────────────────────────────

function eligibilityBadgeClass(eligibility: DapAdminDecisionWriteEligibility): string {
  switch (eligibility) {
    case 'eligible_for_future_write': return 'bg-green-50 text-green-700 border border-green-200'
    case 'blocked':                   return 'bg-red-50 text-red-700 border border-red-200'
    case 'preview_only':              return 'bg-blue-50 text-blue-700 border border-blue-200'
  }
}

const WOULD_APPEND_TO_LABELS: Record<DapAdminDecisionWouldAppendTo, string> = {
  future_dap_admin_decision_events:         'Admin Decision Events',
  future_dap_communication_approval_events: 'Communication Approval Events',
  future_dap_provider_participation_events: 'Provider Participation Events',
  future_dap_mkcrm_shadow_approval_events:  'MKCRM Shadow Approval Events',
}

const ELIGIBILITY_ORDER: DapAdminDecisionWriteEligibility[] = [
  'eligible_for_future_write',
  'blocked',
  'preview_only',
]

const ELIGIBILITY_LABELS: Record<DapAdminDecisionWriteEligibility, string> = {
  eligible_for_future_write: 'Eligible for Future Write',
  blocked:                   'Blocked',
  preview_only:              'Preview Only',
}

// ─── Contract card ────────────────────────────────────────────────────────────

function WriteContractCard({ contract }: { contract: DapAdminDecisionWriteContract }) {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
      data-write-contract-card
      data-contract-key={contract.contractKey}
      data-write-eligibility={contract.writeEligibility}
      data-would-append-to={contract.wouldAppendTo}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 space-y-0.5">
          <p className="text-sm font-semibold text-gray-900">{contract.contractKey.replace(/write_contract_/g, '').replace(/_/g, ' ')}</p>
          <p className="font-mono text-xs text-gray-400">{contract.contractKey}</p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold shrink-0 ${eligibilityBadgeClass(contract.writeEligibility)}`}
          data-eligibility-badge={contract.writeEligibility}
        >
          {contract.writeEligibility.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">sourceEventKey</span>
          <span className="font-mono text-gray-600">{contract.sourceEventKey}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">entityType</span>
          <span className="font-mono text-gray-700">{contract.entityType}</span>
        </div>
        <div className="flex gap-1.5 col-span-2">
          <span className="text-gray-400 shrink-0">wouldAppendTo</span>
          <span className="font-mono text-gray-700">{contract.wouldAppendTo}</span>
        </div>
        <div className="flex gap-1.5 col-span-2">
          <span className="text-gray-400 shrink-0">idempotencyKeyPreview</span>
          <span className="font-mono text-gray-500 italic">{contract.idempotencyKeyPreview}</span>
        </div>
      </div>

      {/* Required fields */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1" data-required-fields-label>Required Fields</p>
        <div className="flex flex-wrap gap-1.5">
          {contract.requiredFields.map(f => (
            <span key={f} className="font-mono text-xs bg-indigo-50 text-indigo-700 rounded px-2 py-0.5" data-required-field={f}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Forbidden fields */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1" data-forbidden-fields-label>Forbidden Fields</p>
        <div className="flex flex-wrap gap-1.5">
          {contract.forbiddenFields.map(f => (
            <span key={f} className="font-mono text-xs bg-red-50 text-red-600 rounded px-2 py-0.5" data-forbidden-field={f}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Authority checks */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1" data-authority-checks-label>Authority Checks</p>
        <ul className="space-y-0.5">
          {contract.authorityChecks.map((check, i) => (
            <li key={i} className="text-xs text-gray-600 flex gap-1.5">
              <span className="text-gray-400">→</span>{check}
            </li>
          ))}
        </ul>
      </div>

      {/* Validation messages */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">Validation Messages</p>
        <ul className="space-y-0.5">
          {contract.validationMessages.map((msg, i) => (
            <li key={i} className="text-xs text-gray-600 flex gap-1.5">
              <span className="text-gray-400">·</span>{msg}
            </li>
          ))}
        </ul>
      </div>

      {/* Blocked by */}
      {contract.blockedBy.length > 0 && (
        <ul className="space-y-0.5" data-blocked-by>
          {contract.blockedBy.map((b, i) => (
            <li key={i} className="text-xs text-red-600 flex gap-1.5 font-mono">
              <span>✗</span>{b}
            </li>
          ))}
        </ul>
      )}

      {/* Safety flags */}
      <div
        className="rounded bg-gray-50 border border-gray-100 px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs font-mono"
        data-safety-flags
      >
        <div>readOnly: <span className="text-blue-700 font-semibold">{String(contract.safetyFlags.readOnly)}</span></div>
        <div>previewOnly: <span className="text-blue-700 font-semibold">{String(contract.safetyFlags.previewOnly)}</span></div>
        <div>validatesOnly: <span className="text-blue-700 font-semibold">{String(contract.safetyFlags.validatesOnly)}</span></div>
        <div>appendsToSupabase: <span className="text-green-700 font-semibold">{String(contract.safetyFlags.appendsToSupabase)}</span></div>
        <div>mutatesStatus: <span className="text-green-700 font-semibold">{String(contract.safetyFlags.mutatesStatus)}</span></div>
        <div>sendsEmail: <span className="text-green-700 font-semibold">{String(contract.safetyFlags.sendsEmail)}</span></div>
        <div>queuesEmail: <span className="text-green-700 font-semibold">{String(contract.safetyFlags.queuesEmail)}</span></div>
        <div>triggersPayment: <span className="text-green-700 font-semibold">{String(contract.safetyFlags.triggersPayment)}</span></div>
        <div>triggersMkcrmLiveSync: <span className="text-green-700 font-semibold">{String(contract.safetyFlags.triggersMkcrmLiveSync)}</span></div>
        <div>callsWebhook: <span className="text-green-700 font-semibold">{String(contract.safetyFlags.callsWebhook)}</span></div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDecisionWriteContractPreviewPage() {
  const contracts = buildWriteContractsFromDemoContext()

  const byEligibility = ELIGIBILITY_ORDER.map(eligibility => ({
    eligibility,
    label: ELIGIBILITY_LABELS[eligibility],
    contracts: contracts.filter(c => c.writeEligibility === eligibility),
  })).filter(g => g.contracts.length > 0)

  const counts = {
    eligible_for_future_write: contracts.filter(c => c.writeEligibility === 'eligible_for_future_write').length,
    blocked:                   contracts.filter(c => c.writeEligibility === 'blocked').length,
    preview_only:              contracts.filter(c => c.writeEligibility === 'preview_only').length,
  }

  return (
    <main
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
      data-write-contract-preview-page
    >
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="admin-decision-write-contract"
        >
          DAP Admin Decision Write Contract
        </h1>
        <p className="text-xs text-gray-400">Preview — internal use only — Phase 14 validation-only</p>
        <p className="text-xs text-gray-500">{contracts.length} write contracts defined</p>
      </div>

      {/* Preview-only notice */}
      <section
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2"
        data-preview-only-notice
        data-authority-notice
      >
        <p className="text-xs font-semibold text-amber-800">Validation-Only Contract — No Writes</p>
        <p className="text-xs text-amber-700">
          This page defines the validation contract that a future mutation endpoint must satisfy
          before any admin decision event is ever appended. No decision is written here.
          No status is mutated. No emails are sent from it. No payments are triggered.
          CB Control Center is the decision authority. MKCRM does not decide — it is
          shadow/reference only. Client Builder Pro is the payment and market system.
        </p>
        <p className="text-xs text-amber-700">
          Phase 12 = action availability. Phase 13 = event preview. Phase 14 = write contract.
          A future phase will implement the actual append-only writer behind appropriate guardrails.
        </p>
      </section>

      {/* Forbidden fields notice */}
      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2" data-forbidden-fields-notice>
        <p className="text-xs font-semibold text-gray-700">Universal Forbidden Fields ({WRITE_CONTRACT_FORBIDDEN_FIELDS.length})</p>
        <p className="text-xs text-gray-500">These field names must never appear in any write payload, regardless of event type.</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {WRITE_CONTRACT_FORBIDDEN_FIELDS.map(f => (
            <span key={f} className="font-mono text-xs bg-red-50 text-red-600 rounded px-2 py-0.5">
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-3">
        {ELIGIBILITY_ORDER.map(e => (
          <div key={e} className={`rounded-lg border px-4 py-3 text-center ${eligibilityBadgeClass(e)}`}>
            <p className="text-lg font-bold">{counts[e]}</p>
            <p className="text-xs font-medium">{e.replace(/_/g, ' ')}</p>
          </div>
        ))}
      </div>

      {/* Grouped by eligibility */}
      {byEligibility.map(group => (
        <section
          key={group.eligibility}
          className="space-y-3"
          data-eligibility-group={group.eligibility}
        >
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {group.label}
          </h2>
          <div className="space-y-3">
            {group.contracts.map(contract => (
              <WriteContractCard key={contract.contractKey} contract={contract} />
            ))}
          </div>
        </section>
      ))}

      {/* wouldAppendTo legend */}
      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-700">Target Table Legend</p>
        <div className="space-y-1">
          {Object.entries(WOULD_APPEND_TO_LABELS).map(([key, label]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="font-mono text-gray-500">{key}</span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
