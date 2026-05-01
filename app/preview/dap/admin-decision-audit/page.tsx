// DAP Admin Decision Audit — read-only audit and replay-preview surface.
// Phase 16 is read-only. This page does not execute writes, insert rows, update rows,
// delete rows, call Supabase, or introduce any mutation path.
// "Replay" means showing what a future write would have intended — not performing it.
// CB Control Center is the decision authority. MKCRM does not decide. No emails are sent from it.

import Link from 'next/link'
import {
  buildAuditEventsFromDemoContext,
  buildDapAdminDecisionAuditSummary,
  buildDapAdminDecisionReplayPreview,
  AUDIT_SAFETY,
} from '@/lib/cb-control-center/dapAdminDecisionAudit'
import type {
  DapAdminDecisionAuditEvent,
  DapAdminDecisionAuditGroup,
  DapAdminDecisionAuditSummary,
  DapAdminDecisionReplayPreview,
  DapAdminDecisionReplayEligibility,
  DapAdminDecisionWriteEligibility,
} from '@/lib/cb-control-center/dapAdminDecisionAuditTypes'

export const dynamic = 'force-dynamic'

// ─── Badge helpers ────────────────────────────────────────────────────────────

function eligibilityBadgeClass(eligibility: DapAdminDecisionWriteEligibility): string {
  switch (eligibility) {
    case 'eligible_for_future_write': return 'bg-green-50 text-green-700 border border-green-200'
    case 'blocked':                   return 'bg-red-50 text-red-700 border border-red-200'
    case 'preview_only':              return 'bg-blue-50 text-blue-700 border border-blue-200'
  }
}

function replayEligibilityBadgeClass(eligibility: DapAdminDecisionReplayEligibility): string {
  switch (eligibility) {
    case 'eligible_for_replay_preview': return 'bg-green-50 text-green-700'
    case 'blocked_in_source':           return 'bg-red-50 text-red-700'
    case 'future_only':                 return 'bg-blue-50 text-blue-700'
    case 'invalid':                     return 'bg-gray-100 text-gray-500'
  }
}

// ─── Replay preview panel ─────────────────────────────────────────────────────

