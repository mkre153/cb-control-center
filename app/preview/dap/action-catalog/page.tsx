// DAP Action Catalog — preview-only admin surface.
// Phase 12 is read-only. No action here executes, mutates, sends, or queues.
// This page shows what actions are available, blocked, future-only, or preview-only, and why.

import Link from 'next/link'
import {
  buildDapActionAvailabilityCatalog,
  DAP_ACTION_CONTEXT_DEMO,
} from '@/lib/cb-control-center/dapActionAvailabilityRules'
import type { DapAction } from '@/lib/cb-control-center/dapActionCatalogTypes'
import type {
  DapActionAvailability,
  DapActionCategory,
  DapActionAuthoritySource,
} from '@/lib/cb-control-center/dapActionCatalogTypes'

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

function authorityPillClass(source: DapActionAuthoritySource): string {
  switch (source) {
    case 'cb_control_center': return 'bg-indigo-50 text-indigo-700'
    case 'client_builder_pro': return 'bg-violet-50 text-violet-700'
    case 'mkcrm_shadow':      return 'bg-amber-50 text-amber-700'
    case 'public_member_page': return 'bg-sky-50 text-sky-700'
    case 'provider_submission': return 'bg-teal-50 text-teal-700'
  }
}

const CATEGORY_LABELS: Record<DapActionCategory, string> = {
  request_workflow:      'Request Workflow',
  admin_review:          'Admin Review',
  provider_participation: 'Provider Participation',
  public_page:           'Public Page',
  member_standing:       'Member Standing',
  communication:         'Communication',
  mkcrm_shadow:          'MKCRM Shadow',
}

const CATEGORY_ORDER: DapActionCategory[] = [
  'request_workflow',
  'admin_review',
  'provider_participation',
  'public_page',
  'member_standing',
  'communication',
  'mkcrm_shadow',
]

// ─── Action card ──────────────────────────────────────────────────────────────

function ActionCard({ action }: { action: DapAction }) {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
      data-action-card
      data-action-key={action.actionKey}
      data-availability={action.availability}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 space-y-0.5">
          <p className="text-sm font-semibold text-gray-900">{action.label}</p>
          <p className="font-mono text-xs text-gray-400">{action.actionKey}</p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold shrink-0 ${availabilityBadgeClass(action.availability)}`}
          data-availability-badge={action.availability}
        >
          {action.availability.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="text-xs text-gray-600">{action.description}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-mono ${authorityPillClass(action.authoritySource)}`}
          data-authority-source={action.authoritySource}
        >
          {action.authoritySource}
        </span>
      </div>

      {action.reasons.length > 0 && (
        <ul className="space-y-0.5" data-reasons>
          {action.reasons.map((r, i) => (
            <li key={i} className="text-xs text-gray-600 flex gap-1.5">
              <span className="text-gray-400">→</span>{r}
            </li>
          ))}
        </ul>
      )}

      {action.blockedBy.length > 0 && (
        <ul className="space-y-0.5" data-blocked-by>
          {action.blockedBy.map((b, i) => (
            <li key={i} className="text-xs text-red-600 flex gap-1.5 font-mono">
              <span>✗</span>{b}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs" data-gates>
        {action.requiredGates.map(gate => {
          const satisfied = action.satisfiedGates.includes(gate)
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

      <div
        className="rounded bg-gray-50 border border-gray-100 px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs font-mono"
        data-safety-flags
      >
        <div>readOnly: <span className="text-green-700 font-semibold">{String(action.safetyFlags.readOnly)}</span></div>
        <div>previewOnly: <span className="text-blue-700 font-semibold">{String(action.safetyFlags.previewOnly)}</span></div>
        <div>sendsEmail: <span className="text-green-700 font-semibold">{String(action.safetyFlags.sendsEmail)}</span></div>
        <div>queuesEmail: <span className="text-green-700 font-semibold">{String(action.safetyFlags.queuesEmail)}</span></div>
        <div>mutatesSupabase: <span className="text-green-700 font-semibold">{String(action.safetyFlags.mutatesSupabase)}</span></div>
        <div>triggersPayment: <span className="text-green-700 font-semibold">{String(action.safetyFlags.triggersPayment)}</span></div>
        <div>triggersMkcrmLiveSync: <span className="text-green-700 font-semibold">{String(action.safetyFlags.triggersMkcrmLiveSync)}</span></div>
        <div>includesPhi: <span className="text-green-700 font-semibold">{String(action.safetyFlags.includesPhi)}</span></div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActionCatalogPreviewPage() {
  const actions = buildDapActionAvailabilityCatalog(DAP_ACTION_CONTEXT_DEMO)

  const byCategory = CATEGORY_ORDER.map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    actions: actions.filter(a => a.category === cat),
  })).filter(g => g.actions.length > 0)

  const counts = {
    available:    actions.filter(a => a.availability === 'available').length,
    blocked:      actions.filter(a => a.availability === 'blocked').length,
    future_only:  actions.filter(a => a.availability === 'future_only').length,
    preview_only: actions.filter(a => a.availability === 'preview_only').length,
  }

  return (
    <main
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
      data-action-catalog-preview-page
    >
      <div>
        <Link href="/preview/dap" className="text-sm text-blue-600 hover:underline">
          ← Back to DAP preview
        </Link>
      </div>

      <div className="space-y-1">
        <h1
          className="text-xl font-semibold text-gray-900"
          data-page-heading="action-catalog"
        >
          DAP Action Catalog
        </h1>
        <p className="text-xs text-gray-400">Preview — internal use only — Phase 12 read-only</p>
      </div>

      {/* Preview-only notice */}
      <section
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-1"
        data-preview-only-notice
        data-authority-notice
      >
        <p className="text-xs font-semibold text-amber-800">Preview-Only Catalog</p>
        <p className="text-xs text-amber-700">
          This catalog describes what admin actions are available, blocked, future-only, or
          preview-only given the current context. No action here executes, mutates, sends,
          queues, or triggers payment. CB Control Center is the admin authority.
          Client Builder Pro is the payment/market system. MKCRM is shadow/reference only.
        </p>
      </section>

      {/* Summary counts */}
      <div className="grid grid-cols-4 gap-3">
        {(['available', 'preview_only', 'blocked', 'future_only'] as const).map(avail => (
          <div key={avail} className={`rounded-lg border px-4 py-3 text-center ${availabilityBadgeClass(avail)}`}>
            <p className="text-lg font-bold">{counts[avail]}</p>
            <p className="text-xs font-medium">{avail.replace(/_/g, ' ')}</p>
          </div>
        ))}
      </div>

      {/* Grouped action cards */}
      {byCategory.map(group => (
        <section key={group.category} className="space-y-3" data-category-group={group.category}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {group.label}
          </h2>
          <div className="space-y-3">
            {group.actions.map(action => (
              <ActionCard key={action.actionKey} action={action} />
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
