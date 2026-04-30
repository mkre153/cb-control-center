// DAP Admin Decision Ledger — preview-only admin surface.
// Phase 13 is read-only. No action here executes, mutates, sends, queues, or triggers payment.
// This page shows what append-only events would be produced if admin decisions were wired up.
// CB Control Center is the decision authority. MKCRM does not decide. No emails are sent from it.

import Link from 'next/link'
import {
  buildDapAdminDecisionLedger,
  DAP_LEDGER_CONTEXT_DEMO,
  DAP_LEDGER_DEFINITIONS,
} from '@/lib/cb-control-center/dapAdminDecisionLedger'
import type { DapAdminDecisionLedgerEvent } from '@/lib/cb-control-center/dapAdminDecisionLedgerTypes'
import type {
  DapAdminDecisionWouldAppendTo,
  DapAdminDecisionOutcome,
} from '@/lib/cb-control-center/dapAdminDecisionLedgerTypes'
import type { DapActionAvailability } from '@/lib/cb-control-center/dapActionCatalogTypes'

export const dynamic = 'force-dynamic'

// ─── Badge helpers ────────────────────────────────────────────────────────────

function availabilityBadgeClass(availability: DapActionAvailability): string {
  switch (availability) {
    case 'available':    return 'bg-green-50 text-green-700 border border-green-200'
    case 'blocked':      return 'bg-red-50 text-red-700 border border-red-200'
    case 'future_only':  return 'bg-gray-100 text-gray-500 border border-gray-200'
    case 'preview_only': return 'bg-blue-50 text-blue-700 border border-blue-200'
  }
}

function outcomeBadgeClass(outcome: DapAdminDecisionOutcome): string {
  switch (outcome) {
    case 'approved':  return 'bg-green-50 text-green-700'
    case 'confirmed': return 'bg-green-50 text-green-700'
    case 'passed':    return 'bg-green-50 text-green-700'
    case 'rejected':  return 'bg-red-50 text-red-700'
    case 'declined':  return 'bg-red-50 text-red-700'
    case 'failed':    return 'bg-orange-50 text-orange-700'
  }
}

const WOULD_APPEND_TO_LABELS: Record<DapAdminDecisionWouldAppendTo, string> = {
  future_dap_admin_decision_events:        'Admin Decision Events',
  future_dap_communication_approval_events: 'Communication Approval Events',
  future_dap_provider_participation_events: 'Provider Participation Events',
  future_dap_mkcrm_shadow_approval_events:  'MKCRM Shadow Approval Events',
}

const WOULD_APPEND_TO_ORDER: DapAdminDecisionWouldAppendTo[] = [
  'future_dap_admin_decision_events',
  'future_dap_communication_approval_events',
  'future_dap_provider_participation_events',
  'future_dap_mkcrm_shadow_approval_events',
]

// ─── Event card ───────────────────────────────────────────────────────────────