function ReplayPreviewPanel({ preview }: { preview: DapAdminDecisionReplayPreview }) {
  return (
    <div
      className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3"
      data-replay-preview-panel
      data-replay-mode={preview.replayMode}
      data-executes-write="false"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-700">Replay Preview</span>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${replayEligibilityBadgeClass(preview.replayEligibility)}`}
          data-replay-eligibility={preview.replayEligibility}
        >
          {preview.replayEligibility.replace(/_/g, ' ')}
        </span>
        <span className="text-xs text-gray-400 font-mono italic ml-auto">
          replayMode: {preview.replayMode} · executesWrite: {String(preview.executesWrite)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">intendedTargetTable</span>
          <span className="font-mono text-gray-700">{preview.intendedTargetTable}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">intendedTargetId</span>
          <span className="font-mono text-gray-500 italic">{preview.intendedTargetId}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">intendedSourceActionKey</span>
          <span className="font-mono text-gray-700">{preview.intendedSourceActionKey}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">authoritySource</span>
          <span className="font-mono text-gray-700">{preview.authoritySource}</span>
        </div>
        <div className="flex gap-1.5 col-span-2">
          <span className="text-gray-400 shrink-0">idempotencyKeyPreview</span>
          <span className="font-mono text-gray-500 italic">{preview.idempotencyKeyPreview}</span>
        </div>
        <div className="flex gap-1.5 col-span-2">
          <span className="text-gray-400 shrink-0">intendedWriteEligibility</span>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${eligibilityBadgeClass(preview.intendedWriteEligibility)}`}>
            {preview.intendedWriteEligibility.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <ul className="space-y-0.5">
        {preview.replayValidationMessages.map((msg, i) => (
          <li key={i} className="text-xs text-gray-600 flex gap-1.5">
            <span className="text-gray-400">·</span>{msg}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-1.5">
        {preview.forbiddenFields.slice(0, 6).map(f => (
          <span key={f} className="font-mono text-xs bg-red-50 text-red-600 rounded px-2 py-0.5">
            {f}
          </span>
        ))}
        {preview.forbiddenFields.length > 6 && (
          <span className="text-xs text-gray-400">+{preview.forbiddenFields.length - 6} more forbidden</span>
        )}
      </div>
    </div>
  )
}

// ─── Audit event card ─────────────────────────────────────────────────────────

function AuditEventCard({ event }: { event: DapAdminDecisionAuditEvent }) {
  const replay = buildDapAdminDecisionReplayPreview(event)
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
      data-audit-event-card
      data-audit-key={event.auditKey}
      data-write-eligibility={event.writeEligibility}
      data-replay-eligibility={event.replayEligibility}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 space-y-0.5">
          <p className="text-sm font-semibold text-gray-900">{event.sourceActionKey.replace(/_/g, ' ')}</p>
          <p className="font-mono text-xs text-gray-400">{event.auditKey}</p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold shrink-0 ${eligibilityBadgeClass(event.writeEligibility)}`}
        >
          {event.writeEligibility.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">entityType</span>
          <span className="font-mono text-gray-700">{event.entityType}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">authoritySource</span>
          <span className="font-mono text-gray-700">{event.authoritySource}</span>
        </div>
        <div className="flex gap-1.5 col-span-2">
          <span className="text-gray-400 shrink-0">wouldAppendTo</span>
          <span className="font-mono text-gray-700">{event.wouldAppendTo}</span>
        </div>
        <div className="flex gap-1.5 col-span-2">
          <span className="text-gray-400 shrink-0">idempotencyKeyPreview</span>
          <span className="font-mono text-gray-500 italic">{event.idempotencyKeyPreview}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">auditedByRole</span>
          <span className="font-mono text-gray-700">{event.auditedByRole}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-gray-400 shrink-0">auditedAt</span>
          <span className="font-mono text-gray-500 italic">{event.auditedAt}</span>
        </div>
      </div>

      {event.blockedBy.length > 0 && (
        <ul className="space-y-0.5" data-blocked-by>
          {event.blockedBy.map((b, i) => (
            <li key={i} className="text-xs text-red-600 flex gap-1.5 font-mono">
              <span>✗</span>{b}
            </li>
          ))}
        </ul>
      )}

      <ReplayPreviewPanel preview={replay} />

      <div
        className="rounded bg-gray-50 border border-gray-100 px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs font-mono"
        data-safety-flags
      >
        <div>readOnly: <span className="text-blue-700 font-semibold">{String(event.safetyFlags.readOnly)}</span></div>
        <div>previewOnly: <span className="text-blue-700 font-semibold">{String(event.safetyFlags.previewOnly)}</span></div>
        <div>mutationAllowed: <span className="text-green-700 font-semibold">{String(event.safetyFlags.mutationAllowed)}</span></div>
        <div>replayExecutesWrites: <span className="text-green-700 font-semibold">{String(event.safetyFlags.replayExecutesWrites)}</span></div>
        <div>includesPhi: <span className="text-green-700 font-semibold">{String(event.safetyFlags.includesPhi)}</span></div>
      </div>
    </div>
  )
}

// ─── Group section ────────────────────────────────────────────────────────────

function GroupSection({ group, title }: { group: DapAdminDecisionAuditGroup; title: string }) {
  return (
    <div className="space-y-2" data-audit-group={group.groupKey}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
        <span className="font-mono text-xs text-gray-400">→ {group.groupKey} ({group.count})</span>
      </div>
      <div className="space-y-3">
        {group.events.map(event => (
          <AuditEventCard key={event.auditKey} event={event} />
        ))}
      </div>
    </div>
  )
}

// ─── Summary bar ─────────────────────────────────────────────────────────────

function SummaryBar({ summary }: { summary: DapAdminDecisionAuditSummary }) {
  return (
    <div className="grid grid-cols-4 gap-3" data-audit-summary>
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
        <p className="text-lg font-bold text-green-700">{summary.eligibleCount}</p>
        <p className="text-xs font-medium text-green-600">eligible</p>
      </div>
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center">
        <p className="text-lg font-bold text-red-700">{summary.blockedCount}</p>
        <p className="text-xs font-medium text-red-600">blocked</p>
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center">
        <p className="text-lg font-bold text-blue-700">{summary.previewOnlyCount}</p>
        <p className="text-xs font-medium text-blue-600">preview only</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center">
        <p className="text-lg font-bold text-gray-700">{summary.totalEvents}</p>
        <p className="text-xs font-medium text-gray-500">total</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDecisionAuditPreviewPage() {
  const events  = buildAuditEventsFromDemoContext()
  const summary = buildDapAdminDecisionAuditSummary(events)

  return (
    <main
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
      data-admin-decision-audit-preview-page
    >
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="admin-decision-audit"
        >
          DAP Admin Decision Audit + Replay Preview
        </h1>
        <p className="text-xs text-gray-400">Preview — internal use only — Phase 16 read-only</p>
        <p className="text-xs text-gray-500">{summary.totalEvents} audit events</p>
      </div>

      {/* Read-only notice */}
      <section
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2"
        data-preview-only-notice
        data-authority-notice
      >
        <p className="text-xs font-semibold text-amber-800">
          Audit + Replay Preview Only — This page does not execute writes
        </p>
        <p className="text-xs text-amber-700">
          This is an audit and replay preview only. It does not execute writes, insert rows,
          update rows, delete rows, call Supabase, or introduce any mutation path.
          &ldquo;Replay&rdquo; means showing what a future write would have intended — not performing it.
          No emails are sent from it. No payments are triggered.
          CB Control Center is the decision authority. MKCRM does not decide.
        </p>
        <p className="text-xs text-amber-700">
          Phase 12 = action availability. Phase 13 = event preview. Phase 14 = write contract.
          Phase 15 = SQL contract. Phase 16 = audit/replay preview. Phase 17 will implement
          the guarded admin write flow.
        </p>
      </section>

      {/* Safety flags */}
      <section
        className="rounded-lg border border-gray-200 bg-white p-4"
        data-global-safety-flags
      >
        <p className="text-xs font-semibold text-gray-700 mb-2">Global Safety Flags</p>
        <div className="grid grid-cols-3 gap-x-6 gap-y-0.5 text-xs font-mono">
          <div>readOnly: <span className="text-blue-700 font-semibold">{String(AUDIT_SAFETY.readOnly)}</span></div>
          <div>previewOnly: <span className="text-blue-700 font-semibold">{String(AUDIT_SAFETY.previewOnly)}</span></div>
          <div>mutationAllowed: <span className="text-green-700 font-semibold">{String(AUDIT_SAFETY.mutationAllowed)}</span></div>
          <div>replayExecutesWrites: <span className="text-green-700 font-semibold">{String(AUDIT_SAFETY.replayExecutesWrites)}</span></div>
          <div>includesPhi: <span className="text-green-700 font-semibold">{String(AUDIT_SAFETY.includesPhi)}</span></div>
        </div>
      </section>

      {/* Summary counts */}
      <SummaryBar summary={summary} />

      {/* Grouped by target */}
      <section className="space-y-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Events by Target Table
        </h2>
        {summary.byTarget.map(group => (
          <GroupSection
            key={group.groupKey}
            group={group}
            title={group.groupLabel}
          />
        ))}
      </section>
    </main>
  )
}