function LedgerEventCard({ event }: { event: DapAdminDecisionLedgerEvent }) {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
      data-ledger-event-card
      data-event-key={event.eventKey}
      data-would-append-to={event.wouldAppendTo}
      data-action-availability={event.actionAvailability}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 space-y-0.5">
          <p className="text-sm font-semibold text-gray-900">{event.decisionLabel}</p>
          <p className="font-mono text-xs text-gray-400">{event.eventKey}</p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold shrink-0 ${outcomeBadgeClass(event.decisionOutcome)}`}
          data-decision-outcome={event.decisionOutcome}
        >
          {event.decisionOutcome}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">eventType</span>
          <span className="font-mono text-gray-700">{event.eventType}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">entityType</span>
          <span className="font-mono text-gray-700">{event.entityType}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">sourceActionKey</span>
          <span className="font-mono text-gray-700">{event.sourceActionKey}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">authoritySource</span>
          <span className="font-mono text-gray-700">{event.authoritySource}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">createdByRole</span>
          <span className="font-mono text-gray-700">{event.createdByRole}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">createdAtPreview</span>
          <span className="font-mono text-gray-500 italic">{event.createdAtPreview}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">reasonCode</span>
          <span className="font-mono text-gray-700">{event.reasonCode}</span>
        </div>
        <div className="flex gap-1.5 col-span-2">
          <span className="text-gray-400 shrink-0">reasonLabel</span>
          <span className="text-gray-700">{event.reasonLabel}</span>
        </div>
      </div>

      {/* Action availability */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">actionAvailability</span>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${availabilityBadgeClass(event.actionAvailability)}`}
          data-action-availability-badge={event.actionAvailability}
        >
          {event.actionAvailability.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Gates */}
      {event.requiredGates.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs" data-gates>
          {event.requiredGates.map(gate => {
            const satisfied = event.satisfiedGates.includes(gate)
            return (
              <div key={gate} className="flex items-center gap-1 font-mono">
                <span className={satisfied ? 'text-green-600' : 'text-gray-300'}>
                  {satisfied ? '✓' : '○'}
                </span>
                <span className={satisfied ? 'text-gray-700' : 'text-gray-400'}>{gate}</span>
              </div>
            )
          })}
        </div>
      )}

      {event.blockedBy.length > 0 && (
        <ul className="space-y-0.5" data-blocked-by>
          {event.blockedBy.map((b, i) => (
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
        <div>previewOnly: <span className="text-blue-700 font-semibold">{String(event.safetyFlags.previewOnly)}</span></div>
        <div>appendsToSupabase: <span className="text-green-700 font-semibold">{String(event.safetyFlags.appendsToSupabase)}</span></div>
        <div>mutatesStatus: <span className="text-green-700 font-semibold">{String(event.safetyFlags.mutatesStatus)}</span></div>
        <div>sendsEmail: <span className="text-green-700 font-semibold">{String(event.safetyFlags.sendsEmail)}</span></div>
        <div>queuesEmail: <span className="text-green-700 font-semibold">{String(event.safetyFlags.queuesEmail)}</span></div>
        <div>triggersPayment: <span className="text-green-700 font-semibold">{String(event.safetyFlags.triggersPayment)}</span></div>
        <div>triggersMkcrmLiveSync: <span className="text-green-700 font-semibold">{String(event.safetyFlags.triggersMkcrmLiveSync)}</span></div>
        <div>includesPhi: <span className="text-green-700 font-semibold">{String(event.safetyFlags.includesPhi)}</span></div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDecisionLedgerPreviewPage() {
  const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)

  const byTarget = WOULD_APPEND_TO_ORDER.map(target => ({
    target,
    label: WOULD_APPEND_TO_LABELS[target],
    events: events.filter(e => e.wouldAppendTo === target),
  })).filter(g => g.events.length > 0)

  return (
    <main
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
      data-admin-decision-ledger-preview-page
    >
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="admin-decision-ledger"
        >
          DAP Admin Decision Ledger
        </h1>
        <p className="text-xs text-gray-400">Preview — internal use only — Phase 13 read-only</p>
        <p className="text-xs text-gray-500">{DAP_LEDGER_DEFINITIONS.length} ledger event definitions</p>
      </div>

      {/* Preview-only notice */}
      <section
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2"
        data-preview-only-notice
        data-authority-notice
      >
        <p className="text-xs font-semibold text-amber-800">Preview-Only Ledger — No Real Events</p>
        <p className="text-xs text-amber-700">
          This page previews what append-only events admin decisions <em>would</em> produce if the
          action pipeline were wired up. No events are appended to Supabase. No status is mutated.
          No emails are sent from it. No payments are triggered. MKCRM does not decide — it is a
          shadow/reference system only. CB Control Center is the decision authority.
        </p>
        <p className="text-xs text-amber-700">
          The <code>wouldAppendTo</code> field describes which future append-only table each event
          would target. These tables do not yet exist.
        </p>
      </section>

      {/* Grouped by wouldAppendTo */}
      {byTarget.map(group => (
        <section
          key={group.target}
          className="space-y-3"
          data-ledger-group={group.target}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {group.label}
            </h2>
            <span className="font-mono text-xs text-gray-400">→ {group.target}</span>
          </div>
          <div className="space-y-3">
            {group.events.map(event => (
              <LedgerEventCard key={event.eventKey} event={event} />
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
